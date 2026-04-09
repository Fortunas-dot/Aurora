/**
 * Pixel Room — multiplayer isometric lounge (Habbo-style).
 * Kept in the codebase for later; entry points are commented out in profile and settings so it is not visible in the UI.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Rect } from 'react-native-svg';

import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { useRoomStore } from '../src/store/roomStore';
import { RoomPlayer } from '../src/services/roomWebSocket.service';
import PixelCharacter from '../src/components/pixel/PixelCharacter';
import {
  PixelCharacterConfig,
  DEFAULT_PIXEL_CHARACTER,
  normalizePixelCharacterConfig,
} from '../src/constants/pixelCharacterOptions';

// ════════════════════════════════════════════════════════════════
// ISOMETRIC CONSTANTS — 2:1 Dimetric Projection (Habbo standard)
// ════════════════════════════════════════════════════════════════

const GRID_W = 10;
const GRID_H = 8;

const TILE_W = 64;
const TILE_H = 32;   // Isometric tile height (2:1 ratio)
const TILE_DEPTH = 8;
const WALL_HEIGHT = 120;

// Habbo color palette
const FLOOR = {
  topA: '#7AB648',
  topB: '#6DA03C',
  left: '#5C8E31',
  right: '#4A7528',
  outline: '#3D6120',
};
const WALL = {
  back: '#89B2D3',
  left: '#6E98B8',
  trim: '#4A6E88',
  stripe: 'rgba(255,255,255,0.10)',
  corner: '#3A5A74',
};
const ROOM_BG = '#0D1B2A';

// ════════════════════════════════════════════════════════════════
// ISOMETRIC MATH
//
// Grid (x,y) → Screen (px,py) using standard 2:1 dimetric:
//   ScreenX = (x - y) * (TILE_W / 2)
//   ScreenY = (x + y) * (TILE_H / 2)
//
// Depth sorting: zIndex = x + y (higher = closer to camera)
// ════════════════════════════════════════════════════════════════

function toIso(gx: number, gy: number) {
  return {
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2),
  };
}

function isoDepth(gx: number, gy: number): number {
  return Math.floor(gx + gy);
}

// ── ViewBox computation ────────────────────────────────────────

const cornerTop = { x: 0, y: -(TILE_H / 2) };
const wallTopY = cornerTop.y - WALL_HEIGHT;

const leftWallEnd = {
  x: -(GRID_H) * (TILE_W / 2),
  y: (GRID_H - 1) * (TILE_H / 2),
};
const backWallEnd = {
  x: GRID_W * (TILE_W / 2),
  y: (GRID_W - 1) * (TILE_H / 2),
};
const floorBottomTile = toIso(GRID_W - 1, GRID_H - 1);
const floorBottomY = floorBottomTile.y + TILE_H / 2 + TILE_DEPTH;

const PAD = 10;
const VB_X = leftWallEnd.x - PAD;
const VB_Y = wallTopY - PAD;
const VB_W = backWallEnd.x - leftWallEnd.x + PAD * 2;
const VB_H = floorBottomY - wallTopY + PAD * 2;

// ── Screen sizing ──────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const SVG_W = SCREEN_W;
const SVG_H = SVG_W * (VB_H / VB_W);

// Character size — real Habbo avatar images are ~110px wide, aspect ~1:1.85
const CHAR_W = Math.round((TILE_W * 0.85) / VB_W * SVG_W);
const CHAR_H = Math.round(CHAR_W * 1.85);

// Convert room SVG coords → screen pixels
function roomToScreen(rx: number, ry: number) {
  return {
    x: (rx - VB_X) / VB_W * SVG_W,
    y: (ry - VB_Y) / VB_H * SVG_H,
  };
}

// Convert screen tap → grid cell (inverse isometric projection)
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

// ════════════════════════════════════════════════════════════════
// TILE & WALL POLYGON HELPERS
// ════════════════════════════════════════════════════════════════

function pts(coords: number[][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ');
}

function tileTopPts(cx: number, cy: number): string {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return pts([[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]]);
}

function tileLeftSidePts(cx: number, cy: number): string {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return pts([[cx - hw, cy], [cx, cy + hh], [cx, cy + hh + TILE_DEPTH], [cx - hw, cy + TILE_DEPTH]]);
}

function tileRightSidePts(cx: number, cy: number): string {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return pts([[cx, cy + hh], [cx + hw, cy], [cx + hw, cy + TILE_DEPTH], [cx, cy + hh + TILE_DEPTH]]);
}

// ── Wall stripe data ───────────────────────────────────────────

const WALL_STRIPES = (() => {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i <= 5; i++) {
    const h = (WALL_HEIGHT / 6) * i;
    lines.push(
      { x1: cornerTop.x, y1: cornerTop.y - h, x2: backWallEnd.x, y2: backWallEnd.y - h },
      { x1: cornerTop.x, y1: cornerTop.y - h, x2: leftWallEnd.x, y2: leftWallEnd.y - h },
    );
  }
  return lines;
})();

// ════════════════════════════════════════════════════════════════
// ROOM SVG — React.memo (static geometry, never re-renders)
// ════════════════════════════════════════════════════════════════

const HabboRoom = React.memo(() => {
  const tiles: React.ReactNode[] = [];

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const { x: cx, y: cy } = toIso(gx, gy);
      const topColor = (gx + gy) % 2 === 0 ? FLOOR.topA : FLOOR.topB;
      const k = `t${gx}-${gy}`;
      tiles.push(
        <Polygon key={`${k}l`} points={tileLeftSidePts(cx, cy)} fill={FLOOR.left} />,
        <Polygon key={`${k}r`} points={tileRightSidePts(cx, cy)} fill={FLOOR.right} />,
        <Polygon key={`${k}t`} points={tileTopPts(cx, cy)} fill={topColor} stroke={FLOOR.outline} strokeWidth={0.5} />,
      );
    }
  }

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
      <Rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill={ROOM_BG} />
      <Polygon points={leftWallPts} fill={WALL.left} />
      <Polygon points={backWallPts} fill={WALL.back} />
      {WALL_STRIPES.map((s, i) => (
        <Line key={`ws${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={WALL.stripe} strokeWidth={1} />
      ))}
      <Line x1={cornerTop.x} y1={cornerTop.y} x2={cornerTop.x} y2={cornerTop.y - WALL_HEIGHT} stroke={WALL.corner} strokeWidth={2} />
      <Line x1={cornerTop.x} y1={cornerTop.y} x2={backWallEnd.x} y2={backWallEnd.y} stroke={WALL.trim} strokeWidth={2.5} />
      <Line x1={cornerTop.x} y1={cornerTop.y} x2={leftWallEnd.x} y2={leftWallEnd.y} stroke={WALL.trim} strokeWidth={2.5} />
      {tiles}
    </>
  );
});

// ════════════════════════════════════════════════════════════════
// ANIMATED PLAYER SPRITE
//
// Each player gets their own Animated.ValueXY that smoothly
// interpolates between tiles using useNativeDriver: true.
// Direction is computed from movement delta.
// ════════════════════════════════════════════════════════════════

const WALK_ANIM_MS = 200;

interface AnimatedPlayerProps {
  player: RoomPlayer;
  isMe: boolean;
  bubbleText?: string;
}

const AnimatedPlayer = React.memo(
  function AnimatedPlayer({ player, isMe, bubbleText }: AnimatedPlayerProps) {
    const iso = toIso(player.x, player.y);
    const screen = roomToScreen(iso.x, iso.y);

    const posRef = useRef({ x: player.x, y: player.y });
    const animX = useRef(new RNAnimated.Value(screen.x)).current;
    const animY = useRef(new RNAnimated.Value(screen.y)).current;
    const [direction, setDirection] = useState(2); // default front-right

    useEffect(() => {
      const prevX = posRef.current.x;
      const prevY = posRef.current.y;
      const newIso = toIso(player.x, player.y);
      const newScreen = roomToScreen(newIso.x, newIso.y);

      // Compute facing direction from movement delta
      const dx = player.x - prevX;
      const dy = player.y - prevY;
      if (dx !== 0 || dy !== 0) {
        // Map dx,dy to Habbo direction (0-7)
        if (dx > 0 && dy === 0) setDirection(2);       // east → front-right
        else if (dx > 0 && dy > 0) setDirection(3);    // SE
        else if (dx === 0 && dy > 0) setDirection(4);   // south → front-left
        else if (dx < 0 && dy > 0) setDirection(5);     // SW
        else if (dx < 0 && dy === 0) setDirection(6);   // west → back-left
        else if (dx < 0 && dy < 0) setDirection(7);     // NW
        else if (dx === 0 && dy < 0) setDirection(0);   // north → back-right
        else if (dx > 0 && dy < 0) setDirection(1);     // NE
      }

      posRef.current = { x: player.x, y: player.y };

      // Animate to new position
      RNAnimated.parallel([
        RNAnimated.timing(animX, {
          toValue: newScreen.x,
          duration: WALK_ANIM_MS,
          useNativeDriver: true,
        }),
        RNAnimated.timing(animY, {
          toValue: newScreen.y,
          duration: WALK_ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
    }, [player.x, player.y]);

    const charConfig: PixelCharacterConfig = player.pixelCharacter
      ? normalizePixelCharacterConfig(player.pixelCharacter as Partial<PixelCharacterConfig>)
      : DEFAULT_PIXEL_CHARACTER;

    const depth = isoDepth(player.x, player.y);

    return (
      <RNAnimated.View
        style={[
          styles.playerContainer,
          {
            width: CHAR_W,
            zIndex: 100 + depth,
            transform: [
              { translateX: RNAnimated.subtract(animX, CHAR_W / 2) },
              { translateY: RNAnimated.subtract(animY, CHAR_H - 4) },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {/* Chat bubble */}
        {bubbleText && (
          <View style={styles.chatBubble}>
            <Text style={styles.chatBubbleText} numberOfLines={2}>
              {bubbleText}
            </Text>
            <View style={styles.chatBubbleArrow} />
          </View>
        )}

        {/* Shadow ellipse */}
        <View style={styles.charShadow} />

        {/* Layered character with direction */}
        <PixelCharacter config={charConfig} size={CHAR_W} direction={direction} />

        {/* Name tag */}
        <View style={[styles.nameTagBg, isMe && styles.nameTagBgMe]}>
          <Text style={styles.nameTag} numberOfLines={1}>
            {player.pixelCharacter?.name || player.displayName}
          </Text>
        </View>
      </RNAnimated.View>
    );
  },
);

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════

