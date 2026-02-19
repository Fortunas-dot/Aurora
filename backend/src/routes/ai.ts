import { Router } from 'express';
import { streamChat, completeChat } from '../controllers/aiChatController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Streaming chat endpoint
router.post('/chat', streamChat);

// Non-streaming completion endpoint
router.post('/chat/complete', completeChat);

export default router;
