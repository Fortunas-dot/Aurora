import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
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

    console.log('Upload successful:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Return file URL (in production, this would be a CDN URL)
    const fileUrl = `/uploads/${req.file.filename}`;

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