const WALK_STEP_MS = 180;

export default function PixelRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  // Zustand room state
  const connected = useRoomStore((s) => s.connected);
  const playerCount = useRoomStore((s) => s.playerCount);
  const sortedPlayers = useRoomStore((s) => s.sortedPlayers);
  const chatBubbles = useRoomStore((s) => s.chatBubbles);
  const chatLog = useRoomStore((s) => s.chatLog);
  const roomConnect = useRoomStore((s) => s.connect);
  const roomDisconnect = useRoomStore((s) => s.disconnect);
  const roomMove = useRoomStore((s) => s.move);
  const roomChat = useRoomStore((s) => s.chat);
  const expireBubbles = useRoomStore((s) => s.expireBubbles);

  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkPathRef = useRef<{ x: number; y: number }[]>([]);

  // We need a ref to access current players for tap handler
  const playersRef = useRef(sortedPlayers);
  playersRef.current = sortedPlayers;

  // ── Connect/disconnect lifecycle ──────────────────────────────
  useEffect(() => {
    roomConnect();

    // Expire bubbles periodically
    const bubbleTimer = setInterval(expireBubbles, 1000);

    return () => {
      clearInterval(bubbleTimer);
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
      roomDisconnect();
    };
  }, []);

  // ── Auto-walk: tap a tile → L-path of 1-tile moves ───────────
  const startWalking = useCallback(() => {
    if (walkTimerRef.current) return;
    function step() {
      const next = walkPathRef.current.shift();
      if (!next) { walkTimerRef.current = null; return; }
      roomMove(next.x, next.y);
      walkTimerRef.current = setTimeout(step, WALK_STEP_MS);
    }
    step();
  }, [roomMove]);

  const handleTapRoom = useCallback(
    (evt: any) => {
      if (!user) return;
      const me = playersRef.current.find((p) => p.userId === user._id);
      if (!me) return;

      const { locationX, locationY } = evt.nativeEvent;
      const { gx: tx, gy: ty } = screenToGrid(locationX, locationY);

      // Cancel existing walk
      if (walkTimerRef.current) {
        clearTimeout(walkTimerRef.current);
        walkTimerRef.current = null;
      }

      // Build L-path (horizontal then vertical)
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

  // ── Chat ──────────────────────────────────────────────────────
  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    roomChat(text);
    setChatInput('');
  }, [chatInput, roomChat]);

  // ── Render ────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: ROOM_BG }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/profile');
          }}
        >
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

              {/* Animated player sprites */}
              {sortedPlayers.map((p) => {
                const bubble = chatBubbles.find((b) => b.userId === p.userId);
                return (
                  <AnimatedPlayer
                    key={p.userId}
                    player={p}
                    isMe={p.userId === user?._id}
                    bubbleText={bubble?.text}
                  />
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
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 17 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  onlineDotActive: { backgroundColor: '#4ade80' },
  onlineText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  roomWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Player sprite
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  charShadow: {
    width: '80%', height: 4, borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.25)',
    position: 'absolute', bottom: 12, alignSelf: 'center',
  },
  nameTagBg: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginTop: 1,
  },
  nameTagBgMe: { backgroundColor: 'rgba(59,130,246,0.6)' },
  nameTag: { color: '#fff', fontSize: 7, fontWeight: '700', textAlign: 'center' },

  // Chat bubble
  chatBubble: {
    backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4,
    maxWidth: 130, alignSelf: 'center',
  },
  chatBubbleText: { color: '#1a1a2e', fontSize: 10, fontWeight: '500' },
  chatBubbleArrow: {
    position: 'absolute', bottom: -5, left: '45%',
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#fff',
  },

  // Chat log
  chatLogPanel: {
    maxHeight: 130, backgroundColor: 'rgba(0,0,0,0.5)',
    marginHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm,
  },
  chatLogContent: { gap: 3 },
  chatLogEmpty: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  chatLogMessage: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  chatLogName: { color: '#60a5fa', fontWeight: '700' },

  // Chat bar
  chatBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, gap: SPACING.sm,
  },
  chatInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: '#fff', fontSize: 14,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
});
