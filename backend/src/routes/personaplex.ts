import { Router, Request, Response } from 'express';
import expressWs from 'express-ws';
import jwt from 'jsonwebtoken';
import { personaplexProxy } from '../services/personaplexProxy.service';
import { formatCompleteContextForAI } from '../utils/healthInfoFormatter';
import JournalEntry from '../models/JournalEntry';
import User from '../models/User';

export default function createPersonaPlexRouter() {
  const router = Router();

  // Apply express-ws to this router to enable .ws() routes
  // This must be done before defining any .ws() routes
  expressWs(router as any);

  // Health check endpoint for PersonaPlex route
  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'personaplex' });
  });

  // WebSocket endpoint voor PersonaPlex
  (router as any).ws('/ws', async (ws: any, req: any) => {
    console.log('🔌 PersonaPlex WebSocket connection attempt');

    try {
      // Authenticate user from query params or headers
      const token =
        (req as any).query?.token || (req as any).headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.error('❌ No token provided');
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify token and get user
      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError);
        ws.close(1008, 'Invalid token');
        return;
      }

      const user = await User.findById(decoded.userId);

      if (!user) {
        console.error('❌ User not found:', decoded.userId);
        ws.close(1008, 'User not found');
        return;
      }

      console.log(`🔌 PersonaPlex connection from user: ${user._id}`);

      // Load journal context
      let journalEntries: any[] = [];
      try {
        journalEntries = await JournalEntry.find({ author: user._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('content mood symptoms aiInsights createdAt');
      } catch (error) {
        console.log('Could not load journal context:', error);
      }

      // Format complete context for AI
      const healthContext = formatCompleteContextForAI(user, journalEntries);

      // Base therapist prompt
      const basePrompt = `Je bent Aurora, een warme en empathische AI therapeut. Je luistert aandachtig, stelt doordachte vragen en biedt ondersteunende begeleiding. Je bent warm, begripvol en niet-oordelend. Je helpt mensen hun gedachten en gevoelens te verkennen op een veilige en ondersteunende manier. Houd je antwoorden beknopt voor spraakgesprekken. Spreek altijd in het Nederlands.`;

      const fullPrompt = basePrompt + (healthContext ? '\n\n' + healthContext : '');

      // Create bridge to PersonaPlex server
      await personaplexProxy.createBridge(ws as any, fullPrompt, 'NATF2.pt');

      console.log('✅ PersonaPlex bridge established');
    } catch (error: any) {
      console.error('❌ Failed to create PersonaPlex bridge:', error);
      console.error('Error stack:', error.stack);
      try {
        // Check if WebSocket is open (readyState 1 = OPEN)
        if (ws.readyState === 1) {
          ws.close(1011, error.message || 'Failed to connect to PersonaPlex');
        }
      } catch (closeError) {
        console.error('Error closing WebSocket:', closeError);
      }
    }
  });

  return router;
}

