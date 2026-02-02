import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import Notification from '../models/Notification';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

// Store active WebSocket connections
const activeConnections = new Map<string, AuthenticatedWebSocket>();

/**
 * WebSocket handler for notifications
 */
export const handleNotificationWebSocket = (ws: AuthenticatedWebSocket, req: any): void => {
  console.log('New WebSocket connection attempt');

  // Extract token from query string
  const url = new URL(req.url || '', 'http://localhost');
  const token = url.searchParams.get('token');

  if (!token) {
    console.log('No token provided, closing connection');
    ws.close(1008, 'Authentication required');
    return;
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    ws.userId = decoded.userId;

    // Store connection
    activeConnections.set(decoded.userId, ws);
    console.log(`✅ WebSocket connected for user: ${decoded.userId}`);

    // Send initial unread count
    sendUnreadCount(decoded.userId);

    // Handle messages from client
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket disconnected for user: ${decoded.userId}`);
      activeConnections.delete(decoded.userId);
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      activeConnections.delete(decoded.userId);
    });

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    ws.on('close', () => {
      clearInterval(pingInterval);
    });

  } catch (error) {
    console.error('WebSocket authentication error:', error);
    ws.close(1008, 'Invalid token');
  }
};

/**
 * Send notification to user via WebSocket
 */
export const sendNotificationToUser = async (userId: string, notification: any): Promise<void> => {
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === 1) { // OPEN
    try {
      ws.send(JSON.stringify({
        type: 'notification',
        notification,
      }));
    } catch (error) {
      console.error('Error sending notification via WebSocket:', error);
    }
  }
};

/**
 * Send unread count update to user via WebSocket
 */
export const sendUnreadCountUpdate = async (userId: string): Promise<void> => {
  await sendUnreadCount(userId);
};

/**
 * Send unread count to user
 */
const sendUnreadCount = async (userId: string): Promise<void> => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    const ws = activeConnections.get(userId);
    if (ws && ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify({
        type: 'unread_count',
        count: unreadCount,
      }));
    }
  } catch (error) {
    console.error('Error sending unread count:', error);
  }
};

/**
 * Broadcast notification to all connected clients (for admin purposes)
 */
export const broadcastNotification = (notification: any): void => {
  const message = JSON.stringify({
    type: 'notification',
    notification,
  });

  activeConnections.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(message);
    }
  });
};

