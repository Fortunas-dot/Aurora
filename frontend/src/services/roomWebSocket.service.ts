import { getApiUrl } from '../utils/apiUrl';
import { secureStorage } from '../utils/secureStorage';

export interface PixelCharacterPublic {
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
  name?: string;
}

export interface RoomPlayer {
  userId: string;
  username: string;
  displayName: string;
  x: number;
  y: number;
  avatar?: string | null;
  avatarCharacter?: string | null;
  avatarBackgroundColor?: string | null;
  pixelCharacter?: PixelCharacterPublic | null;
}

export interface RoomChatMessage {
  userId: string;
  username: string;
  displayName: string;
  text: string;
  timestamp: number;
}

export type RoomEventType =
  | 'snapshot'
  | 'player_joined'
  | 'player_left'
  | 'player_moved'
  | 'chat'
  | 'error'
  | 'connected'
  | 'disconnected';

type EventHandler = (...args: any[]) => void;

class RoomWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;
  private listeners: Map<RoomEventType, Set<EventHandler>> = new Map();

  on(event: RoomEventType, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => { this.listeners.get(event)?.delete(handler); };
  }

  private emit(event: RoomEventType, ...args: any[]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try { handler(...args); } catch (e) { console.warn('Room WS listener error:', e); }
    });
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;

    try {
      const token = await secureStorage.getItemAsync('auth_token');
      if (!token) {
        this.isConnecting = false;
        this.emit('error', new Error('Not authenticated'));
        return;
      }

      const baseUrl = getApiUrl().replace('/api', '');
      const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const url = `${wsUrl}/ws/world?token=${token}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startPing();
        this.emit('connected');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);

          if (data.type === 'pong') return;

          if (data.type === 'snapshot') {
            this.emit('snapshot', data.players as RoomPlayer[]);
            return;
          }
          if (data.type === 'player_joined') {
            this.emit('player_joined', data.player as RoomPlayer);
            return;
          }
          if (data.type === 'player_left') {
            this.emit('player_left', data.userId as string);
            return;
          }
          if (data.type === 'player_moved') {
            this.emit('player_moved', data.userId, data.x, data.y);
            return;
          }
          if (data.type === 'chat') {
            this.emit('chat', {
              userId: data.userId,
              username: data.username,
              displayName: data.displayName,
              text: data.text,
              timestamp: Date.now(),
            } as RoomChatMessage);
            return;
          }
          if (data.type === 'error') {
            this.emit('error', new Error(data.message || 'Room error'));
            return;
          }
        } catch (e) {
          console.warn('Room WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopPing();
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch (e) {
      this.isConnecting = false;
      console.error('Room WS connect error:', e);
    }
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.stopPing();
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
  }

  move(x: number, y: number): void {
    this.send({ type: 'move', x, y });
  }

  chat(text: string): void {
    this.send({ type: 'chat', text });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    this.reconnectTimer = setTimeout(() => { this.connect(); }, delay);
  }
}

export const roomWebSocketService = new RoomWebSocketService();
