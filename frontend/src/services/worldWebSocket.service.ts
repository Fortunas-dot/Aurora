import { getApiUrl } from '../utils/apiUrl';
import { secureStorage } from '../utils/secureStorage';

export type WorldPlayer = {
  userId: string;
  username: string;
  displayName: string;
  x: number;
  y: number;
  avatar?: string | null;
  avatarCharacter?: string | null;
  avatarBackgroundColor?: string | null;
};

export type WorldEventType =
  | 'snapshot'
  | 'player_joined'
  | 'player_moved'
  | 'player_left'
  | 'error'
  | 'connected'
  | 'disconnected';

type EventHandler = (...args: any[]) => void;

class WorldWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  /** Incremented on disconnect so in-flight async connect() aborts (avoids orphan sockets + stuck isConnecting). */
  private connectGeneration = 0;
  /** Latest snapshot while socket is open — replay if a listener subscribes late. */
  private lastSnapshot: WorldPlayer[] | null = null;
  private listeners: Map<WorldEventType | 'pong', Set<EventHandler>> = new Map();

  on(event: WorldEventType | 'pong', handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    if (
      event === 'snapshot' &&
      this.lastSnapshot !== null &&
      this.ws?.readyState === WebSocket.OPEN
    ) {
      const snap = this.lastSnapshot;
      setTimeout(() => {
        try {
          handler(snap);
        } catch (e) {
          console.error('World WS snapshot replay error:', e);
        }
      }, 0);
    }
    return () => this.listeners.get(event)?.delete(handler);
  }

  private emit(event: WorldEventType | 'pong', ...args: any[]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(...args);
      } catch (e) {
        console.error(`World WS ${event} handler error:`, e);
      }
    });
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (this.lastSnapshot !== null) {
        this.emit('snapshot', this.lastSnapshot);
      }
      return;
    }
    if (this.isConnecting) {
      return;
    }

    if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    const myGen = this.connectGeneration;
    this.isConnecting = true;

    try {
      const token = await secureStorage.getItemAsync('auth_token');
      if (myGen !== this.connectGeneration) {
        this.isConnecting = false;
        return;
      }
      if (!token) {
        this.isConnecting = false;
        this.emit('error', new Error('No auth token'));
        return;
      }

      const baseUrl = getApiUrl().replace('/api', '');
      const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const url = `${wsUrl}/ws/world?token=${encodeURIComponent(token)}`;

      if (myGen !== this.connectGeneration) {
        this.isConnecting = false;
        return;
      }

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        if (myGen !== this.connectGeneration) {
          return;
        }
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        if (myGen !== this.connectGeneration) {
          return;
        }
        try {
          const data = JSON.parse(event.data as string);
          this.handleMessage(data);
        } catch {
          if (__DEV__) {
            console.warn('World WS parse error');
          }
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        if (__DEV__) {
          console.warn('[World WS] socket error');
        }
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        if (myGen !== this.connectGeneration) {
          return;
        }
        this.lastSnapshot = null;
        this.emit('disconnected');

        const shouldReconnect =
          event.code !== 1000 &&
          event.code !== 1005 &&
          event.code !== 1008 &&
          event.code !== 1013 &&
          this.reconnectAttempts < this.maxReconnectAttempts;

        if (shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (e) {
      this.isConnecting = false;
      if (myGen === this.connectGeneration) {
        this.emit('error', e instanceof Error ? e : new Error(String(e)));
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'snapshot':
        this.lastSnapshot = (data.players as WorldPlayer[]) ?? [];
        this.emit('snapshot', this.lastSnapshot);
        break;
      case 'player_joined':
        this.emit('player_joined', data.player as WorldPlayer);
        break;
      case 'player_moved':
        this.emit('player_moved', data.userId as string, data.x as number, data.y as number);
        break;
      case 'player_left':
        this.emit('player_left', data.userId as string);
        break;
      case 'ping':
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;
      case 'pong':
        this.emit('pong');
        break;
      case 'error':
        this.emit('error', new Error(data.message || 'World error'));
        break;
      default:
        break;
    }
  }

  sendMove(x: number, y: number): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      this.ws.send(JSON.stringify({ type: 'move', x, y }));
    } catch {
      // ignore
    }
  }

  disconnect(): void {
    this.connectGeneration += 1;
    this.isConnecting = false;
    this.lastSnapshot = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      try {
        this.ws.close(1000);
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const worldWebSocketService = new WorldWebSocketService();
