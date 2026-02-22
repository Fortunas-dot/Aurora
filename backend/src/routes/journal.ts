import { Router } from 'express';
import { body } from 'express-validator';
import {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getInsights,
  analyzeEntry,
  getPrompt,
  getAuroraContext,
  finishChatSession,
  saveChatContext,
} from '../controllers/journalController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation
const entryValidation = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 10000 })
    .withMessage('Content cannot exceed 10000 characters'),
  body('mood')
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood must be between 1 and 10'),
];

const updateValidation = [
  body('content')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Content cannot exceed 10000 characters'),
  body('mood')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood must be between 1 and 10'),
];

// Public routes (allow viewing public journal entries without auth)
router.get('/', optionalAuth, getEntries);

// Specific routes that require auth (must be before :id route to avoid matching)
// These are protected individually to ensure they're matched before the catch-all :id route
router.get('/insights', protect, getInsights);
router.get('/prompt', protect, getPrompt);
router.get('/aurora-context', protect, getAuroraContext);
router.post('/finish-session', protect, finishChatSession);
router.post('/save-chat-context', protect, saveChatContext);

// Catch-all route for entry IDs (must be after specific routes)
router.get('/:id', optionalAuth, getEntry);

// All other routes require authentication
router.use(protect);

// CRUD routes (create, update, delete require auth)
router.post('/', entryValidation, createEntry);
router.put('/:id', updateValidation, updateEntry);
router.delete('/:id', deleteEntry);

// AI analysis
router.post('/:id/analyze', analyzeEntry);

export default router;







