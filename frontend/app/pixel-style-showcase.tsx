import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import PixelCharacter from '../src/components/pixel/PixelCharacter';
import {
  DEFAULT_PIXEL_CHARACTER,
  PixelCharacterConfig,
} from '../src/constants/pixelCharacterOptions';

const PREVIEW_CHOICE_KEY = 'pixel_style_showcase_choice';

const HABBO_PRESETS: { id: string; label: string; config: PixelCharacterConfig }[] = [
  { id: 'habbo-bob-brown', label: 'Bob · brown', config: DEFAULT_PIXEL_CHARACTER },
  {
    id: 'habbo-long-blonde',
    label: 'Long · blonde',
    config: {
      ...DEFAULT_PIXEL_CHARACTER,
      hairStyle: 'longSmooth',
      hairColor: '#E8C44A',
      shirtColor: '#CC5599',
      pantsColor: '#2D5F8A',
    },
  },
  {
    id: 'habbo-spiky-black',
    label: 'Spiky · black',
    config: {
      ...DEFAULT_PIXEL_CHARACTER,
      hairStyle: 'spiky',
      hairColor: '#1A1A1A',
      skinColor: '#E8A87C',
      shirtColor: '#1A7A3C',
      pantsColor: '#18181B',
    },
  },
  {
    id: 'habbo-curly-purple',
    label: 'Curly · purple hair',
    config: {
      ...DEFAULT_PIXEL_CHARACTER,
      hairStyle: 'curls',
      hairColor: '#7B2D8B',
      shirtColor: '#D4A017',
      pantsColor: '#1A2744',
    },
  },
  {
    id: 'habbo-deep-skin',
    label: 'Deep skin · bob',
    config: {
      ...DEFAULT_PIXEL_CHARACTER,
      skinColor: '#4A2511',
      hairColor: '#1A1A1A',
      eyeColor: '#1F2937',
      shirtColor: '#0F7A6E',
      pantsColor: '#9E8054',
    },
  },
  {
    id: 'habbo-fair-red',
    label: 'Fair · red hair',
    config: {
      ...DEFAULT_PIXEL_CHARACTER,
      skinColor: '#FDDBB4',
      hairStyle: 'longSmooth',
      hairColor: '#CC2200',
      shirtColor: '#2C3E50',
      pantsColor: '#2D5F8A',
    },
  },
  {
    id: 'habbo-tan-spiky',
    label: 'Tan · spiky blue',
    config: {
      ...DEFAULT_PIXEL_CHARACTER,
      skinColor: '#C68642',
      hairStyle: 'spiky',
      hairColor: '#1A6EBF',
      shirtColor: '#D8DCE0',
      pantsColor: '#6B1A2A',
    },
  },
  {
    id: 'habbo-medium-curly',
    label: 'Medium · curly green',
    config: {
      ...DEFAULT_PIXEL_CHARACTER,
      skinColor: '#8D5524',
      hairStyle: 'curls',
      hairColor: '#1A7A3C',
      shirtColor: '#C45C00',
      pantsColor: '#1A4A2A',
    },
  },
];

export default function PixelStyleShowcaseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string>(HABBO_PRESETS[0].id);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(PREVIEW_CHOICE_KEY);
        if (v) setSelectedId(v);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const select = useCallback(async (id: string) => {
    setSelectedId(id);
    try {
      await AsyncStorage.setItem(PREVIEW_CHOICE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Habbo looks</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Previews use the official{' '}
          <Text style={styles.introEm}>Habbo Imaging API</Text> (same as{' '}
          <Text style={styles.introEm}>habboFigure.ts</Text> and Pixel Avatar). Scroll sideways to
          compare outfits. Tap one to mark a favorite (reference only — customize your character in
          Pixel Character).
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.hRow}
          style={styles.hScroll}
        >
          {HABBO_PRESETS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.tile, selectedId === p.id && styles.tileSelected]}
              onPress={() => select(p.id)}
            >
              {selectedId === p.id && (
                <View style={styles.tileCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.tilePreview}>
                <PixelCharacter config={p.config} size={56} direction={2} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Selected: <Text style={styles.footerEm}>{selectedId}</Text> (saved on this device)
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const TILE_W = 118;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  introEm: { color: COLORS.text, fontWeight: '600' },
  hScroll: { marginBottom: SPACING.md, marginHorizontal: -SPACING.xs },
  hRow: {
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tile: {
    width: TILE_W,
    marginRight: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: SPACING.sm,
    position: 'relative',
  },
  tileSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(96,165,250,0.1)',
  },
  tileCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  tilePreview: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  tileLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footerNote: { marginTop: SPACING.md, paddingBottom: SPACING.sm },
  footerText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  footerEm: { color: COLORS.primary, fontWeight: '700' },
});
