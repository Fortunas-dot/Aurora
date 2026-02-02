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
  getTrendingPosts,
  getFollowingPosts,
  getJoinedGroupsPosts,
  getSavedPosts,
  savePost,
  searchPosts,
} from '../controllers/postController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation
const postValidation = [
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 2000 })
    .withMessage('Content cannot exceed 2000 characters'),
];

// Base GET route (must be first)
router.get('/', optionalAuth, getPosts);

// Special GET routes (must be before /:id to avoid route conflicts)
router.get('/trending', optionalAuth, getTrendingPosts);
router.get('/following', protect, getFollowingPosts);
router.get('/joined-groups', protect, getJoinedGroupsPosts);
router.get('/saved', protect, getSavedPosts);
router.get('/search', optionalAuth, searchPosts);

// Single post GET route (must be after special routes)
router.get('/:id', optionalAuth, getPost);

// POST routes
router.post('/', protect, postValidation, createPost);

// PUT/DELETE routes
router.put('/:id', protect, postValidation, updatePost);
router.delete('/:id', protect, deletePost);

// POST routes with :id (must be after GET /:id)
router.post('/:id/like', protect, likePost);
router.post('/:id/save', protect, savePost);
router.post('/:id/report', protect, body('reason').notEmpty(), reportPost);

export default router;






