import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import PixelCharacter from '../src/components/pixel/PixelCharacter';
import {
  PixelCharacterConfig,
  HairStyle,
  Gender,
  ShirtStyle,
  PantsStyle,
  ShoeStyle,
  EyewearStyle,
  MakeupStyle,
  EarringStyle,
  NecklaceStyle,
  PiercingStyle,
  normalizePixelCharacterConfig,
  GENDER_OPTIONS,
  SKIN_COLORS,
  HAIR_STYLES,
  getHairStyleLabel,
  HAIR_COLORS,
  EYE_COLORS,
  SHIRT_STYLES,
  getShirtStyleLabel,
  PANTS_STYLES,
  getPantsStyleLabel,
  SHOE_STYLES,
  getShoeStyleLabel,
  SHIRT_COLORS,
  PANTS_COLORS,
  SHOE_COLORS,
  EYEWEAR_STYLES,
  MAKEUP_STYLES,
  EARRING_STYLES,
  NECKLACE_STYLES,
  PIERCING_STYLES,
  ACCESSORY_COLORS,
  MAKEUP_COLORS,
} from '../src/constants/pixelCharacterOptions';
import { useAuthStore } from '../src/store/authStore';
import { userService } from '../src/services/user.service';

type Tab = 'body' | 'hair' | 'outfit' | 'accessories';

