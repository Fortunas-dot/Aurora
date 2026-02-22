import { Router } from 'express';
import { body } from 'express-validator';
import {
  createJournal,
  getUserJournals,
  getPublicJournals,
  getJournal,
  updateJournal,
  deleteJournal,
  followJournal,
  unfollowJournal,
  getFollowingJournals,
} from '../controllers/journalController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation
const journalValidation = [
  body('name')
    .notEmpty()
    .withMessage('Journal name is required')
    .isLength({ max: 100 })
    .withMessage('Journal name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('topics')
    .optional()
    .isArray()
    .withMessage('Topics must be an array'),
  body('topics.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each topic must be a string'),
];

const updateValidation = [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Journal name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('topics')
    .optional()
    .isArray()
    .withMessage('Topics must be an array'),
  body('topics.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each topic must be a string'),
];

// Public routes (before protect middleware)
router.get('/public', getPublicJournals);
router.get('/:id', optionalAuth, getJournal); // Allow viewing public journals without auth

// All other routes require authentication
router.use(protect);

// Following routes (before :id routes)
router.get('/following', getFollowingJournals);

// CRUD routes
router.post('/', journalValidation, createJournal);
router.get('/', getUserJournals);
router.put('/:id', updateValidation, updateJournal);
router.delete('/:id', deleteJournal);

// Follow/unfollow routes
router.post('/:id/follow', followJournal);
router.post('/:id/unfollow', unfollowJournal);

export default router;
