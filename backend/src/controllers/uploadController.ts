import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { storeFile } from '../services/mongoStorage';
import { uploadVideoToCloudflare } from '../services/videoTranscode.service';

// Ensure uploads directory exists (used as temp storage before MongoDB)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer (saves to local disk temporarily, then we move to MongoDB)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images, videos, and audio (including x-m4a for iOS recordings)
  if (
    file.mimetype.startsWith('image/') || 
    file.mimetype.startsWith('video/') || 
    file.mimetype.startsWith('audio/') ||
    file.mimetype === 'audio/x-m4a' // iOS audio recordings
  ) {
    cb(null, true);
  } else {
    console.error('File upload rejected - invalid MIME type:', file.mimetype);
    cb(new Error('Only images, videos, and audio files are allowed'));
  }
};

export const upload = multer({
  storage,
  limits: {
    // Lower the hard limit to reduce risk of huge uploads overwhelming storage.
    // For videos, we rely on the streaming provider to compress/transcode.
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter,
});

// @desc    Upload image/video/audio
// @route   POST /api/upload
// @access  Private
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      console.error('Upload error: No file in request');
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const { filename, mimetype, size, path: localPath } = req.file;

    console.log('Upload received:', {
      filename,
      mimetype,
      size,
    });

    let finalUrl: string | null = null;

    // If this is a video, prefer sending it to the external streaming provider
    // which will handle transcoding/compression and deliver an optimized stream.
    if (mimetype.startsWith('video/')) {
      try {
        const transcoded = await uploadVideoToCloudflare(localPath, filename);

        if (transcoded?.playbackUrl) {
          finalUrl = transcoded.playbackUrl;
        }
      } catch (err) {
        console.error('❌ Error uploading video to streaming provider:', err);
      }
    }

    // For images/audio (or if external upload failed), fall back to existing GridFS storage
    if (!finalUrl) {
      try {
        await storeFile(localPath, filename, mimetype);
        console.log('✅ File stored in MongoDB GridFS:', filename);

        // Return file URL - use absolute URL for production
        const baseUrl = process.env.BASE_URL || 'https://aurora-production.up.railway.app';
        const relativeUrl = `/uploads/${filename}`;
        finalUrl = `${baseUrl}${relativeUrl}`;
      } catch (gridfsErr) {
        console.error('❌ GridFS storage failed, file still available locally:', gridfsErr);
        // As a last resort, expose the local URL so the file is still usable
        const baseUrl = process.env.BASE_URL || 'https://aurora-production.up.railway.app';
        const relativeUrl = `/uploads/${filename}`;
        finalUrl = `${baseUrl}${relativeUrl}`;
      }
    }

    // Always try to delete the local temp file at this point
    try {
      fs.unlinkSync(localPath);
    } catch (unlinkErr) {
      console.warn('Could not delete temp file:', unlinkErr);
    }

    res.json({
      success: true,
      data: {
        url: finalUrl,
        filename,
        mimetype,
        size,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file',
    });
  }
};
