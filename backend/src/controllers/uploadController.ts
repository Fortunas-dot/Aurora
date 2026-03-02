import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { storeFile } from '../services/mongoStorage';

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
    fileSize: 50 * 1024 * 1024, // 50MB (supports images, videos, and audio files)
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

    console.log('Upload received:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Store file in MongoDB GridFS for persistence across deploys
    try {
      await storeFile(req.file.path, req.file.filename, req.file.mimetype);
      console.log('✅ File stored in MongoDB GridFS:', req.file.filename);
      
      // Delete local temp file after storing in MongoDB
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.warn('Could not delete temp file:', unlinkErr);
      }
    } catch (gridfsErr) {
      console.error('❌ GridFS storage failed, file still available locally:', gridfsErr);
      // File is still on local filesystem as fallback
    }

    // Return file URL - use absolute URL for production
    const baseUrl = process.env.BASE_URL || 'https://aurora-production.up.railway.app';
    const relativeUrl = `/uploads/${req.file.filename}`;
    const fileUrl = `${baseUrl}${relativeUrl}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
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
