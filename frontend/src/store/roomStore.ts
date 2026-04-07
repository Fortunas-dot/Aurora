import { create } from 'zustand';
import {
  roomWebSocketService,
  RoomPlayer,
  RoomChatMessage,
} from '../services/roomWebSocket.service';

// ═══════════════════════════════════════════════════════════════
// Room State — Zustand store for real-time multiplayer room
//
// Single source of truth for:
//   • Player positions & figure data
//   • Chat messages & bubbles
//   • Connection status
//
// All mutations come from WebSocket events.
// The store subscribes to WS events on connect() and cleans up
// on disconnect(). Components just read derived state.
// ═══════════════════════════════════════════════════════════════

const CHAT_BUBBLE_DURATION = 5000;
const MAX_CHAT_LOG = 50;

export interface ChatBubble {
  userId: string;
  text: string;
  expiresAt: number;
}

interface RoomState {
  // Connection
  connected: boolean;

  // Players keyed by userId
  players: Map<string, RoomPlayer>;

  // Chat
  chatLog: RoomChatMessage[];
  chatBubbles: ChatBubble[];

  // Derived
  playerCount: number;
  sortedPlayers: RoomPlayer[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  move: (x: number, y: number) => void;
  chat: (text: string) => void;
  expireBubbles: () => void;
}

// Recalculate sorted players (depth-sorted for isometric rendering)
function sortPlayers(players: Map<string, RoomPlayer>): RoomPlayer[] {
  return Array.from(players.values()).sort(
    (a, b) => (a.x + a.y) - (b.x + b.y),
  );
}

let unsubscribers: (() => void)[] = [];

export const useRoomStore = create<RoomState>((set, get) => ({
  connected: false,
  players: new Map(),
  chatLog: [],
  chatBubbles: [],
  playerCount: 0,
  sortedPlayers: [],

  connect: () => {
    // Wire up WS event handlers → store mutations
    unsubscribers.push(
      roomWebSocketService.on('connected', () => {
        set({ connected: true });
      }),
    );

    unsubscribers.push(
      roomWebSocketService.on('disconnected', () => {
        set({ connected: false });
      }),
    );

    unsubscribers.push(
      roomWebSocketService.on('snapshot', (snapshotPlayers: RoomPlayer[]) => {
        const map = new Map<string, RoomPlayer>();
        snapshotPlayers.forEach((p) => map.set(p.userId, p));
        set({
          players: map,
          playerCount: map.size,
          sortedPlayers: sortPlayers(map),
        });
      }),
    );

    unsubscribers.push(
      roomWebSocketService.on('player_joined', (player: RoomPlayer) => {
        const next = new Map(get().players);
        next.set(player.userId, player);
        set({
          players: next,
          playerCount: next.size,
          sortedPlayers: sortPlayers(next),
        });
      }),
    );

    unsubscribers.push(
      roomWebSocketService.on('player_left', (userId: string) => {
        const next = new Map(get().players);
        next.delete(userId);
        set({
          players: next,
          playerCount: next.size,
          sortedPlayers: sortPlayers(next),
        });
      }),
    );

    unsubscribers.push(
      roomWebSocketService.on('player_moved', (userId: string, x: number, y: number) => {
        const prev = get().players;
        const p = prev.get(userId);
        if (!p) return;
        const next = new Map(prev);
        next.set(userId, { ...p, x, y });
        set({
          players: next,
          sortedPlayers: sortPlayers(next),
        });
      }),
    );

    unsubscribers.push(
      roomWebSocketService.on('chat', (msg: RoomChatMessage) => {
        const { chatLog, chatBubbles } = get();
        set({
          chatLog: [...chatLog.slice(-(MAX_CHAT_LOG - 1)), msg],
          chatBubbles: [
            ...chatBubbles.filter((b) => b.userId !== msg.userId),
            { userId: msg.userId, text: msg.text, expiresAt: Date.now() + CHAT_BUBBLE_DURATION },
          ],
        });
      }),
    );

    roomWebSocketService.connect();
  },

  disconnect: () => {
    unsubscribers.forEach((u) => u());
    unsubscribers = [];
    roomWebSocketService.disconnect();
    set({
      connected: false,
      players: new Map(),
      chatLog: [],
      chatBubbles: [],
      playerCount: 0,
      sortedPlayers: [],
    });
  },

  move: (x: number, y: number) => {
    roomWebSocketService.move(x, y);
  },

  chat: (text: string) => {
    roomWebSocketService.chat(text);
  },

  expireBubbles: () => {
    const now = Date.now();
    const { chatBubbles } = get();
    const filtered = chatBubbles.filter((b) => b.expiresAt > now);
    if (filtered.length !== chatBubbles.length) {
      set({ chatBubbles: filtered });
    }
  },
}));
