import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import Notification from '../models/Notification';
import { sendPushNotification, notificationMessages } from '../services/pushNotification.service';
import { NotificationType } from '../models/Notification';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  /** Current app screen/route the user is on (reported by the client). */
  currentScreen?: string;
  /** When this connection was established (ms epoch). */
  connectedAt?: number;
  /** Last time we heard from this client (presence/ping), ms epoch. */
  lastSeen?: number;
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

/** A connection is considered "live" if the socket is open and we've heard
 *  from it within this window (covers the 30s keep-alive with margin). */
const PRESENCE_STALE_MS = 90_000;

export interface PresenceSnapshot {
  /** Total distinct users currently online. */
  total: number;
  /** Count of online users per screen, e.g. { chat: 12, home: 8 }. */
  byScreen: Record<string, number>;
  /** When this snapshot was generated (ISO string). */
  generatedAt: string;
}

/**
 * Build a live-presence snapshot from the open WebSocket connections.
 * Used by the admin dashboard endpoint. No DB access — reads in-memory state.
 */
export const getPresenceSnapshot = (): PresenceSnapshot => {
  const now = Date.now();
  const byScreen: Record<string, number> = {};
  let total = 0;

  activeConnections.forEach((ws) => {
    const isOpen = ws.readyState === 1; // OPEN
    const fresh = now - (ws.lastSeen ?? ws.connectedAt ?? 0) < PRESENCE_STALE_MS;
    if (!isOpen || !fresh) return;

    total += 1;
    const screen = ws.currentScreen || 'unknown';
    byScreen[screen] = (byScreen[screen] || 0) + 1;
  });

  return { total, byScreen, generatedAt: new Date(now).toISOString() };
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
    ws.connectedAt = Date.now();
    ws.lastSeen = Date.now();

    // Store connection
    activeConnections.set(decoded.userId, ws);
    console.log(`✅ WebSocket connected for user: ${decoded.userId}`);

    // Send initial unread count
    sendUnreadCount(decoded.userId);

    // Handle messages from client
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        // Any inbound message counts as activity for presence freshness.
        ws.lastSeen = Date.now();
        if (data.type === 'ping' || data.type === 'pong') {
          if (data.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'presence') {
          // Client reports the screen/route it's currently viewing.
          if (typeof data.screen === 'string' && data.screen.length <= 100) {
            ws.currentScreen = data.screen;
          }
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
 * Send notification to user via WebSocket AND push notification.
 *
 * Push notifications are always sent so the OS can display an alert when the
 * app is in the background or killed. When the app is in the foreground the
 * client-side notification handler suppresses the banner, and the WebSocket
 * delivers real-time in-app updates instead.
 */
export const sendNotificationToUser = async (userId: string, notification: any): Promise<void> => {
  const ws = activeConnections.get(userId);
  const notificationData = notification.toObject ? notification.toObject() : notification;
  
  if (!notificationData.createdAt) {
    notificationData.createdAt = new Date();
  }

  // Send via WebSocket for real-time in-app updates (if connected)
  if (ws && ws.readyState === 1) {
    try {
      ws.send(JSON.stringify({
        type: 'notification',
        notification: notificationData,
      }));
      console.log(`Notification sent via WebSocket to user ${userId}`);
    } catch (error) {
      console.error('Error sending notification via WebSocket:', error);
    }
  }

  // Always send push notification so the OS can show it when the app is
  // backgrounded or killed. The client suppresses the banner in foreground.
  try {
    const notificationType = notificationData.type as NotificationType;
    const relatedUser = notificationData.relatedUser;
    const relatedGroup = notificationData.relatedGroup;
    const relatedJournal = notificationData.relatedJournal;
    const streakDays = typeof notificationData.streakDays === 'number' ? notificationData.streakDays : 0;
    
    const username = relatedUser?.displayName || relatedUser?.username || 'Someone';
    const groupName = relatedGroup?.name || 'a group';
    const journalName = relatedJournal?.name || 'a journal';
    
    let title = 'Aurora';
    let body = notificationData.message || 'You have a new notification';
    
    switch (notificationType) {
      case 'like': {
        const likeMsg = notificationMessages.like(username);
        title = likeMsg.title;
        body = likeMsg.body;
        break;
      }
      case 'comment': {
        const commentMsg = notificationMessages.comment(username);
        title = commentMsg.title;
        body = commentMsg.body;
        break;
      }
      case 'message': {
        const messageMsg = notificationMessages.message(username);
        title = messageMsg.title;
        body = messageMsg.body;
        break;
      }
      case 'follow': {
        const followMsg = notificationMessages.follow(username);
        title = followMsg.title;
        body = followMsg.body;
        break;
      }
      case 'group_invite': {
        const inviteMsg = notificationMessages.group_invite(username, groupName);
        title = inviteMsg.title;
        body = inviteMsg.body;
        break;
      }
      case 'group_join': {
        const joinMsg = notificationMessages.group_join(username, groupName);
        title = joinMsg.title;
        body = joinMsg.body;
        break;
      }
      case 'journal_entry': {
        const journalMsg = notificationMessages.journal_entry(username, journalName);
        title = journalMsg.title;
        body = journalMsg.body;
        break;
      }
      case 'journal_streak': {
        const streakMsg = notificationMessages.journal_streak(streakDays);
        title = streakMsg.title;
        body = streakMsg.body;
        break;
      }
    }
    
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
        relatedJournalId: relatedJournal?._id?.toString(),
        relatedEntryId: notificationData.relatedEntry?._id?.toString(),
      },
    });
    
    console.log(`Push notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
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

