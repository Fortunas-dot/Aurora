import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import User from '../models/User';

/** Keep in sync with frontend pixel room constants */
export const WORLD_GRID_WIDTH = 10;
export const WORLD_GRID_HEIGHT = 8;
const MAX_LOBBY_PLAYERS = 40;
const MIN_MOVE_INTERVAL_MS = 150;
const CHAT_COOLDOWN_MS = 500;
const MAX_CHAT_LENGTH = 200;

const normalizeUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = process.env.BASE_URL || 'https://aurora-production.up.railway.app';
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

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

export interface WorldPlayerPublic {
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

interface AuthenticatedWorldSocket extends WebSocket {
  userId?: string;
  lastMoveAt?: number;
  lastChatAt?: number;
}

const lobbyPlayers = new Map<string, WorldPlayerPublic>();
const worldConnections = new Map<string, AuthenticatedWorldSocket>();

function occupiedCells(): Set<string> {
  const set = new Set<string>();
  lobbyPlayers.forEach((p) => set.add(`${p.x},${p.y}`));
  return set;
}

function findSpawnPosition(): { x: number; y: number } | null {
  const occupied = occupiedCells();
  for (let attempt = 0; attempt < 200; attempt++) {
    const x = Math.floor(Math.random() * WORLD_GRID_WIDTH);
    const y = Math.floor(Math.random() * WORLD_GRID_HEIGHT);
    if (!occupied.has(`${x},${y}`)) return { x, y };
  }
  for (let y = 0; y < WORLD_GRID_HEIGHT; y++) {
    for (let x = 0; x < WORLD_GRID_WIDTH; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  return null;
}

function broadcastToOthers(excludeUserId: string, message: object): void {
  const payload = JSON.stringify(message);
  worldConnections.forEach((sock, uid) => {
    if (uid === excludeUserId) return;
    if (sock.readyState === WebSocket.OPEN) sock.send(payload);
  });
}

function broadcastToAll(message: object): void {
  const payload = JSON.stringify(message);
  worldConnections.forEach((sock) => {
    if (sock.readyState === WebSocket.OPEN) sock.send(payload);
  });
}

export const handleWorldWebSocket = (ws: AuthenticatedWorldSocket, req: any): void => {
  const url = new URL(req.url || '', 'http://localhost');
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(1008, 'Authentication required');
    return;
  }

  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    const userId = decoded.userId;
    ws.userId = userId;

    const joinLobby = async (): Promise<void> => {
      const user = await User.findById(userId).select(
        'username displayName avatar avatarCharacter avatarBackgroundColor pixelCharacter',
      );

      if (!user) {
        ws.send(JSON.stringify({ type: 'error', code: 'USER_NOT_FOUND', message: 'User not found' }));
        ws.close(1008, 'User not found');
        return;
      }

      // Close any existing connection for this user
      const existingConn = worldConnections.get(userId);
      if (existingConn && existingConn !== ws) {
        try { existingConn.close(); } catch { /* ignore */ }
      }
      worldConnections.set(userId, ws);

      let player = lobbyPlayers.get(userId);
      if (!player) {
        if (lobbyPlayers.size >= MAX_LOBBY_PLAYERS) {
          ws.send(JSON.stringify({ type: 'error', code: 'LOBBY_FULL', message: 'Room is full. Try again later.' }));
          ws.close(1013, 'Lobby full');
          worldConnections.delete(userId);
          return;
        }
        const spawn = findSpawnPosition();
        if (!spawn) {
          ws.send(JSON.stringify({ type: 'error', code: 'NO_SPACE', message: 'No space in the room.' }));
          ws.close(1013, 'No space');
          worldConnections.delete(userId);
          return;
        }
        player = {
          userId,
          username: user.username,
          displayName: user.displayName || user.username,
          x: spawn.x,
          y: spawn.y,
          avatar: normalizeUrl(user.avatar) || null,
          avatarCharacter: user.avatarCharacter || null,
          avatarBackgroundColor: user.avatarBackgroundColor || null,
          pixelCharacter: user.pixelCharacter || null,
        };
        lobbyPlayers.set(userId, player);
        broadcastToOthers(userId, { type: 'player_joined', player });
      } else {
        // Reconnect — refresh profile data
        player = {
          ...player,
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: normalizeUrl(user.avatar) || null,
          avatarCharacter: user.avatarCharacter || null,
          avatarBackgroundColor: user.avatarBackgroundColor || null,
          pixelCharacter: user.pixelCharacter || null,
        };
        lobbyPlayers.set(userId, player);
      }

      const players = Array.from(lobbyPlayers.values());
      ws.send(JSON.stringify({ type: 'snapshot', players }));
    };

    joinLobby().catch((err) => {
      console.error('World lobby join error:', err);
      try {
        ws.send(JSON.stringify({ type: 'error', code: 'JOIN_FAILED', message: 'Could not join room' }));
      } catch { /* ignore */ }
      ws.close(1011, 'Join failed');
    });

    // ── Message handler ───────────────────────────────────────
    ws.on('message', (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());

        // Ping / pong
        if (data.type === 'ping') {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // Movement
        if (data.type === 'move') {
          const uid = ws.userId;
          if (!uid) return;

          const nx = Number(data.x);
          const ny = Number(data.y);
          if (
            !Number.isInteger(nx) || !Number.isInteger(ny) ||
            nx < 0 || ny < 0 ||
            nx >= WORLD_GRID_WIDTH || ny >= WORLD_GRID_HEIGHT
          ) {
            ws.send(JSON.stringify({ type: 'error', code: 'INVALID_MOVE', message: 'Invalid coordinates' }));
            return;
          }

          const now = Date.now();
          if (ws.lastMoveAt !== undefined && now - ws.lastMoveAt < MIN_MOVE_INTERVAL_MS) return;
          ws.lastMoveAt = now;

          const player = lobbyPlayers.get(uid);
          if (!player) return;

          // Allow 1-tile orthogonal movement
          const dx = Math.abs(nx - player.x);
          const dy = Math.abs(ny - player.y);
          if (dx + dy !== 1) {
            ws.send(JSON.stringify({ type: 'error', code: 'INVALID_MOVE', message: 'Move one tile at a time' }));
            return;
          }

          player.x = nx;
          player.y = ny;
          lobbyPlayers.set(uid, player);

          broadcastToAll({ type: 'player_moved', userId: uid, x: nx, y: ny });
          return;
        }

        // Chat message
        if (data.type === 'chat') {
          const uid = ws.userId;
          if (!uid) return;

          const now = Date.now();
          if (ws.lastChatAt !== undefined && now - ws.lastChatAt < CHAT_COOLDOWN_MS) return;
          ws.lastChatAt = now;

          const player = lobbyPlayers.get(uid);
          if (!player) return;

          let text = String(data.text || '').trim();
          if (!text || text.length > MAX_CHAT_LENGTH) return;

          broadcastToAll({
            type: 'chat',
            userId: uid,
            username: player.username,
            displayName: player.displayName,
            text,
          });
          return;
        }
      } catch (e) {
        console.error('World WS message error:', e);
      }
    });

    // ── Cleanup on disconnect ─────────────────────────────────
    const cleanup = () => {
      const uid = ws.userId;
      if (!uid) return;
      const current = worldConnections.get(uid);
      if (current === ws) {
        worldConnections.delete(uid);
        lobbyPlayers.delete(uid);
        broadcastToOthers(uid, { type: 'player_left', userId: uid });
      }
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);
  } catch (error) {
    console.error('World WebSocket auth error:', error);
    ws.close(1008, 'Invalid token');
  }
};
