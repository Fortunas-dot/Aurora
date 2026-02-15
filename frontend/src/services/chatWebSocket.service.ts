import { getApiUrl } from '../utils/apiUrl';
import { secureStorage } from '../utils/secureStorage';

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
    // If already connected, just update callbacks
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Chat WebSocket already connected');
      this.callbacks = callbacks;
      return;
    }

    // If connecting, wait a bit and check again
    if (this.isConnecting) {
      console.log('Chat WebSocket connection already in progress');
      this.callbacks = callbacks; // Update callbacks anyway
      return;
    }

    // Clean up any existing connection that's not open
    if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
      try {
        this.ws.close();
      } catch (error) {
        // Ignore close errors
      }
      this.ws = null;
    }

    this.callbacks = callbacks;
    this.isConnecting = true;

    try {
      const token = await secureStorage.getItemAsync('auth_token');
      if (!token) {
        // Silently fail if no token - user might not be logged in yet
        console.log('No auth token available, skipping WebSocket connection');
        this.isConnecting = false;
        this.callbacks.onError?.(new Error('No auth token available'));
        return;
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
          // Parse message - backend sends JSON
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          // If parsing fails, check if it's a plain text ping/pong (fallback)
          if (typeof event.data === 'string') {
            const text = event.data.trim();
            if (text === 'ping') {
              if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'pong' }));
              }
              return;
            }
            if (text === 'pong') {
              return; // Ignore pong silently
            }
          }
          // Only log non-ping/pong parsing errors
          if (__DEV__) {
            console.warn('Error parsing chat WebSocket message:', error);
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = (event) => {
        console.log('Chat WebSocket disconnected', event.code, event.reason);
        this.isConnecting = false;
        this.callbacks.onDisconnected?.();
        
        // Only attempt reconnect if it wasn't a manual close (code 1000)
        // and if we haven't exceeded max attempts
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      // Only log non-token errors as errors, token errors are expected
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('No auth token available')) {
        console.log('No auth token available, skipping WebSocket connection');
      } else {
        console.error('Error connecting to chat WebSocket:', error);
      }
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
      case 'ping':
        // Respond to ping with pong if WebSocket is open
        if (this.ws?.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ type: 'pong' }));
          } catch (error) {
            console.warn('Failed to send pong response:', error);
          }
        }
        break;
      case 'pong':
        // Heartbeat response, ignore silently
        break;
      case 'error':
        this.callbacks.onError?.(new Error(data.message));
        break;
      default:
        // Only log if it's not a ping/pong message
        if (data.type && data.type !== 'ping' && data.type !== 'pong') {
          console.log('Unknown chat WebSocket message type:', data.type);
        }
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
    // Don't reconnect if already connecting or if WebSocket is still open
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000); // Max 30 seconds

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      // Check again before reconnecting
      if (!this.isConnecting && this.ws?.readyState !== WebSocket.OPEN) {
        if (this.callbacks.onConnected || this.callbacks.onNewMessage) {
          this.connect(this.callbacks);
        }
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    // Close WebSocket connection
    if (this.ws) {
      try {
        // Use code 1000 (normal closure) to indicate manual disconnect
        this.ws.close(1000, 'Manual disconnect');
      } catch (error) {
        // Ignore close errors
      }
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

