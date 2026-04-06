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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
} from '../src/constants/pixelCharacterOptions';

const GRID_W = 12;
const GRID_H = 10;

// Isometric tile dimensions
const TILE_W = 48;
const TILE_H = 24;

// Iso projection: grid (gx, gy) → screen (px, py)
function toIso(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2),
  };
}

// Reverse: screen tap → nearest grid cell
function fromIso(px: number, py: number): { gx: number; gy: number } {
  const gx = Math.round(px / TILE_W + py / TILE_H);
  const gy = Math.round(py / TILE_H - px / TILE_W);
  return { gx, gy };
}

// Full isometric canvas size
const isoOrigin = toIso(0, 0);
const isoEnd = toIso(GRID_W - 1, GRID_H - 1);
const isoTopRight = toIso(GRID_W - 1, 0);
const isoBottomLeft = toIso(0, GRID_H - 1);
const CANVAS_W = isoTopRight.x - isoBottomLeft.x + TILE_W;
const CANVAS_H = isoEnd.y - isoOrigin.y + TILE_H + 60; // extra room for characters on top

// Offset so the isometric grid is centered in the canvas
const OFFSET_X = -isoBottomLeft.x + TILE_W / 2;
const OFFSET_Y = -isoOrigin.y + 40; // top padding for character heads

const CHAT_BUBBLE_DURATION = 5000;

interface ChatBubble {
  userId: string;
  text: string;
  expiresAt: number;
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

  // ── Connect to room WS ────────────────────────────────────
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

  // ── Tap to move ────────────────────────────────────────────
  const handleTapGrid = useCallback(
    (evt: any) => {
      if (!user) return;
      const me = playersRef.current.get(user._id);
      if (!me) return;

      const { locationX, locationY } = evt.nativeEvent;
      const isoX = locationX - OFFSET_X;
      const isoY = locationY - OFFSET_Y;
      const { gx, gy } = fromIso(isoX, isoY);

      // Clamp to grid
      const tx = Math.max(0, Math.min(GRID_W - 1, gx));
      const ty = Math.max(0, Math.min(GRID_H - 1, gy));

      // Only move one step towards target
      const dx = tx - me.x;
      const dy = ty - me.y;
      if (dx === 0 && dy === 0) return;

      let nx = me.x;
      let ny = me.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        nx += dx > 0 ? 1 : -1;
      } else {
        ny += dy > 0 ? 1 : -1;
      }

      roomWebSocketService.move(nx, ny);
    },
    [user],
  );

  // ── Send chat ──────────────────────────────────────────────
  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    roomWebSocketService.chat(text);
    setChatInput('');
  }, [chatInput]);

  // ── Render ─────────────────────────────────────────────────

  // Sort players by Y then X for proper isometric layering
  const sortedPlayers = Array.from(players.values()).sort(
    (a, b) => a.y + a.x / 100 - (b.y + b.x / 100),
  );

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pixel Room</Text>
          <View style={styles.onlineBadge}>
            <View style={[styles.onlineDot, connected && styles.onlineDotActive]} />
            <Text style={styles.onlineText}>{playerCount} online</Text>
          </View>
        </View>
        <Pressable style={styles.headerBtn} onPress={() => setShowChat(!showChat)}>
          <Ionicons name={showChat ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={COLORS.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        {/* Isometric room */}
        <View style={styles.roomWrapper}>
          <Pressable onPress={handleTapGrid}>
            <View style={[styles.roomCanvas, { width: CANVAS_W, height: CANVAS_H }]}>
              {/* Floor tiles */}
              {Array.from({ length: GRID_H }).map((_, gy) =>
                Array.from({ length: GRID_W }).map((_, gx) => {
                  const pos = toIso(gx, gy);
                  const isEven = (gx + gy) % 2 === 0;
                  return (
                    <View
                      key={`tile-${gx}-${gy}`}
                      style={[
                        styles.tile,
                        {
                          left: pos.x + OFFSET_X - TILE_W / 2,
                          top: pos.y + OFFSET_Y - TILE_H / 2,
                          width: TILE_W,
                          height: TILE_H,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.tileInner,
                          {
                            backgroundColor: isEven
                              ? 'rgba(96,165,250,0.12)'
                              : 'rgba(96,165,250,0.06)',
                            borderColor: 'rgba(96,165,250,0.20)',
                          },
                        ]}
                      />
                    </View>
                  );
                }),
              )}

              {/* Players */}
              {sortedPlayers.map((p) => {
                const pos = toIso(p.x, p.y);
                const screenX = pos.x + OFFSET_X;
                const screenY = pos.y + OFFSET_Y;
                const isMe = p.userId === user?._id;
                const bubble = chatBubbles.find((b) => b.userId === p.userId);

                const charConfig: PixelCharacterConfig = p.pixelCharacter
                  ? {
                      skinColor: p.pixelCharacter.skinColor,
                      hairStyle: p.pixelCharacter.hairStyle as any,
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
                        left: screenX - 24,
                        top: screenY - 62,
                        zIndex: 100 + p.y * GRID_W + p.x,
                      },
                    ]}
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

                    {/* Character */}
                    <PixelCharacter config={charConfig} size={48} />

                    {/* Name tag */}
                    <Text
                      style={[styles.nameTag, isMe && styles.nameTagMe]}
                      numberOfLines={1}
                    >
                      {p.pixelCharacter?.name || p.displayName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </View>

        {/* Chat log panel (toggled) */}
        {showChat && (
          <View style={styles.chatLogPanel}>
            {chatLog.length === 0 ? (
              <Text style={styles.chatLogEmpty}>No messages yet. Say hi!</Text>
            ) : (
              chatLog.slice(-20).map((msg, i) => (
                <Text key={i} style={styles.chatLogMessage}>
                  <Text style={styles.chatLogName}>{msg.displayName}: </Text>
                  {msg.text}
                </Text>
              ))
            )}
          </View>
        )}

        {/* Chat input */}
        <View style={[styles.chatBar, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Say something…"
            placeholderTextColor={COLORS.textMuted}
            maxLength={200}
            selectionColor={COLORS.primary}
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
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },

  // Header
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
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: COLORS.text, fontWeight: '700', fontSize: 17 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textMuted },
  onlineDotActive: { backgroundColor: COLORS.success },
  onlineText: { color: COLORS.textMuted, fontSize: 11 },

  // Room
  roomWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roomCanvas: {
    position: 'relative',
  },

  // Isometric tile
  tile: {
    position: 'absolute',
  },
  tileInner: {
    flex: 1,
    borderWidth: 1,
    transform: [{ rotateX: '60deg' }, { rotateZ: '45deg' }],
    borderRadius: 2,
  },

  // Player
  playerContainer: {
    position: 'absolute',
    width: 48,
    alignItems: 'center',
  },
  nameTag: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  nameTagMe: {
    color: COLORS.primary,
  },

  // Chat bubble
  chatBubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    maxWidth: 120,
    alignSelf: 'center',
  },
  chatBubbleText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: '500',
  },
  chatBubbleArrow: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.95)',
  },

  // Chat log
  chatLogPanel: {
    maxHeight: 140,
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: 3,
  },
  chatLogEmpty: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  chatLogMessage: { color: COLORS.textSecondary, fontSize: 12 },
  chatLogName: { color: COLORS.primary, fontWeight: '700' },

  // Chat input bar
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
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: COLORS.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
