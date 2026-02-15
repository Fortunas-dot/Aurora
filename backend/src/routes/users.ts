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
  blockUser,
  getBlockedUsers,
  deleteAccount,
} from '../controllers/userController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Routes
// IMPORTANT: Specific routes (like /blocked) must come BEFORE parameterized routes (like /:id)
// Otherwise Express will match /blocked as /:id with id="blocked"
router.get('/search', searchUsers);
router.post('/push-token', protect, registerPushToken);
router.get('/blocked', protect, getBlockedUsers); // Must be before /:id
router.put('/profile', protect, updateProfile);
router.delete('/account', protect, deleteAccount);
router.post('/:id/follow', protect, followUser);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);
router.get('/:id/posts', optionalAuth, getUserPosts);
router.post('/:id/block', protect, blockUser);
router.get('/:id', optionalAuth, getUserProfile); // Must be last

export default router;






