import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/hooks/useTheme';
import { useAuthStore } from '../src/store/authStore';
import { worldWebSocketService, WorldPlayer } from '../src/services/worldWebSocket.service';
import { WORLD_GRID_WIDTH, WORLD_GRID_HEIGHT } from '../src/constants/world';
import { WorldAvatar } from '../src/components/world/WorldAvatar';
import { SPACING, TYPOGRAPHY } from '../src/constants/theme';

const AVATAR_IN_CELL = 0.62;

export default function WorldScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [players, setPlayers] = useState<WorldPlayer[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const horizontalPad = SPACING.md * 2;
  const headerBlock = insets.top + 56;
  const bottomPad = insets.bottom + 24;
  const maxW = screenW - horizontalPad;
  const maxH = screenH - headerBlock - bottomPad;
  const cellSize = Math.max(
    20,
    Math.min(Math.floor(maxW / WORLD_GRID_WIDTH), Math.floor(maxH / WORLD_GRID_HEIGHT))
  );
  const gridW = cellSize * WORLD_GRID_WIDTH;
  const gridH = cellSize * WORLD_GRID_HEIGHT;
  const avatarSize = Math.floor(cellSize * AVATAR_IN_CELL);

  const myId = user?._id != null ? String(user._id) : undefined;

  const myPlayer = useMemo(() => players.find((p) => p.userId === myId), [players, myId]);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    setConnecting(true);
    void worldWebSocketService.connect();

    const unSubSnap = worldWebSocketService.on('snapshot', (list: WorldPlayer[]) => {
      setPlayers(list);
      setConnected(true);
      setConnecting(false);
    });
    const unJoin = worldWebSocketService.on('player_joined', (p: WorldPlayer) => {
      setPlayers((prev) => {
        const rest = prev.filter((x) => x.userId !== p.userId);
        return [...rest, p];
      });
    });
    const unMove = worldWebSocketService.on('player_moved', (uid: string, x: number, y: number) => {
      setPlayers((prev) =>
        prev.map((pl) => (pl.userId === uid ? { ...pl, x, y } : pl))
      );
    });
    const unLeft = worldWebSocketService.on('player_left', (uid: string) => {
      setPlayers((prev) => prev.filter((pl) => pl.userId !== uid));
    });
    const unConn = worldWebSocketService.on('connected', () => setConnected(true));
    const unDisc = worldWebSocketService.on('disconnected', () => {
      setConnected(false);
      setConnecting(false);
    });
    const unErr = worldWebSocketService.on('error', (e: Error) => {
      if (e.message?.includes('No auth')) return;
      Alert.alert('Plaza', e.message || 'Connection issue');
    });

    return () => {
      unSubSnap();
      unJoin();
      unMove();
      unLeft();
      unConn();
      unDisc();
      unErr();
      worldWebSocketService.disconnect();
    };
  }, [user, router]);

  const onCellPress = useCallback(
    (tx: number, ty: number) => {
      if (!myPlayer || !myId) return;
      const d = Math.abs(tx - myPlayer.x) + Math.abs(ty - myPlayer.y);
      if (d !== 1) return;
      worldWebSocketService.sendMove(tx, ty);
    },
    [myPlayer, myId]
  );

  const isAdjacentToMe = useCallback(
    (tx: number, ty: number) => {
      if (!myPlayer) return false;
      return Math.abs(tx - myPlayer.x) + Math.abs(ty - myPlayer.y) === 1;
    },
    [myPlayer]
  );

  const cells = useMemo(() => {
    const rows: { x: number; y: number; dark: boolean }[] = [];
    for (let y = 0; y < WORLD_GRID_HEIGHT; y++) {
      for (let x = 0; x < WORLD_GRID_WIDTH; x++) {
        rows.push({ x, y, dark: (x + y) % 2 === 0 });
      }
    }
    return rows;
  }, []);

  return (
    <LinearGradient
      colors={['#070b14', '#0f1629', '#0a0e1a']}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={[styles.headerBtn, { borderColor: colors.glass.border, backgroundColor: colors.glass.background }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Commune Plaza</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {connected ? 'Walk on highlighted tiles' : connecting ? 'Connecting…' : '…'}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.centerArea}>
        {(connecting || (!connected && players.length === 0)) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <View style={[styles.gridWrap, { width: gridW, height: gridH }]}>
          {cells.map(({ x, y, dark }) => {
            const adj = isAdjacentToMe(x, y);
            return (
              <Pressable
                key={`${x}-${y}`}
                onPress={() => onCellPress(x, y)}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: dark ? '#1e2a3f' : '#263548',
                    borderWidth: adj ? 2 : 0,
                    borderColor: adj ? 'rgba(96, 165, 250, 0.85)' : 'transparent',
                  },
                ]}
              />
            );
          })}

          <View style={[styles.avatarLayer, { width: gridW, height: gridH }]} pointerEvents="none">
            {players.map((p) => {
              const offset = (cellSize - avatarSize) / 2 - 2;
              return (
                <View
                  key={p.userId}
                  style={[
                    styles.avatarPos,
                    {
                      left: p.x * cellSize + offset,
                      top: p.y * cellSize + offset - 14,
                      width: avatarSize + 8,
                    },
                  ]}
                >
                  <WorldAvatar
                    userId={p.userId}
                    uri={p.avatar}
                    name={p.displayName}
                    avatarCharacter={p.avatarCharacter}
                    avatarBackgroundColor={p.avatarBackgroundColor}
                    size={avatarSize}
                    label={p.displayName}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 0,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#0d1117',
  },
  cell: {
    margin: 0,
    borderRadius: 0,
  },
  avatarLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  avatarPos: {
    position: 'absolute',
    alignItems: 'center',
  },
});
