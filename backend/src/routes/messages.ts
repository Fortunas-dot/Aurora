import { Router } from 'express';
import { body } from 'express-validator';
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  reactToMessage,
  searchMessages,
} from '../controllers/messageController';
import { protect } from '../middleware/auth';

const router = Router();

// Validation
const messageValidation = [
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters'),
];

// Routes
router.get('/conversations', protect, getConversations);
router.get('/conversation/:userId', protect, getConversation);
router.get('/conversation/:userId/search', protect, searchMessages);
router.post('/', protect, messageValidation, sendMessage);
router.put('/:id/read', protect, markAsRead);
router.post('/:id/react', protect, body('emoji').notEmpty(), reactToMessage);

export default router;






