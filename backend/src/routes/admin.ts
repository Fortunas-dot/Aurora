import { Router, Request, Response, NextFunction } from 'express';
import { getPresenceSnapshot } from '../controllers/notificationWebSocket';

const router = Router();

/**
 * Guard for server-to-server admin calls (e.g. the Aurora website dashboard).
 * Authenticates with a shared secret in the Authorization header rather than a
 * user JWT, since the caller is a trusted backend, not an app user.
 *   Authorization: Bearer <ADMIN_PRESENCE_TOKEN>
 */
const requireAdminToken = (req: Request, res: Response, next: NextFunction): void => {
  const expected = process.env.ADMIN_PRESENCE_TOKEN;
  if (!expected) {
    res.status(503).json({ success: false, message: 'Admin presence not configured' });
    return;
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || token !== expected) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  next();
};

/** Live presence snapshot: how many users are online and on which screen. */
router.get('/presence', requireAdminToken, (_req: Request, res: Response) => {
  res.json({ success: true, data: getPresenceSnapshot() });
});

export default router;
