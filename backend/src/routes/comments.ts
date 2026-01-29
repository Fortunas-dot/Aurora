import { Router } from 'express';
import { body } from 'express-validator';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  reportComment,
} from '../controllers/commentController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation
const commentValidation = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
];

// Routes
router.get('/post/:postId', optionalAuth, getComments);
router.post('/', protect, [...commentValidation, body('postId').notEmpty()], createComment);
router.put('/:id', protect, commentValidation, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.post('/:id/report', protect, body('reason').notEmpty(), reportComment);

export default router;






