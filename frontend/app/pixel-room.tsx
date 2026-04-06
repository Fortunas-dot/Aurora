import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Rect } from 'react-native-svg';

import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import {
  roomWebSocketService,
  RoomPlayer,
  RoomChatMessage,
} from '../src/services/roomWebSocket.service';
import PixelCharacter from '../src/components/pixel/PixelCharacter';
import {
  PixelCharacterConfig,
  DEFAULT_PIXEL_CHARACTER,
  HairStyle,
} from '../src/constants/pixelCharacterOptions';

// ════════════════════════════════════════════════════════════════
// HABBO-STYLE CONSTANTS
// ════════════════════════════════════════════════════════════════

const GRID_W = 10;
const GRID_H = 8;

const TILE_W = 64;
const TILE_H = 32;
const TILE_DEPTH = 8;
const WALL_HEIGHT = 120;

// ── Habbo color palette ─────────────────────────────────────
const FLOOR = {
  topA: '#7AB648',
  topB: '#6DA03C',
  left: '#5C8E31',
  right: '#4A7528',
  outline: '#3D6120',
};

const WALL = {
  back: '#89B2D3',
  backDark: '#7AA3C4',
  left: '#6E98B8',
  leftDark: '#5F89A9',
  trim: '#4A6E88',
  stripe: 'rgba(255,255,255,0.10)',
  corner: '#3A5A74',
};

const ROOM_BG = '#0D1B2A';

// ── Isometric math ──────────────────────────────────────────

function toIso(gx: number, gy: number) {
  return {
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2),
  };
}

// ── Compute viewBox ─────────────────────────────────────────

const cornerTop = { x: 0, y: -TILE_H / 2 }; // tile(0,0).top — where walls meet
const wallTopY = cornerTop.y - WALL_HEIGHT;

// Left wall extends to tile(0, GRID_H-1).left
const leftWallEnd = {
  x: -(GRID_H) * (TILE_W / 2),
  y: (GRID_H - 1) * (TILE_H / 2),
};

// Back wall extends to tile(GRID_W-1, 0).right
const backWallEnd = {
  x: GRID_W * (TILE_W / 2),
  y: (GRID_W - 1) * (TILE_H / 2),
};

// Floor bottom = tile(GRID_W-1, GRID_H-1).bottom + depth
const floorBottomTile = toIso(GRID_W - 1, GRID_H - 1);
const floorBottomY = floorBottomTile.y + TILE_H / 2 + TILE_DEPTH;

const PAD = 10;
const VB_X = leftWallEnd.x - PAD;
const VB_Y = wallTopY - PAD;
const VB_W = backWallEnd.x - leftWallEnd.x + PAD * 2;
const VB_H = floorBottomY - wallTopY + PAD * 2;

// ── Tile polygon helpers (returns SVG points string) ────────

