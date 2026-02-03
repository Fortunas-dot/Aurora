import express from 'express';
import {
  getIdeas,
  getIdea,
  createIdea,
  upvoteIdea,
  downvoteIdea,
  updateIdeaStatus,
} from '../controllers/ideaController';
import { protect, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', optionalAuth, getIdeas);
router.get('/:id', optionalAuth, getIdea);
router.post('/', protect, createIdea);
router.post('/:id/upvote', protect, upvoteIdea);
router.post('/:id/downvote', protect, downvoteIdea);
router.put('/:id/status', protect, updateIdeaStatus);

export default router;


