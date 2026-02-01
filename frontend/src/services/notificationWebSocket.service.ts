import { getApiUrl } from '../utils/apiUrl';
import { useAuthStore } from '../store/authStore';
import * as SecureStore from 'expo-secure-store';

export type NotificationWebSocketEvent = 'notification' | 'unread_count' | 'error' | 'connected';

export interface NotificationWebSocketCallbacks {
  onNotification?: (notification: any) => void;
  onUnreadCount?: (count: number) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private callbacks: NotificationWebSocketCallbacks = {};
  private isConnecting = false;

  /**
   * Connect to notification WebSocket
   */
  async connect(callbacks: NotificationWebSocketCallbacks): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    this.callbacks = callbacks;
    this.isConnecting = true;

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        throw new Error('No auth token available');
      }

      const baseUrl = getApiUrl().replace('/api', '');
      const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const url = `${wsUrl}/ws/notifications?token=${token}`;

      console.log('Connecting to notification WebSocket:', url);

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Notification WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.callbacks.onConnected?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('Notification WebSocket disconnected');
        this.isConnecting = false;
        this.callbacks.onDisconnected?.();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error connecting to notification WebSocket:', error);
      this.isConnecting = false;
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'notification':
        this.callbacks.onNotification?.(data.notification);
        break;
      case 'unread_count':
        this.callbacks.onUnreadCount?.(data.count);
        break;
      case 'error':
        this.callbacks.onError?.(new Error(data.message));
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.callbacks.onConnected || this.callbacks.onNotification) {
        this.connect(this.callbacks);
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const notificationWebSocketService = new NotificationWebSocketService();

