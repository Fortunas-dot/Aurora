import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import PixelCharacter from '../src/components/pixel/PixelCharacter';
import {
  PixelCharacterConfig,
  DEFAULT_PIXEL_CHARACTER,
  HairStyle,
  SKIN_COLORS,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_COLORS,
  SHIRT_COLORS,
  PANTS_COLORS,
  SHOE_COLORS,
} from '../src/constants/pixelCharacterOptions';
import { useAuthStore } from '../src/store/authStore';
import { userService } from '../src/services/user.service';

type Tab = 'body' | 'hair' | 'outfit';

export default function PixelAvatarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();

  const [config, setConfig] = useState<PixelCharacterConfig>(() => {
    if (user?.pixelCharacter) {
      return {
        skinColor: user.pixelCharacter.skinColor || DEFAULT_PIXEL_CHARACTER.skinColor,
        hairStyle: (user.pixelCharacter.hairStyle as HairStyle) || DEFAULT_PIXEL_CHARACTER.hairStyle,
        hairColor: user.pixelCharacter.hairColor || DEFAULT_PIXEL_CHARACTER.hairColor,
        eyeColor: user.pixelCharacter.eyeColor || DEFAULT_PIXEL_CHARACTER.eyeColor,
        shirtColor: user.pixelCharacter.shirtColor || DEFAULT_PIXEL_CHARACTER.shirtColor,
        pantsColor: user.pixelCharacter.pantsColor || DEFAULT_PIXEL_CHARACTER.pantsColor,
        shoeColor: user.pixelCharacter.shoeColor || DEFAULT_PIXEL_CHARACTER.shoeColor,
      };
    }
    return DEFAULT_PIXEL_CHARACTER;
  });
  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [characterName, setCharacterName] = useState(user?.pixelCharacter?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!characterName.trim()) {
      Alert.alert('Name required', 'Give your character a name!');
      return;
    }
    setIsSaving(true);
    try {
      const pixelCharacter = { ...config, name: characterName.trim() };
      const response = await userService.updateProfile({ pixelCharacter });
      if (response.success) {
        updateUser({ pixelCharacter } as any);
        Alert.alert('Saved!', 'Your pixel character has been saved.', [
          { text: 'Enter Room', onPress: () => router.replace('/pixel-room') },
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Could not save your character.');
      }
    } catch {
      Alert.alert('Error', 'Could not save your character.');
    } finally {
      setIsSaving(false);
    }
  }

  function update(partial: Partial<PixelCharacterConfig>) {
    setConfig(prev => ({ ...prev, ...partial }));
  }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Character</Text>
        <Pressable
          style={[styles.headerBtn, styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Character Name */}
        <View style={styles.nameRow}>
          <TextInput
            style={styles.nameInput}
            value={characterName}
            onChangeText={setCharacterName}
            placeholder="Character name…"
            placeholderTextColor={COLORS.textMuted}
            maxLength={20}
            selectionColor={COLORS.primary}
          />
        </View>

        {/* Character Preview */}
        <View style={styles.previewContainer}>
          <LinearGradient
            colors={['rgba(96,165,250,0.12)', 'rgba(167,139,250,0.12)']}
            style={styles.previewCard}
          >
            {/* Pixel grid background dots */}
            <View style={styles.gridOverlay} pointerEvents="none">
              {Array.from({ length: 6 }).map((_, row) =>
                Array.from({ length: 8 }).map((_, col) => (
                  <View
                    key={`dot-${row}-${col}`}
                    style={[
                      styles.gridDot,
                      { top: row * 28 + 14, left: col * 28 + 14 },
                    ]}
                  />
                ))
              )}
            </View>

            <PixelCharacter config={config} size={120} />
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['body', 'hair', 'outfit'] as Tab[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.panel}>
          {activeTab === 'body' && (
            <>
              <SectionTitle title="Skin Tone" />
              <ColorRow
                options={SKIN_COLORS}
                selected={config.skinColor}
                onSelect={value => update({ skinColor: value })}
              />
              <SectionTitle title="Eye Color" />
              <ColorRow
                options={EYE_COLORS}
                selected={config.eyeColor}
                onSelect={value => update({ eyeColor: value })}
              />
            </>
          )}

          {activeTab === 'hair' && (
            <>
              <SectionTitle title="Hair Style" />
              <View style={styles.styleGrid}>
                {HAIR_STYLES.map(style => (
                  <Pressable
                    key={style.value}
                    style={[
                      styles.styleCard,
                      config.hairStyle === style.value && styles.styleCardActive,
                    ]}
                    onPress={() => update({ hairStyle: style.value as HairStyle })}
                  >
                    {/* Mini character preview per style */}
                    <PixelCharacter
                      config={{ ...config, hairStyle: style.value as HairStyle }}
                      size={40}
                    />
                    <Text style={[
                      styles.styleLabel,
                      config.hairStyle === style.value && styles.styleLabelActive,
                    ]}>
                      {style.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <SectionTitle title="Hair Color" />
              <ColorRow
                options={HAIR_COLORS}
                selected={config.hairColor}
                onSelect={value => update({ hairColor: value })}
              />
            </>
          )}

          {activeTab === 'outfit' && (
            <>
              <SectionTitle title="Shirt" />
              <ColorRow
                options={SHIRT_COLORS}
                selected={config.shirtColor}
                onSelect={value => update({ shirtColor: value })}
              />
              <SectionTitle title="Pants" />
              <ColorRow
                options={PANTS_COLORS}
                selected={config.pantsColor}
                onSelect={value => update({ pantsColor: value })}
              />
              <SectionTitle title="Shoes" />
              <ColorRow
                options={SHOE_COLORS}
                selected={config.shoeColor}
                onSelect={value => update({ shoeColor: value })}
              />
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

interface ColorOption {
  label: string;
  value: string;
}

function ColorRow({
  options,
  selected,
  onSelect,
}: {
  options: ColorOption[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.colorRow}>
      {options.map(opt => (
        <Pressable
          key={opt.value}
          onPress={() => onSelect(opt.value)}
          style={[
            styles.colorSwatch,
            { backgroundColor: opt.value },
            selected === opt.value && styles.colorSwatchSelected,
          ]}
        >
          {selected === opt.value && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '700',
  },
  saveBtn: {
    width: 'auto',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Name
  nameRow: {
    marginBottom: SPACING.md,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Preview
  previewContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  previewCard: {
    width: 240,
    height: 320,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
  },
  gridDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BORDER_RADIUS.lg,
    padding: 3,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },

  // Panel
  panel: {
    gap: 4,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },

  // Color swatches
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },

  // Hair style cards
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  styleCard: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    minWidth: 80,
    gap: 4,
  },
  styleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  styleLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  styleLabelActive: {
    color: COLORS.primary,
  },
});
