import express from 'express';
import { getOnlineTherapistsCount } from '../controllers/therapistController';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/online-count', optionalAuth, getOnlineTherapistsCount);

export default router;

