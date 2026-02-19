import Expo, { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import User from '../models/User';

// Create a new Expo SDK client
const expo = new Expo();

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
}

/**
 * Send push notification to a specific user
 */
export const sendPushNotification = async (payload: PushNotificationPayload): Promise<void> => {
  try {
    const { userId, title, body, data, sound = 'default', badge } = payload;

    // Get user's push tokens
    const user = await User.findById(userId).select('pushTokens');
    
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    // Filter valid Expo push tokens
    const validTokens = user.pushTokens
      .filter(tokenData => Expo.isExpoPushToken(tokenData.token))
      .map(tokenData => tokenData.token);

    if (validTokens.length === 0) {
      console.log(`No valid Expo push tokens for user ${userId}`);
      return;
    }

    // Create messages for each token
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound,
      title,
      body,
      data: data || {},
      badge,
    }));

    // Chunk messages (Expo recommends sending in batches)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    // Send each chunk
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Log ticket results for debugging
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        console.error(`Push notification error for token ${validTokens[index]}:`, ticket.message);
        
        // Handle specific errors
        if (ticket.details?.error === 'DeviceNotRegistered') {
          // Token is invalid, should be removed from user's tokens
          removeInvalidToken(userId, validTokens[index]);
        }
      }
    });

    console.log(`Push notification sent to user ${userId}: ${tickets.length} tickets`);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
};

/**
 * Send push notification to multiple users
 */
export const sendPushNotificationToMany = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  const promises = userIds.map(userId =>
    sendPushNotification({ userId, title, body, data })
  );
  await Promise.allSettled(promises);
};

/**
 * Remove invalid push token from user
 */
const removeInvalidToken = async (userId: string, token: string): Promise<void> => {
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushTokens: { token } }
    });
    console.log(`Removed invalid token for user ${userId}`);
  } catch (error) {
    console.error('Error removing invalid token:', error);
  }
};

/**
 * Notification message formatters for different notification types
 */
export const notificationMessages = {
  like: (username: string): { title: string; body: string } => ({
    title: 'New Like',
    body: `${username} liked your post`,
  }),
  
  comment: (username: string): { title: string; body: string } => ({
    title: 'New Comment',
    body: `${username} commented on your post`,
  }),
  
  message: (username: string): { title: string; body: string } => ({
    title: 'New Message',
    body: `${username} sent you a message`,
  }),
  
  follow: (username: string): { title: string; body: string } => ({
    title: 'New Follower',
    body: `${username} started following you`,
  }),
  
  group_invite: (username: string, groupName: string): { title: string; body: string } => ({
    title: 'Group Invitation',
    body: `${username} invited you to join ${groupName}`,
  }),
  
  group_join: (username: string, groupName: string): { title: string; body: string } => ({
    title: 'New Group Member',
    body: `${username} joined ${groupName}`,
  }),
};

export default {
  sendPushNotification,
  sendPushNotificationToMany,
  notificationMessages,
};
