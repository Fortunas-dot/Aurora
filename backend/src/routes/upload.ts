import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadFile, upload } from '../controllers/uploadController';
import { protect } from '../middleware/auth';

const router = Router();

// Wrap multer in error handler to return proper error messages
router.post('/', protect, (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific error (file too large, etc.)
      console.error('Multer error:', err.message, err.code);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 50MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      // Other errors (e.g., invalid file type from fileFilter)
      console.error('Upload middleware error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
    // No error, proceed to uploadFile handler
    next();
  });
}, uploadFile);

export default router;