function pts(coords: number[][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ');
}

function tileTopPts(cx: number, cy: number): string {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return pts([
    [cx, cy - hh],
    [cx + hw, cy],
    [cx, cy + hh],
    [cx - hw, cy],
  ]);
}

function tileLeftSidePts(cx: number, cy: number): string {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return pts([
    [cx - hw, cy],
    [cx, cy + hh],
    [cx, cy + hh + TILE_DEPTH],
    [cx - hw, cy + TILE_DEPTH],
  ]);
}

function tileRightSidePts(cx: number, cy: number): string {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return pts([
    [cx, cy + hh],
    [cx + hw, cy],
    [cx + hw, cy + TILE_DEPTH],
    [cx, cy + hh + TILE_DEPTH],
  ]);
}

// ── Wall stripe line data ───────────────────────────────────

function getWallStripes() {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const stripeCount = 5;
  for (let i = 1; i <= stripeCount; i++) {
    const h = (WALL_HEIGHT / (stripeCount + 1)) * i;
    // Back wall stripe
    lines.push({
      x1: cornerTop.x,
      y1: cornerTop.y - h,
      x2: backWallEnd.x,
      y2: backWallEnd.y - h,
    });
    // Left wall stripe
    lines.push({
      x1: cornerTop.x,
      y1: cornerTop.y - h,
      x2: leftWallEnd.x,
      y2: leftWallEnd.y - h,
    });
  }
  return lines;
}

const WALL_STRIPES = getWallStripes();

// ════════════════════════════════════════════════════════════════
// ROOM SVG COMPONENT
// ════════════════════════════════════════════════════════════════

const HabboRoom = React.memo(() => {
  const tiles: React.ReactNode[] = [];

  // Render tiles back-to-front (gy=0 first, then gy=1, etc.)
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const { x: cx, y: cy } = toIso(gx, gy);
      const isEven = (gx + gy) % 2 === 0;
      const topColor = isEven ? FLOOR.topA : FLOOR.topB;
      const key = `t${gx}-${gy}`;

      tiles.push(
        <Polygon key={`${key}l`} points={tileLeftSidePts(cx, cy)} fill={FLOOR.left} />,
        <Polygon key={`${key}r`} points={tileRightSidePts(cx, cy)} fill={FLOOR.right} />,
        <Polygon
          key={`${key}t`}
          points={tileTopPts(cx, cy)}
          fill={topColor}
          stroke={FLOOR.outline}
          strokeWidth={0.5}
        />,
      );
    }
  }

  // Wall polygons
  const backWallPts = pts([
    [cornerTop.x, cornerTop.y],
    [backWallEnd.x, backWallEnd.y],
    [backWallEnd.x, backWallEnd.y - WALL_HEIGHT],
    [cornerTop.x, cornerTop.y - WALL_HEIGHT],
  ]);

  const leftWallPts = pts([
    [cornerTop.x, cornerTop.y],
    [leftWallEnd.x, leftWallEnd.y],
    [leftWallEnd.x, leftWallEnd.y - WALL_HEIGHT],
    [cornerTop.x, cornerTop.y - WALL_HEIGHT],
  ]);

  return (
    <>
      {/* Background */}
      <Rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill={ROOM_BG} />

      {/* Left wall */}
      <Polygon points={leftWallPts} fill={WALL.left} />
      {/* Back wall */}
      <Polygon points={backWallPts} fill={WALL.back} />

      {/* Wall stripes (wallpaper pattern) */}
      {WALL_STRIPES.map((s, i) => (
        <Line
          key={`ws${i}`}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={WALL.stripe}
          strokeWidth={1}
        />
      ))}

      {/* Corner vertical line */}
      <Line
        x1={cornerTop.x}
        y1={cornerTop.y}
        x2={cornerTop.x}
        y2={cornerTop.y - WALL_HEIGHT}
        stroke={WALL.corner}
        strokeWidth={2}
      />

      {/* Wall–floor trim (baseboard) */}
      <Line
        x1={cornerTop.x}
        y1={cornerTop.y}
        x2={backWallEnd.x}
        y2={backWallEnd.y}
        stroke={WALL.trim}
        strokeWidth={2.5}
      />
      <Line
        x1={cornerTop.x}
        y1={cornerTop.y}
        x2={leftWallEnd.x}
        y2={leftWallEnd.y}
        stroke={WALL.trim}
        strokeWidth={2.5}
      />

      {/* Floor tiles */}
      {tiles}
    </>
  );
});

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════

const CHAT_BUBBLE_DURATION = 5000;
const WALK_STEP_MS = 180;

const { width: SCREEN_W } = Dimensions.get('window');
const SVG_W = SCREEN_W;
const SVG_H = SVG_W * (VB_H / VB_W);

// Character display size — Habbo proportions (26/15 ≈ 1.73 aspect, rounded head)
const CHAR_W = Math.round((TILE_W * 0.7) / VB_W * SVG_W);
const CHAR_H = Math.round(CHAR_W * 1.65);

interface ChatBubble {
  userId: string;
  text: string;
  expiresAt: number;
}

// Convert room coords → screen pixel coords
function roomToScreen(rx: number, ry: number) {
  return {
    x: (rx - VB_X) / VB_W * SVG_W,
    y: (ry - VB_Y) / VB_H * SVG_H,
  };
}

// Convert screen tap → grid cell
function screenToGrid(sx: number, sy: number) {
  const rx = sx / SVG_W * VB_W + VB_X;
  const ry = sy / SVG_H * VB_H + VB_Y;
  const gx = Math.round(rx / TILE_W + ry / TILE_H);
  const gy = Math.round(ry / TILE_H - rx / TILE_W);
  return {
    gx: Math.max(0, Math.min(GRID_W - 1, gx)),
    gy: Math.max(0, Math.min(GRID_H - 1, gy)),
  };
}

