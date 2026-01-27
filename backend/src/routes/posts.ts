import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  reportPost,
} from '../controllers/postController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation
const postValidation = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 2000 })
    .withMessage('Content cannot exceed 2000 characters'),
];

// Routes
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', protect, postValidation, createPost);
router.put('/:id', protect, postValidation, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/report', protect, body('reason').notEmpty(), reportPost);

export default router;

