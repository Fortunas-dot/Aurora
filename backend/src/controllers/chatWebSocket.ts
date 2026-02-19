import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { sendNotificationToUser, sendUnreadCountUpdate } from './notificationWebSocket';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isTyping?: boolean;
  typingTimeout?: NodeJS.Timeout;
}

// Store active WebSocket connections for chat
const activeChatConnections = new Map<string, AuthenticatedWebSocket>();

// Store typing status: userId -> Set of users they're typing to
const typingStatus = new Map<string, Set<string>>();

/**
 * WebSocket handler for chat messages
 */
export const handleChatWebSocket = (ws: AuthenticatedWebSocket, req: any): void => {
  console.log('New chat WebSocket connection attempt');

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
    activeChatConnections.set(decoded.userId, ws);
    console.log(`✅ Chat WebSocket connected for user: ${decoded.userId}`);

    // Broadcast online status
    broadcastOnlineStatus(decoded.userId, true);

    // Handle messages from client
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          
          case 'typing_start':
            handleTypingStart(decoded.userId, data.receiverId);
            break;
          
          case 'typing_stop':
            handleTypingStop(decoded.userId, data.receiverId);
            break;
          
          case 'message':
            await handleChatMessage(decoded.userId, data);
            break;
          
          case 'mark_read':
            await handleMarkRead(decoded.userId, data.messageId);
            break;
          
          case 'check_online':
            handleCheckOnline(ws, data.userId);
            break;
          
          default:
            console.log('Unknown chat WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling chat WebSocket message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`Chat WebSocket disconnected for user: ${decoded.userId}`);
      activeChatConnections.delete(decoded.userId);
      typingStatus.delete(decoded.userId);
      broadcastOnlineStatus(decoded.userId, false);
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      console.error('Chat WebSocket error:', error);
      activeChatConnections.delete(decoded.userId);
      typingStatus.delete(decoded.userId);
      broadcastOnlineStatus(decoded.userId, false);
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
    console.error('Chat WebSocket authentication error:', error);
    ws.close(1008, 'Invalid token');
  }
};

/**
 * Handle incoming chat message
 */
const handleChatMessage = async (senderId: string, data: any): Promise<void> => {
  try {
    const { receiverId, content, attachments } = data;

    // Validate: must have receiverId AND (content OR attachments)
    const hasContent = content && content.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;
    
    if (!receiverId || (!hasContent && !hasAttachments)) {
      return;
    }

    // Create message in database
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content || '', // Empty string is OK if attachments exist
      attachments: attachments || [],
    });

    await message.populate('sender', 'username displayName avatar');
    await message.populate('receiver', 'username displayName avatar');

    // Send message to receiver if online
    const receiverWs = activeChatConnections.get(receiverId);
    if (receiverWs && receiverWs.readyState === 1) {
      receiverWs.send(JSON.stringify({
        type: 'new_message',
        message: {
          _id: message._id,
          sender: message.sender,
          receiver: message.receiver,
          content: message.content,
          createdAt: message.createdAt,
          readAt: message.readAt,
        },
      }));
    }

    // Send confirmation to sender
    const senderWs = activeChatConnections.get(senderId);
    if (senderWs && senderWs.readyState === 1) {
      senderWs.send(JSON.stringify({
        type: 'message_sent',
        message: {
          _id: message._id,
          sender: message.sender,
          receiver: message.receiver,
          content: message.content,
          createdAt: message.createdAt,
          readAt: message.readAt,
        },
      }));
    }

    // Create notification
    const notification = await Notification.create({
      user: receiverId,
      type: 'message',
      relatedUser: senderId,
      message: 'sent you a message',
    });

    await notification.populate('relatedUser', 'username displayName avatar');

    // Send notification via WebSocket
    await sendNotificationToUser(receiverId, notification);
    await sendUnreadCountUpdate(receiverId);

    // Update conversation list for both users
    updateConversationList(senderId, receiverId, message);
    updateConversationList(receiverId, senderId, message);

  } catch (error) {
    console.error('Error handling chat message:', error);
  }
};

/**
 * Handle typing start
 */
const handleTypingStart = (userId: string, receiverId: string): void => {
  if (!typingStatus.has(userId)) {
    typingStatus.set(userId, new Set());
  }
  typingStatus.get(userId)!.add(receiverId);

  // Notify receiver
  const receiverWs = activeChatConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === 1) {
    receiverWs.send(JSON.stringify({
      type: 'typing_start',
      userId,
    }));
  }
};

/**
 * Handle typing stop
 */
const handleTypingStop = (userId: string, receiverId: string): void => {
  const userTyping = typingStatus.get(userId);
  if (userTyping) {
    userTyping.delete(receiverId);
    if (userTyping.size === 0) {
      typingStatus.delete(userId);
    }
  }

  // Notify receiver
  const receiverWs = activeChatConnections.get(receiverId);
  if (receiverWs && receiverWs.readyState === 1) {
    receiverWs.send(JSON.stringify({
      type: 'typing_stop',
      userId,
    }));
  }
};

/**
 * Handle mark as read
 */
const handleMarkRead = async (userId: string, messageId: string): Promise<void> => {
  try {
    const message = await Message.findById(messageId);
    if (!message || message.receiver.toString() !== userId) {
      return;
    }

    message.readAt = new Date();
    await message.save();

    // Notify sender that message was read
    const senderWs = activeChatConnections.get(message.sender.toString());
    if (senderWs && senderWs.readyState === 1) {
      senderWs.send(JSON.stringify({
        type: 'message_read',
        messageId: message._id,
        readAt: message.readAt,
      }));
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Handle check online status request
 */
const handleCheckOnline = (ws: AuthenticatedWebSocket, targetUserId: string): void => {
  if (!targetUserId) return;
  
  const targetWs = activeChatConnections.get(targetUserId);
  const isOnline = targetWs !== undefined && targetWs.readyState === 1;
  
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({
      type: 'user_status',
      userId: targetUserId,
      isOnline,
    }));
  }
};

/**
 * Broadcast online status
 */
const broadcastOnlineStatus = (userId: string, isOnline: boolean): void => {
  // Get all users this user has conversations with
  // For simplicity, we'll notify all active connections
  // In production, you'd want to track who has conversations with whom
  activeChatConnections.forEach((ws, otherUserId) => {
    if (otherUserId !== userId && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'user_status',
        userId,
        isOnline,
      }));
    }
  });
};

/**
 * Update conversation list for user
 */
const updateConversationList = (userId: string, otherUserId: string, message: any): void => {
  const userWs = activeChatConnections.get(userId);
  if (userWs && userWs.readyState === 1) {
    userWs.send(JSON.stringify({
      type: 'conversation_updated',
      conversation: {
        user: {
          _id: otherUserId,
          username: message.sender.username || message.receiver.username,
          displayName: message.sender.displayName || message.receiver.displayName,
          avatar: message.sender.avatar || message.receiver.avatar,
        },
        lastMessage: {
          _id: message._id,
          content: message.content,
          createdAt: message.createdAt,
          isOwn: message.sender._id.toString() === userId,
        },
      },
    }));
  }
};

/**
 * Send message to user via WebSocket (for server-initiated messages)
 */
export const sendChatMessageToUser = async (userId: string, message: any): Promise<void> => {
  const ws = activeChatConnections.get(userId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({
      type: 'new_message',
      message,
    }));
  }
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  const ws = activeChatConnections.get(userId);
  return ws !== undefined && ws.readyState === 1;
};

