import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import Notification from '../models/Notification';
import { sendPushNotification, notificationMessages } from '../services/pushNotification.service';
import { NotificationType } from '../models/Notification';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

// Store active WebSocket connections
const activeConnections = new Map<string, AuthenticatedWebSocket>();

/**
 * Check if user is currently connected via WebSocket
 */
export const isUserOnline = (userId: string): boolean => {
  const ws = activeConnections.get(userId);
  return ws !== undefined && ws.readyState === 1; // OPEN
};

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
    // Verify JWT token - JWT_SECRET must be set
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
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
 * Send notification to user via WebSocket and/or push notification
 * If user is online (WebSocket connected), sends via WebSocket
 * If user is offline, sends push notification to their device
 */
export const sendNotificationToUser = async (userId: string, notification: any): Promise<void> => {
  const ws = activeConnections.get(userId);
  const notificationData = notification.toObject ? notification.toObject() : notification;
  
  // Ensure createdAt exists
  if (!notificationData.createdAt) {
    notificationData.createdAt = new Date();
  }

  // Try to send via WebSocket if user is online
  if (ws && ws.readyState === 1) { // OPEN
    try {
      ws.send(JSON.stringify({
        type: 'notification',
        notification: notificationData,
      }));
      console.log(`Notification sent via WebSocket to user ${userId}`);
    } catch (error) {
      console.error('Error sending notification via WebSocket:', error);
    }
  } else {
    // User is offline, send push notification
    try {
      const notificationType = notificationData.type as NotificationType;
      const relatedUser = notificationData.relatedUser;
      const relatedGroup = notificationData.relatedGroup;
      
      // Get username for the notification message
      const username = relatedUser?.displayName || relatedUser?.username || 'Someone';
      const groupName = relatedGroup?.name || 'a group';
      
      // Get title and body based on notification type
      let title = 'Aurora';
      let body = notificationData.message || 'You have a new notification';
      
      switch (notificationType) {
        case 'like':
          const likeMsg = notificationMessages.like(username);
          title = likeMsg.title;
          body = likeMsg.body;
          break;
        case 'comment':
          const commentMsg = notificationMessages.comment(username);
          title = commentMsg.title;
          body = commentMsg.body;
          break;
        case 'message':
          const messageMsg = notificationMessages.message(username);
          title = messageMsg.title;
          body = messageMsg.body;
          break;
        case 'follow':
          const followMsg = notificationMessages.follow(username);
          title = followMsg.title;
          body = followMsg.body;
          break;
        case 'group_invite':
          const inviteMsg = notificationMessages.group_invite(username, groupName);
          title = inviteMsg.title;
          body = inviteMsg.body;
          break;
        case 'group_join':
          const joinMsg = notificationMessages.group_join(username, groupName);
          title = joinMsg.title;
          body = joinMsg.body;
          break;
      }
      
      // Send push notification
      await sendPushNotification({
        userId,
        title,
        body,
        data: {
          notificationId: notificationData._id?.toString(),
          type: notificationType,
          relatedUserId: relatedUser?._id?.toString(),
          relatedPostId: notificationData.relatedPost?._id?.toString(),
          relatedGroupId: relatedGroup?._id?.toString(),
        },
      });
      
      console.log(`Push notification sent to user ${userId} (offline)`);
    } catch (error) {
      console.error('Error sending push notification:', error);
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