export default function PixelAvatarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();

  const [config, setConfig] = useState<PixelCharacterConfig>(() =>
    normalizePixelCharacterConfig(user?.pixelCharacter as Partial<PixelCharacterConfig> | undefined),
  );
  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const username = user?.username?.trim();
    if (!username) {
      Alert.alert('Error', 'Could not determine your username.');
      return;
    }
    setIsSaving(true);
    try {
      const pixelCharacter = { ...config, name: username };
      const response = await userService.updateProfile({ pixelCharacter });
      if (response.success) {
        updateUser({ pixelCharacter } as any);
        Alert.alert('Saved!', 'Your pixel character has been saved.', [
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
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.previewContainer}>
          <LinearGradient
            colors={['rgba(96,165,250,0.12)', 'rgba(167,139,250,0.12)']}
            style={styles.previewCard}
          >
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
                )),
              )}
            </View>

            <PixelCharacter config={config} size={120} />
          </LinearGradient>
        </View>

        <View style={styles.tabs}>
          {(['body', 'hair', 'outfit', 'accessories'] as Tab[]).map(tab => (
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

        <View style={styles.panel}>
          {activeTab === 'body' && (
            <>
              <SectionTitle title="Body type" />
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.genderCard,
                      config.gender === opt.value && styles.genderCardActive,
                    ]}
                    onPress={() => update({ gender: opt.value as Gender })}
                  >
                    <View style={styles.genderPreview}>
                      <PixelCharacter
                        config={{ ...config, gender: opt.value as Gender }}
                        size={68}
                      />
                    </View>
                    <Text
                      style={[
                        styles.genderLabel,
                        config.gender === opt.value && styles.genderLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <SectionTitle title="Skin tone" />
              <ColorRow
                options={SKIN_COLORS}
                selected={config.skinColor}
                onSelect={value => update({ skinColor: value })}
              />

              <SectionTitle title="Eye color" />
              <ColorRow
                options={EYE_COLORS}
                selected={config.eyeColor}
                onSelect={value => update({ eyeColor: value })}
              />
            </>
          )}

          {activeTab === 'hair' && (
            <>
              <SectionTitle title="Hair style" />
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
                    <PixelCharacter
                      config={{ ...config, hairStyle: style.value as HairStyle }}
                      size={40}
                    />
                    <Text
                      style={[
                        styles.styleLabel,
                        config.hairStyle === style.value && styles.styleLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {getHairStyleLabel(style.value as HairStyle, config.gender)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <SectionTitle title="Hair color" />
              <ColorRow
                options={HAIR_COLORS}
                selected={config.hairColor}
                onSelect={value => update({ hairColor: value })}
              />
            </>
          )}

          {activeTab === 'outfit' && (
            <>
              <SectionTitle title="Top — style" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {SHIRT_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.shirtStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ shirtStyle: s.value })}
                  >
                    <PixelCharacter
                      config={{ ...config, shirtStyle: s.value }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.shirtStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {getShirtStyleLabel(s.value as ShirtStyle, config.gender)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <SectionTitle title="Top — color" />
              <ColorRow
                options={SHIRT_COLORS}
                selected={config.shirtColor}
                onSelect={value => update({ shirtColor: value })}
              />

              <SectionTitle title="Bottom — style" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {PANTS_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.pantsStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ pantsStyle: s.value })}
                  >
                    <PixelCharacter
                      config={{ ...config, pantsStyle: s.value }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.pantsStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {getPantsStyleLabel(s.value as PantsStyle, config.gender)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <SectionTitle title="Bottom — color" />
              <ColorRow
                options={PANTS_COLORS}
                selected={config.pantsColor}
                onSelect={value => update({ pantsColor: value })}
              />

              <SectionTitle title="Shoes — style" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {SHOE_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.shoeStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ shoeStyle: s.value })}
                  >
                    <PixelCharacter
                      config={{ ...config, shoeStyle: s.value }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.shoeStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {getShoeStyleLabel(s.value as ShoeStyle, config.gender)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <SectionTitle title="Shoes — color" />
              <ColorRow
                options={SHOE_COLORS}
                selected={config.shoeColor}
                onSelect={value => update({ shoeColor: value })}
              />
            </>
          )}

          {activeTab === 'accessories' && (
            <>
              <SectionTitle title="Eyewear" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {EYEWEAR_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.eyewearStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ eyewearStyle: s.value as EyewearStyle })}
                  >
                    <PixelCharacter
                      config={{ ...config, eyewearStyle: s.value as EyewearStyle }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.eyewearStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <SectionTitle title="Make-up" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {MAKEUP_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.makeupStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ makeupStyle: s.value as MakeupStyle })}
                  >
                    <PixelCharacter
                      config={{ ...config, makeupStyle: s.value as MakeupStyle }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.makeupStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <SectionTitle title="Earrings" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {EARRING_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.earringStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ earringStyle: s.value as EarringStyle })}
                  >
                    <PixelCharacter
                      config={{ ...config, earringStyle: s.value as EarringStyle }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.earringStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <SectionTitle title="Necklaces" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {NECKLACE_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.necklaceStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ necklaceStyle: s.value as NecklaceStyle })}
                  >
                    <PixelCharacter
                      config={{ ...config, necklaceStyle: s.value as NecklaceStyle }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.necklaceStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <SectionTitle title="Piercings" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylePreviewScroll}
                nestedScrollEnabled
              >
                {PIERCING_STYLES.map(s => (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.outfitStyleCard,
                      config.piercingStyle === s.value && styles.outfitStyleCardActive,
                    ]}
                    onPress={() => update({ piercingStyle: s.value as PiercingStyle })}
                  >
                    <PixelCharacter
                      config={{ ...config, piercingStyle: s.value as PiercingStyle }}
                      size={56}
                    />
                    <Text
                      style={[
                        styles.outfitStyleLabel,
                        config.piercingStyle === s.value && styles.outfitStyleLabelActive,
                      ]}
                      numberOfLines={2}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <SectionTitle title="Accessory color" />
              <ColorRow
                options={ACCESSORY_COLORS}
                selected={config.accessoryColor}
                onSelect={value => update({ accessoryColor: value })}
              />

              <SectionTitle title="Make-up color" />
              <ColorRow
                options={MAKEUP_COLORS}
                selected={config.makeupColor}
                onSelect={value => update({ makeupColor: value })}
              />
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </LinearGradient>
  );
}

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
      {options.map(opt => {
        const isSel = selected.toUpperCase() === opt.value.toUpperCase();
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.colorSwatch,
              { backgroundColor: opt.value },
              isSel && styles.colorSwatchSelected,
              !isSel && styles.colorSwatchIdle,
            ]}
            accessibilityLabel={opt.label}
          >
            {isSel && <Ionicons name="checkmark" size={14} color="#fff" />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

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

  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.sm,
  },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    minHeight: 146,
    justifyContent: 'center',
  },
  genderCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  genderPreview: {
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  genderLabel: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  genderLabelActive: {
    color: COLORS.primary,
  },

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
  colorSwatchIdle: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorSwatchSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.12 }],
  },

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
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    minWidth: 72,
    maxWidth: 100,
    gap: 4,
  },
  styleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  styleLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  styleLabelActive: {
    color: COLORS.primary,
  },

  stylePreviewScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    paddingBottom: SPACING.sm,
  },
  outfitStyleCard: {
    width: 96,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  outfitStyleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  outfitStyleLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  outfitStyleLabelActive: {
    color: COLORS.primary,
  },
});
