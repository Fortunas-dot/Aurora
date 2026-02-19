import { Router } from 'express';
import { body } from 'express-validator';
import {
  getGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  updateGroup,
  reportGroup,
} from '../controllers/groupController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation
const groupValidation = [
  body('name')
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 100 })
    .withMessage('Group name cannot exceed 100 characters'),
];

// Routes
router.get('/', optionalAuth, getGroups);
router.get('/:id', optionalAuth, getGroup);
router.post('/', protect, groupValidation, createGroup);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);
router.put('/:id', protect, groupValidation, updateGroup);
router.get('/:id/posts', optionalAuth, getGroupPosts);
router.post('/:id/report', protect, reportGroup);

export default router;







