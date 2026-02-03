import { Router } from 'express';
import { seedDatabase } from '../controllers/seedController';

const router = Router();

// Seed database endpoint (for development/testing)
router.post('/', seedDatabase);

export default router;


