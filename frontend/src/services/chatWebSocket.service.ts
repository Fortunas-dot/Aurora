import { getApiUrl } from '../utils/apiUrl';
import { secureStorage } from '../utils/secureStorage';

export type ChatWebSocketEventType = 
  | 'new_message' 
  | 'message_sent' 
  | 'typing_start' 
  | 'typing_stop' 
  | 'user_status' 
  | 'message_read' 
  | 'conversation_updated' 
  | 'connected' 
  | 'disconnected' 
  | 'error';

// Legacy callback interface (still supported for backwards compat)
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

type EventHandler = (...args: any[]) => void;

class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private typingTimeout: NodeJS.Timeout | null = null;

  // Event listener system - supports multiple listeners per event
  private listeners: Map<ChatWebSocketEventType, Set<EventHandler>> = new Map();

  /**
   * Add an event listener. Returns an unsubscribe function.
   */
  on(event: ChatWebSocketEventType, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * Remove a specific event listener
   */
  off(event: ChatWebSocketEventType, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Emit an event to all registered listeners
   */
  private emit(event: ChatWebSocketEventType, ...args: any[]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }

  /**
   * Connect to chat WebSocket. 
   * If already connected, does nothing.
   * Optionally accepts legacy callbacks for backwards compatibility.
   */
  async connect(callbacks?: ChatWebSocketCallbacks): Promise<void> {
    // Register legacy callbacks as listeners if provided
    if (callbacks) {
      this.registerLegacyCallbacks(callbacks);
    }

    // If already connected, nothing to do
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Chat WebSocket already connected');
      return;
    }

    // If connecting, wait
    if (this.isConnecting) {
      console.log('Chat WebSocket connection already in progress');
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

    this.isConnecting = true;

    try {
      const token = await secureStorage.getItemAsync('auth_token');
      if (!token) {
        console.log('No auth token available, skipping WebSocket connection');
        this.isConnecting = false;
        this.emit('error', new Error('No auth token available'));
        return;
      }

      const baseUrl = getApiUrl().replace('/api', '');
      const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const url = `${wsUrl}/ws/chat?token=${token}`;

      console.log('Connecting to chat WebSocket...');

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Chat WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          if (typeof event.data === 'string') {
            const text = event.data.trim();
            if (text === 'ping') {
              if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'pong' }));
              }
              return;
            }
            if (text === 'pong') {
              return;
            }
          }
          if (__DEV__) {
            console.warn('Error parsing chat WebSocket message:', error);
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', new Error('WebSocket connection error'));
      };

      this.ws.onclose = (event) => {
        console.log('Chat WebSocket disconnected', event.code, event.reason);
        this.isConnecting = false;
        this.emit('disconnected');

        const shouldReconnect =
          event.code !== 1000 &&
          event.code !== 1005 &&
          event.code !== 1002 &&
          event.code !== 1003 &&
          event.code !== 1007 &&
          event.code !== 1008 &&
          event.code !== 1009 &&
          event.code !== 1010 &&
          event.code !== 1015 &&
          this.reconnectAttempts < this.maxReconnectAttempts;

        if (shouldReconnect) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No auth token available')) {
        console.error('Error connecting to chat WebSocket:', error);
      }
      this.isConnecting = false;
      this.emit('error', error as Error);
    }
  }

  /**
   * Ensure the WebSocket is connected (connects if needed)
   */
  async ensureConnected(): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN && !this.isConnecting) {
      await this.connect();
    }
  }

  /**
   * Handle incoming WebSocket messages - emit to all listeners
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'new_message':
        this.emit('new_message', data.message);
        break;
      case 'message_sent':
        this.emit('message_sent', data.message);
        break;
      case 'typing_start':
        this.emit('typing_start', data.userId);
        break;
      case 'typing_stop':
        this.emit('typing_stop', data.userId);
        break;
      case 'user_status':
        this.emit('user_status', data.userId, data.isOnline);
        break;
      case 'message_read':
        this.emit('message_read', data.messageId, new Date(data.readAt));
        break;
      case 'conversation_updated':
        this.emit('conversation_updated', data.conversation);
        break;
      case 'ping':
        if (this.ws?.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ type: 'pong' }));
          } catch (error) {
            console.warn('Failed to send pong response:', error);
          }
        }
        break;
      case 'pong':
        break;
      case 'error':
        this.emit('error', new Error(data.message));
        break;
      default:
        if (data.type && data.type !== 'ping' && data.type !== 'pong') {
          console.log('Unknown chat WebSocket message type:', data.type);
        }
    }
  }

  /**
   * Register legacy callbacks as event listeners (for backwards compatibility)
   * Returns cleanup function to remove all registered listeners
   */
  private legacyCleanups: Array<() => void> = [];

  private registerLegacyCallbacks(callbacks: ChatWebSocketCallbacks): void {
    // Clean up previous legacy callbacks
    this.legacyCleanups.forEach((cleanup) => cleanup());
    this.legacyCleanups = [];

    if (callbacks.onNewMessage) {
      this.legacyCleanups.push(this.on('new_message', callbacks.onNewMessage));
    }
    if (callbacks.onMessageSent) {
      this.legacyCleanups.push(this.on('message_sent', callbacks.onMessageSent));
    }
    if (callbacks.onTypingStart) {
      this.legacyCleanups.push(this.on('typing_start', callbacks.onTypingStart));
    }
    if (callbacks.onTypingStop) {
      this.legacyCleanups.push(this.on('typing_stop', callbacks.onTypingStop));
    }
    if (callbacks.onUserStatus) {
      this.legacyCleanups.push(this.on('user_status', callbacks.onUserStatus));
    }
    if (callbacks.onMessageRead) {
      this.legacyCleanups.push(this.on('message_read', callbacks.onMessageRead));
    }
    if (callbacks.onConversationUpdated) {
      this.legacyCleanups.push(this.on('conversation_updated', callbacks.onConversationUpdated));
    }
    if (callbacks.onError) {
      this.legacyCleanups.push(this.on('error', callbacks.onError));
    }
    if (callbacks.onConnected) {
      this.legacyCleanups.push(this.on('connected', callbacks.onConnected));
    }
    if (callbacks.onDisconnected) {
      this.legacyCleanups.push(this.on('disconnected', callbacks.onDisconnected));
    }
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(receiverId: string, content: string, attachments?: Array<{ type: 'image' | 'file' | 'audio'; url: string; duration?: number }>): void {
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
   * Request online status for a specific user
   */
  checkOnline(userId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'check_online',
        userId,
      }));
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
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);

    console.log(`Attempting to reconnect chat WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnecting && this.ws?.readyState !== WebSocket.OPEN && this.ws?.readyState !== WebSocket.CONNECTING) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket (only call on logout or app background)
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
      try {
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
