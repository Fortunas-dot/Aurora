import { getApiUrl } from '../utils/apiUrl';
import { secureStorage } from '../utils/secureStorage';
import { AppState, AppStateStatus } from 'react-native';

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
  private appStateSubscription: any = null;
  private appState: AppStateStatus = 'active';

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
   * Manually emit a local conversation update event.
   * This is useful when we know a conversation changed (e.g. after sending a message)
   * but the backend hasn't pushed a WebSocket event yet.
   */
  emitLocalConversationUpdated(conversation: any): void {
    this.emit('conversation_updated', conversation);
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

    // Setup AppState listener if not already set up
    if (!this.appStateSubscription) {
      this.appState = AppState.currentState;
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
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

      this.ws.onerror = (event) => {
        // WebSocket onerror receives an Event object, not an Error
        // Extract meaningful error information
        const errorMessage = 'WebSocket connection error';
        if (__DEV__) {
          console.warn('Chat WebSocket error:', errorMessage);
        }
        this.isConnecting = false;
        this.emit('error', new Error(errorMessage));
      };

      this.ws.onclose = (event) => {
        console.log('Chat WebSocket disconnected', event.code, event.reason);
        this.isConnecting = false;
        this.emit('disconnected');

        // Don't reconnect if app is in background (will reconnect when app comes to foreground)
        if (this.appState !== 'active') {
          console.log('App is in background, will reconnect when app comes to foreground');
          return;
        }

        const shouldReconnect =
          event.code !== 1000 && // Not manual close
          event.code !== 1005 && // Not no status
          event.code !== 1002 && // Not protocol error
          event.code !== 1003 && // Not unsupported data
          event.code !== 1007 && // Not invalid data
          event.code !== 1008 && // Not policy violation
          event.code !== 1009 && // Not message too big
          event.code !== 1010 && // Not extension error
          event.code !== 1015 && // Not TLS handshake failure
          this.reconnectAttempts < this.maxReconnectAttempts;

        if (shouldReconnect) {
          this.attemptReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('Max reconnection attempts reached, will retry when app comes to foreground');
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
    // Check if connection is actually open (not just in CONNECTING state)
    const isOpen = this.ws?.readyState === WebSocket.OPEN;
    const isConnecting = this.ws?.readyState === WebSocket.CONNECTING || this.isConnecting;
    
    // If not open and not already connecting, connect
    if (!isOpen && !isConnecting) {
      // Clean up stale connection first
      if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
        try {
          this.ws.close();
        } catch (error) {
          // Ignore close errors
        }
        this.ws = null;
      }
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
      case 'message_reaction':
        this.emit('message_reaction', data.message);
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
      const payload: any = {
        type: 'message',
        receiverId,
        content,
      };
      
      // Only include attachments if array is not empty
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        payload.attachments = attachments;
      }
      
      this.ws.send(JSON.stringify(payload));
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
   * Handle AppState changes - reconnect when app comes to foreground
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('App came to foreground, checking WebSocket connection...');
      
      // Check if WebSocket is connected, reconnect if needed
      const isOpen = this.ws?.readyState === WebSocket.OPEN;
      const isConnecting = this.ws?.readyState === WebSocket.CONNECTING || this.isConnecting;
      
      if (!isOpen && !isConnecting) {
        console.log('WebSocket not connected, reconnecting...');
        // Reset reconnect attempts when app comes back to foreground
        this.reconnectAttempts = 0;
        this.ensureConnected();
      } else if (!isOpen && this.ws?.readyState === WebSocket.CLOSED) {
        // Connection is closed, clean up and reconnect
        console.log('WebSocket was closed, cleaning up and reconnecting...');
        this.ws = null;
        this.reconnectAttempts = 0;
        this.ensureConnected();
      }
    }
    
    this.appState = nextAppState;
  }

  /**
   * Disconnect from WebSocket (only call on logout or app background)
   */
  disconnect(): void {
    // Remove AppState listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

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
