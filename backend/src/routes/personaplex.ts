import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Use express-ws style router if available; fall back to normal router.
const baseRouter = Router() as any;
const router: express.Router & { ws?: (path: string, handler: (ws: any, req: any) => void) => void } = baseRouter;

// NOTE: This is a minimal placeholder to avoid insecure compiled code using a fallback JWT secret.
// The actual Personaplex functionality can be implemented later if needed.

router.ws?.('/personaplex', (ws: any, req: any) => {
  // Require a JWT secret; never use a fallback
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not configured');
    ws.close(1011, 'Server configuration error');
    return;
  }

  const url = new URL(req.url || '', 'http://localhost');
  const token = url.searchParams.get('token') ||
    (req.headers?.authorization || '').replace('Bearer ', '');

  if (!token) {
    console.error('❌ No token provided');
    ws.close(1008, 'Authentication required');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    // Optionally verify user exists
    void User.findById(decoded.userId).then((user) => {
      if (!user) {
        console.error('❌ User not found for Personaplex WS:', decoded.userId);
        ws.close(1008, 'User not found');
      }
    }).catch((err) => {
      console.error('❌ Error loading user for Personaplex WS:', err);
      ws.close(1011, 'Server error');
    });
  } catch (err) {
    console.error('❌ JWT verification failed for Personaplex WS:', err);
    ws.close(1008, 'Invalid token');
    return;
  }

  // For now, immediately close; no active Personaplex feature yet.
  ws.close(1000, 'Personaplex endpoint not implemented');
});

export default router;

