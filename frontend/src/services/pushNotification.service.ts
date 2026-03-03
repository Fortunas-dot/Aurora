import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiService } from './api.service';

// Lazy load expo-notifications to avoid native module loading errors
let Notifications: typeof import('expo-notifications') | null = null;

// Function to safely load the notifications module
async function loadNotificationsModule() {
  if (Notifications) return Notifications;
  
  try {
    Notifications = await import('expo-notifications');
    
    // Configure how notifications are handled when app is in foreground
    // Only set handler if module loaded successfully
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
    
    return Notifications;
  } catch (error) {
    console.warn('Failed to load expo-notifications module:', error);
    return null;
  }
}

export interface PushNotificationToken {
  token: string;
  deviceId: string;
}

class PushNotificationService {
  private token: string | null = null;
  private deviceId: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    try {
      const notificationsModule = await loadNotificationsModule();
      if (!notificationsModule) {
        console.warn('Notifications module not available');
        return false;
      }

      const { status: existingStatus } = await notificationsModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await notificationsModule.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get device ID
      this.deviceId = Constants.expoConfig?.extra?.deviceId || Device.modelName || 'unknown';

      // Get projectId from config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      // Check if projectId is available
      if (!projectId) {
        console.warn('No EAS projectId found. Push notifications will not work. To enable push notifications, add your EAS projectId to app.config.js in extra.eas.projectId');
        return null;
      }

      // Load notifications module
      const notificationsModule = await loadNotificationsModule();
      if (!notificationsModule) {
        console.warn('Notifications module not available');
        return null;
      }

      // Get push token
      const tokenData = await notificationsModule.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.token = tokenData.data;
      if (__DEV__) {
        console.log('Push notification token:', this.token);
      }

      // Register token with backend
      await this.registerTokenWithBackend(this.token, this.deviceId);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await notificationsModule.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: notificationsModule.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#60A5FA',
        });
      }

      return this.token;
    } catch (error: any) {
      // Check if error is about missing projectId
      if (error?.message?.includes('projectId')) {
        console.warn('Push notifications require an EAS projectId. Add it to app.config.js in extra.eas.projectId. Push notifications are disabled for now.');
        return null;
      }
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(token: string, deviceId: string): Promise<void> {
    try {
      await apiService.post('/users/push-token', {
        token,
        deviceId,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Setup notification listeners
   */
  async setupNotificationListeners(
    onNotificationReceived: (notification: any) => void,
    onNotificationTapped: (response: any) => void
  ): Promise<() => void> {
    try {
      const notificationsModule = await loadNotificationsModule();
      if (!notificationsModule) {
        console.warn('Notifications module not available');
        return () => {}; // Return empty cleanup function
      }

      // Listener for notifications received while app is foregrounded
      const receivedListener = notificationsModule.addNotificationReceivedListener(onNotificationReceived);

      // Listener for when user taps on notification
      const responseListener = notificationsModule.addNotificationResponseReceivedListener(onNotificationTapped);

      // Check if app was opened from a notification (cold start)
      notificationsModule.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          console.log('App opened from notification (cold start):', response);
          onNotificationTapped(response);
        }
      });

      // Return cleanup function
      return () => {
        receivedListener.remove();
        responseListener.remove();
      };
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string> {
    const notificationsModule = await loadNotificationsModule();
    if (!notificationsModule) {
      throw new Error('Notifications module not available');
    }
    return await notificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    const notificationsModule = await loadNotificationsModule();
    if (!notificationsModule) {
      return;
    }
    await notificationsModule.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    const notificationsModule = await loadNotificationsModule();
    if (!notificationsModule) {
      return 0;
    }
    return await notificationsModule.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    const notificationsModule = await loadNotificationsModule();
    if (!notificationsModule) {
      return;
    }
    await notificationsModule.setBadgeCountAsync(count);
  }
}

export const pushNotificationService = new PushNotificationService();

