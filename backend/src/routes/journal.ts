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
import { protect } from '../middleware/auth';

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

// All routes require authentication
router.use(protect);

// Insights and prompts (before :id routes)
router.get('/insights', getInsights);
router.get('/prompt', getPrompt);
router.get('/aurora-context', getAuroraContext);
router.post('/finish-session', finishChatSession);
router.post('/save-chat-context', saveChatContext);

// CRUD routes
router.get('/', getEntries);
router.get('/:id', getEntry);
router.post('/', entryValidation, createEntry);
router.put('/:id', updateValidation, updateEntry);
router.delete('/:id', deleteEntry);

// AI analysis
router.post('/:id/analyze', analyzeEntry);

export default router;







