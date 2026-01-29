import { Router } from 'express';
import { uploadFile, upload } from '../controllers/uploadController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, upload.single('file'), uploadFile);

export default router;





