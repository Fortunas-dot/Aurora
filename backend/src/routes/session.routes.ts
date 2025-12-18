/**
 * Session Routes
 * /api/sessions/*
 */

import { Router } from 'express';
import {
  createSession,
  sendMessage,
  endSession,
  getSession,
  getSessions,
} from '../controllers/session.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Session routes
router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.post('/:id/message', sendMessage);
router.put('/:id/end', endSession);

export default router;
