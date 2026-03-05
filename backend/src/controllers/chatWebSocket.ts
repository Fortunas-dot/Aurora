import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import Message from '../models/Message';
import Notification from '../models/Notification';
import User from '../models/User';
import {
  sendNotificationToUser,
  sendUnreadCountUpdate,
  isUserOnline as isNotificationUserOnline,
} from './notificationWebSocket';

// Helper function to normalize URLs to absolute URLs
const normalizeUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = process.env.BASE_URL || 'https://aurora-production.up.railway.app';
  const relativeUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${relativeUrl}`;
};

// Helper function to normalize message data (attachments and user avatars)
const normalizeMessageData = (message: any): any => {
  if (!message) return message;
  
  const normalized: any = { ...message };
  
  // Normalize attachments array
  if (message.attachments && Array.isArray(message.attachments)) {
    normalized.attachments = message.attachments.map((attachment: any) => ({
      ...attachment,
      url: normalizeUrl(attachment.url) || attachment.url,
    }));
  }
  
  // Normalize sender avatar
  if (message.sender && message.sender.avatar) {
    normalized.sender = {
      ...message.sender,
      avatar: normalizeUrl(message.sender.avatar),
    };
  }
  
  // Normalize receiver avatar
  if (message.receiver && message.receiver.avatar) {
    normalized.receiver = {
      ...message.receiver,
      avatar: normalizeUrl(message.receiver.avatar),
    };
  }
  
  return normalized;
};

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
      // Send error back to sender
      const senderWs = activeChatConnections.get(senderId);
      if (senderWs && senderWs.readyState === 1) {
        senderWs.send(JSON.stringify({
          type: 'error',
          message: 'Message must have either content or attachments',
        }));
      }
      return;
    }

    // Prevent sending messages when there is a block relationship
    // - If sender has blocked the receiver
    // - Or if receiver has blocked the sender
    try {
      const [senderUser, receiverUser] = await Promise.all([
        User.findById(senderId).select('blockedUsers'),
        User.findById(receiverId).select('blockedUsers'),
      ]);

      const hasBlockedReceiver = senderUser?.blockedUsers?.some(
        (id: any) => id.toString() === receiverId
      );
      const isBlockedByReceiver = receiverUser?.blockedUsers?.some(
        (id: any) => id.toString() === senderId
      );

      if (hasBlockedReceiver || isBlockedByReceiver) {
        const senderWs = activeChatConnections.get(senderId);
        if (senderWs && senderWs.readyState === 1) {
          senderWs.send(JSON.stringify({
            type: 'error',
            message: 'You cannot send messages to this user.',
          }));
        }
        return;
      }
    } catch (blockError) {
      console.error('Error checking block status for chat message:', blockError);
      // If we fail to check block state, fail safe and do NOT send the message
      const senderWs = activeChatConnections.get(senderId);
      if (senderWs && senderWs.readyState === 1) {
        senderWs.send(JSON.stringify({
          type: 'error',
          message: 'Could not send message. Please try again later.',
        }));
      }
      return;
    }

    // Create message in database
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content || '', // Empty string is OK if attachments exist
      attachments: Array.isArray(attachments) && attachments.length > 0 ? attachments : [],
    });

    await message.populate('sender', 'username displayName avatar');
    await message.populate('receiver', 'username displayName avatar');

    // Normalize message data (attachments and user avatars)
    const messageObj = message.toObject ? message.toObject() : message;
    const normalizedMessage = normalizeMessageData(messageObj);

    // Send message to receiver if online
    const receiverWs = activeChatConnections.get(receiverId);
    if (receiverWs && receiverWs.readyState === 1) {
      receiverWs.send(JSON.stringify({
        type: 'new_message',
        message: normalizedMessage,
      }));
    }

    // Send confirmation to sender
    const senderWs = activeChatConnections.get(senderId);
    if (senderWs && senderWs.readyState === 1) {
      senderWs.send(JSON.stringify({
        type: 'message_sent',
        message: normalizedMessage,
      }));
    }

    // Create notification
    const notification = await Notification.create({
      user: receiverId,
      type: 'message',
      relatedUser: senderId,
      message: 'sent you a message',
    });

    await notification.populate('relatedUser', 'username displayName avatar avatarCharacter avatarBackgroundColor nameColor');

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
  
  // "Online" in chat should reflect whether the user is online in the app,
  // not just whether they currently have the chat WebSocket open.
  // Prefer the global notification WebSocket presence and fall back to
  // the chat WebSocket connection as a safety net.
  const chatWs = activeChatConnections.get(targetUserId);
  const isOnline =
    isNotificationUserOnline(targetUserId) ||
    (chatWs !== undefined && chatWs.readyState === 1);
  
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
    // Normalize avatar URL
    const avatar = message.sender.avatar || message.receiver.avatar;
    const normalizedAvatar = normalizeUrl(avatar);
    
    // Normalize attachments if they exist
    let normalizedAttachments = undefined;
    if (message.attachments && Array.isArray(message.attachments)) {
      normalizedAttachments = message.attachments.map((attachment: any) => ({
        ...attachment,
        url: normalizeUrl(attachment.url) || attachment.url,
      }));
    }
    
    userWs.send(JSON.stringify({
      type: 'conversation_updated',
      conversation: {
        user: {
          _id: otherUserId,
          username: message.sender.username || message.receiver.username,
          displayName: message.sender.displayName || message.receiver.displayName,
          avatar: normalizedAvatar,
        },
        lastMessage: {
          _id: message._id,
          content: message.content,
          attachments: normalizedAttachments,
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

/**
 * Broadcast message reaction update to both users in conversation
 */
export const broadcastMessageReaction = async (message: any): Promise<void> => {
  try {
    // Get sender and receiver IDs - handle both populated objects and ObjectIds
    let senderId: string;
    let receiverId: string;

    if (message.sender) {
      if (typeof message.sender === 'object' && message.sender._id) {
        senderId = message.sender._id.toString();
      } else if (typeof message.sender === 'object' && message.sender.toString) {
        senderId = message.sender.toString();
      } else {
        senderId = String(message.sender);
      }
    } else {
      console.error('Message sender is missing in broadcastMessageReaction');
      return;
    }

    if (message.receiver) {
      if (typeof message.receiver === 'object' && message.receiver._id) {
        receiverId = message.receiver._id.toString();
      } else if (typeof message.receiver === 'object' && message.receiver.toString) {
        receiverId = message.receiver.toString();
      } else {
        receiverId = String(message.receiver);
      }
    } else {
      console.error('Message receiver is missing in broadcastMessageReaction');
      return;
    }

    // Get message ID - handle both ObjectId and string
    let messageId: string;
    if (message._id) {
      if (typeof message._id === 'object' && message._id.toString) {
        messageId = message._id.toString();
      } else {
        messageId = String(message._id);
      }
    } else {
      console.error('Message ID is missing in broadcastMessageReaction');
      return;
    }

    // Prepare the reaction update message with proper serialization
    // Ensure reactions are properly serialized with user IDs as strings
    let serializedReactions = [];
    if (message.reactions && Array.isArray(message.reactions)) {
      serializedReactions = message.reactions.map((reaction: any) => ({
        emoji: reaction.emoji,
        users: Array.isArray(reaction.users) 
          ? reaction.users.map((user: any) => {
              // Handle both populated user objects and ObjectIds
              if (typeof user === 'object' && user._id) {
                return {
                  _id: user._id.toString(),
                  username: user.username || '',
                  displayName: user.displayName || '',
                  avatar: user.avatar || '',
                };
              } else if (typeof user === 'object' && user.toString) {
                return { _id: user.toString() };
              } else {
                return { _id: String(user) };
              }
            })
          : [],
      }));
    }

    const reactionUpdate = {
      _id: messageId,
      reactions: serializedReactions,
      updatedAt: message.updatedAt ? (message.updatedAt instanceof Date ? message.updatedAt.toISOString() : message.updatedAt) : new Date().toISOString(),
    };

    console.log(`Broadcasting reaction update for message ${messageId} to sender ${senderId} and receiver ${receiverId}`, {
      reactionsCount: serializedReactions.length,
      reactions: serializedReactions,
    });

    // Send to sender if online
    const senderWs = activeChatConnections.get(senderId);
    if (senderWs && senderWs.readyState === 1) {
      try {
        const payload = JSON.stringify({
          type: 'message_reaction',
          message: reactionUpdate,
        });
        senderWs.send(payload);
        console.log(`✅ Sent reaction update to sender ${senderId}`, { payloadSize: payload.length });
      } catch (error) {
        console.error(`Error sending reaction update to sender ${senderId}:`, error);
      }
    } else {
      console.log(`⚠️ Sender ${senderId} is not connected via WebSocket (readyState: ${senderWs?.readyState})`);
    }

    // Send to receiver if online
    const receiverWs = activeChatConnections.get(receiverId);
    if (receiverWs && receiverWs.readyState === 1) {
      try {
        const payload = JSON.stringify({
          type: 'message_reaction',
          message: reactionUpdate,
        });
        receiverWs.send(payload);
        console.log(`✅ Sent reaction update to receiver ${receiverId}`, { payloadSize: payload.length });
      } catch (error) {
        console.error(`Error sending reaction update to receiver ${receiverId}:`, error);
      }
    } else {
      console.log(`⚠️ Receiver ${receiverId} is not connected via WebSocket (readyState: ${receiverWs?.readyState})`);
    }
  } catch (error) {
    console.error('Error broadcasting message reaction:', error);
  }
};
