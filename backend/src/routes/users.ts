import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  getUserPosts,
  registerPushToken,
} from '../controllers/userController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Routes
router.get('/search', searchUsers);
router.post('/push-token', protect, registerPushToken);
router.get('/:id', optionalAuth, getUserProfile);
router.get('/:id/posts', optionalAuth, getUserPosts);
router.put('/profile', protect, updateProfile);

export default router;






