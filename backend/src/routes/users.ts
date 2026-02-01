import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  getUserPosts,
  registerPushToken,
  followUser,
  getFollowers,
  getFollowing,
} from '../controllers/userController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Routes
router.get('/search', searchUsers);
router.post('/push-token', protect, registerPushToken);
router.post('/:id/follow', protect, followUser);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);
router.get('/:id', optionalAuth, getUserProfile);
router.get('/:id/posts', optionalAuth, getUserPosts);
router.put('/profile', protect, updateProfile);

export default router;






