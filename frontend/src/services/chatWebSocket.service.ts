import { getApiUrl } from '../utils/apiUrl';
import * as SecureStore from 'expo-secure-store';

export type ChatWebSocketEvent = 'new_message' | 'message_sent' | 'typing_start' | 'typing_stop' | 'user_status' | 'message_read' | 'conversation_updated' | 'error' | 'connected';

export interface ChatWebSocketCallbacks {
  onNewMessage?: (message: any) => void;
  onMessageSent?: (message: any) => void;
  onTypingStart?: (userId: string) => void;
  onTypingStop?: (userId: string) => void;
  onUserStatus?: (userId: string, isOnline: boolean) => void;
  onMessageRead?: (messageId: string, readAt: Date) => void;
  onConversationUpdated?: (conversation: any) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private callbacks: ChatWebSocketCallbacks = {};
  private isConnecting = false;
  private typingTimeout: NodeJS.Timeout | null = null;

  /**
   * Connect to chat WebSocket
   */
  async connect(callbacks: ChatWebSocketCallbacks): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Chat WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Chat WebSocket connection already in progress');
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
      const url = `${wsUrl}/ws/chat?token=${token}`;

      console.log('Connecting to chat WebSocket:', url);

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Chat WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.callbacks.onConnected?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing chat WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('Chat WebSocket disconnected');
        this.isConnecting = false;
        this.callbacks.onDisconnected?.();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error connecting to chat WebSocket:', error);
      this.isConnecting = false;
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'new_message':
        this.callbacks.onNewMessage?.(data.message);
        break;
      case 'message_sent':
        this.callbacks.onMessageSent?.(data.message);
        break;
      case 'typing_start':
        this.callbacks.onTypingStart?.(data.userId);
        break;
      case 'typing_stop':
        this.callbacks.onTypingStop?.(data.userId);
        break;
      case 'user_status':
        this.callbacks.onUserStatus?.(data.userId, data.isOnline);
        break;
      case 'message_read':
        this.callbacks.onMessageRead?.(data.messageId, new Date(data.readAt));
        break;
      case 'conversation_updated':
        this.callbacks.onConversationUpdated?.(data.conversation);
        break;
      case 'pong':
        // Heartbeat response
        break;
      case 'error':
        this.callbacks.onError?.(new Error(data.message));
        break;
      default:
        console.log('Unknown chat WebSocket message type:', data.type);
    }
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(receiverId: string, content: string, attachments?: Array<{ type: 'image' | 'file'; url: string }>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        receiverId,
        content,
        attachments: attachments || [],
      }));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Send typing start indicator
   */
  sendTypingStart(receiverId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing_start',
        receiverId,
      }));

      // Auto-stop typing after 3 seconds
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      this.typingTimeout = setTimeout(() => {
        this.sendTypingStop(receiverId);
      }, 3000);
    }
  }

  /**
   * Send typing stop indicator
   */
  sendTypingStop(receiverId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing_stop',
        receiverId,
      }));

      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
    }
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'mark_read',
        messageId,
      }));
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
      if (this.callbacks.onConnected || this.callbacks.onNewMessage) {
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

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
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

export const chatWebSocketService = new ChatWebSocketService();