export default function PixelRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [players, setPlayers] = useState<Map<string, RoomPlayer>>(new Map());
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);
  const [chatLog, setChatLog] = useState<RoomChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);

  const playersRef = useRef(players);
  playersRef.current = players;
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkPathRef = useRef<{ x: number; y: number }[]>([]);

  // ── WebSocket ─────────────────────────────────────────────
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(roomWebSocketService.on('connected', () => setConnected(true)));
    unsubs.push(roomWebSocketService.on('disconnected', () => setConnected(false)));

    unsubs.push(
      roomWebSocketService.on('snapshot', (snapshotPlayers: RoomPlayer[]) => {
        const map = new Map<string, RoomPlayer>();
        snapshotPlayers.forEach((p) => map.set(p.userId, p));
        setPlayers(map);
        setPlayerCount(map.size);
      }),
    );

    unsubs.push(
      roomWebSocketService.on('player_joined', (player: RoomPlayer) => {
        setPlayers((prev) => {
          const next = new Map(prev);
          next.set(player.userId, player);
          setPlayerCount(next.size);
          return next;
        });
      }),
    );

    unsubs.push(
      roomWebSocketService.on('player_left', (userId: string) => {
        setPlayers((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          setPlayerCount(next.size);
          return next;
        });
      }),
    );

    unsubs.push(
      roomWebSocketService.on('player_moved', (userId: string, x: number, y: number) => {
        setPlayers((prev) => {
          const p = prev.get(userId);
          if (!p) return prev;
          const next = new Map(prev);
          next.set(userId, { ...p, x, y });
          return next;
        });
      }),
    );

    unsubs.push(
      roomWebSocketService.on('chat', (msg: RoomChatMessage) => {
        setChatLog((prev) => [...prev.slice(-50), msg]);
        setChatBubbles((prev) => [
          ...prev.filter((b) => b.userId !== msg.userId),
          { userId: msg.userId, text: msg.text, expiresAt: Date.now() + CHAT_BUBBLE_DURATION },
        ]);
      }),
    );

    roomWebSocketService.connect();

    return () => {
      unsubs.forEach((u) => u());
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
      roomWebSocketService.disconnect();
    };
  }, []);

  // Expire chat bubbles
  useEffect(() => {
    const timer = setInterval(() => {
      setChatBubbles((prev) => prev.filter((b) => b.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Auto-walk: tap a tile and the character walks there ───
  const startWalking = useCallback(() => {
    if (walkTimerRef.current) return;
    function step() {
      const next = walkPathRef.current.shift();
      if (!next) { walkTimerRef.current = null; return; }
      roomWebSocketService.move(next.x, next.y);
      walkTimerRef.current = setTimeout(step, WALK_STEP_MS);
    }
    step();
  }, []);

  const handleTapRoom = useCallback(
    (evt: any) => {
      if (!user) return;
      const me = playersRef.current.get(user._id);
      if (!me) return;

      const { locationX, locationY } = evt.nativeEvent;
      const { gx: tx, gy: ty } = screenToGrid(locationX, locationY);

      // Cancel existing walk
      if (walkTimerRef.current) {
        clearTimeout(walkTimerRef.current);
        walkTimerRef.current = null;
      }

      // Build path (horizontal then vertical — simple L-path)
      const path: { x: number; y: number }[] = [];
      let cx = me.x;
      let cy = me.y;

      while (cx !== tx) {
        cx += cx < tx ? 1 : -1;
        path.push({ x: cx, y: cy });
      }
      while (cy !== ty) {
        cy += cy < ty ? 1 : -1;
        path.push({ x: cx, y: cy });
      }

      if (path.length === 0) return;
      walkPathRef.current = path;
      startWalking();
    },
    [user, startWalking],
  );

  // ── Send chat ─────────────────────────────────────────────
  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    roomWebSocketService.chat(text);
    setChatInput('');
  }, [chatInput]);

  // ── Render ────────────────────────────────────────────────

  const sortedPlayers = useMemo(
    () =>
      Array.from(players.values()).sort(
        (a, b) => a.y + a.x * 0.01 - (b.y + b.x * 0.01),
      ),
    [players],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: ROOM_BG }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pixel Room</Text>
          <View style={styles.onlineBadge}>
            <View style={[styles.onlineDot, connected && styles.onlineDotActive]} />
            <Text style={styles.onlineText}>{playerCount} online</Text>
          </View>
        </View>
        <Pressable style={styles.headerBtn} onPress={() => setShowChat(!showChat)}>
          <Ionicons name={showChat ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color="#fff" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        {/* Isometric room */}
        <View style={styles.roomWrapper}>
          <Pressable onPress={handleTapRoom}>
            <View style={{ width: SVG_W, height: SVG_H }}>
              {/* Room SVG (walls + floor) */}
              <Svg
                width={SVG_W}
                height={SVG_H}
                viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
                style={StyleSheet.absoluteFill}
              >
                <HabboRoom />
              </Svg>

              {/* Player sprites (overlay on top of SVG) */}
              {sortedPlayers.map((p) => {
                const iso = toIso(p.x, p.y);
                const screen = roomToScreen(iso.x, iso.y);
                const isMe = p.userId === user?._id;
                const bubble = chatBubbles.find((b) => b.userId === p.userId);

                const charConfig: PixelCharacterConfig = p.pixelCharacter
                  ? {
                      skinColor: p.pixelCharacter.skinColor,
                      hairStyle: (p.pixelCharacter.hairStyle as HairStyle) || 'bob',
                      hairColor: p.pixelCharacter.hairColor,
                      eyeColor: p.pixelCharacter.eyeColor,
                      shirtColor: p.pixelCharacter.shirtColor,
                      pantsColor: p.pixelCharacter.pantsColor,
                      shoeColor: p.pixelCharacter.shoeColor,
                    }
                  : DEFAULT_PIXEL_CHARACTER;

                return (
                  <View
                    key={p.userId}
                    style={[
                      styles.playerContainer,
                      {
                        left: screen.x - CHAR_W / 2,
                        top: screen.y - CHAR_H + 4,
                        width: CHAR_W,
                        zIndex: 100 + p.y * GRID_W + p.x,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    {/* Chat bubble */}
                    {bubble && (
                      <View style={styles.chatBubble}>
                        <Text style={styles.chatBubbleText} numberOfLines={2}>
                          {bubble.text}
                        </Text>
                        <View style={styles.chatBubbleArrow} />
                      </View>
                    )}

                    {/* Shadow ellipse */}
                    <View style={styles.charShadow} />

                    {/* Character */}
                    <PixelCharacter config={charConfig} size={CHAR_W} />

                    {/* Name tag */}
                    <View style={[styles.nameTagBg, isMe && styles.nameTagBgMe]}>
                      <Text style={styles.nameTag} numberOfLines={1}>
                        {p.pixelCharacter?.name || p.displayName}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </View>

        {/* Chat log panel */}
        {showChat && (
          <ScrollView style={styles.chatLogPanel} contentContainerStyle={styles.chatLogContent}>
            {chatLog.length === 0 ? (
              <Text style={styles.chatLogEmpty}>No messages yet. Say hi!</Text>
            ) : (
              chatLog.slice(-30).map((msg, i) => (
                <Text key={i} style={styles.chatLogMessage}>
                  <Text style={styles.chatLogName}>{msg.displayName}: </Text>
                  {msg.text}
                </Text>
              ))
            )}
          </ScrollView>
        )}

        {/* Chat input */}
        <View style={[styles.chatBar, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Say something…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={200}
            selectionColor={WALL.back}
            onSubmitEditing={handleSendChat}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
            onPress={handleSendChat}
            disabled={!chatInput.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 17 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  onlineDotActive: { backgroundColor: '#4ade80' },
  onlineText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  roomWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Player sprite
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  charShadow: {
    width: '80%',
    height: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.25)',
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
  nameTagBg: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
  },
  nameTagBgMe: {
    backgroundColor: 'rgba(59,130,246,0.6)',
  },
  nameTag: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Chat bubble
  chatBubble: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    maxWidth: 130,
    alignSelf: 'center',
  },
  chatBubbleText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: '500',
  },
  chatBubbleArrow: {
    position: 'absolute',
    bottom: -5,
    left: '45%',
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },

  // Chat log
  chatLogPanel: {
    maxHeight: 130,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  chatLogContent: { gap: 3 },
  chatLogEmpty: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  chatLogMessage: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  chatLogName: { color: '#60a5fa', fontWeight: '700' },

  // Chat bar
  chatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: '#fff',
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
});
