import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore, AuroraStyle } from '../src/store/settingsStore';
import { AuroraCore as ClassicAuroraCore } from '../src/components/voice/AuroraCore.sphere.classic';
import { AuroraCore as OrganicAuroraCore } from '../src/components/voice/AuroraCore.sphere.organic';
import { AuroraCore as BlobsAuroraCore } from '../src/components/voice/AuroraCore.blobs';

const { width } = Dimensions.get('window');
const PREVIEW_SIZE = width * 0.5;

export default function AuroraStyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { auroraStyle, setAuroraStyle } = useSettingsStore();
  
  // Animate between states for preview
  const [previewState, setPreviewState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    // Cycle through states for preview
    const interval = setInterval(() => {
      setPreviewState((prev) => {
        if (prev === 'idle') {
          setAudioLevel(0.3);
          return 'listening';
        } else if (prev === 'listening') {
          setAudioLevel(0.7);
          return 'speaking';
        } else {
          setAudioLevel(0);
          return 'idle';
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectStyle = async (style: AuroraStyle) => {
    await setAuroraStyle(style);
    router.back();
  };

  return (
    <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Aurora Style</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Choose your preferred Aurora visual style
        </Text>

        {/* Organic Style (New, More Alive) */}
        <Pressable
          onPress={() => handleSelectStyle('organic')}
          style={styles.styleOption}
        >
          <GlassCard padding={SPACING.lg} style={[styles.previewCard, auroraStyle === 'organic' && styles.selectedCard]}>
            <View style={styles.previewContainer}>
              <OrganicAuroraCore
                state={previewState}
                audioLevel={audioLevel}
                size={PREVIEW_SIZE}
              />
            </View>
            <Text style={[styles.styleTitle, { color: colors.text }]}>Organic & Alive</Text>
            <Text style={[styles.styleDescription, { color: colors.textMuted }]}>
              A living, breathing sphere with fluid movements and organic animations
            </Text>
            {auroraStyle === 'organic' && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={[styles.selectedText, { color: colors.white }]}>Selected</Text>
              </View>
            )}
          </GlassCard>
        </Pressable>

        {/* Classic Style */}
        <Pressable
          onPress={() => handleSelectStyle('classic')}
          style={styles.styleOption}
        >
          <GlassCard padding={SPACING.lg} style={[styles.previewCard, auroraStyle === 'classic' && styles.selectedCard]}>
            <View style={styles.previewContainer}>
              <ClassicAuroraCore
                state={previewState}
                audioLevel={audioLevel}
                size={PREVIEW_SIZE}
              />
            </View>
            <Text style={[styles.styleTitle, { color: colors.text }]}>Classic Sphere</Text>
            <Text style={[styles.styleDescription, { color: colors.textMuted }]}>
              The original sphere with animated glowing edges
            </Text>
            {auroraStyle === 'classic' && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={[styles.selectedText, { color: colors.white }]}>Selected</Text>
              </View>
            )}
          </GlassCard>
        </Pressable>

        {/* Blobs Style */}
        <Pressable
          onPress={() => handleSelectStyle('blobs')}
          style={styles.styleOption}
        >
          <GlassCard padding={SPACING.lg} style={[styles.previewCard, auroraStyle === 'blobs' && styles.selectedCard]}>
            <View style={styles.previewContainer}>
              <BlobsAuroraCore
                state={previewState}
                audioLevel={audioLevel}
                size={PREVIEW_SIZE}
              />
            </View>
            <Text style={[styles.styleTitle, { color: colors.text }]}>Organic Blobs</Text>
            <Text style={[styles.styleDescription, { color: colors.textMuted }]}>
              Flowing organic shapes with smooth animations
            </Text>
            {auroraStyle === 'blobs' && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={[styles.selectedText, { color: colors.white }]}>Selected</Text>
              </View>
            )}
          </GlassCard>
        </Pressable>
      </ScrollView>
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    marginLeft: SPACING.md,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  description: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  styleOption: {
    marginBottom: SPACING.lg,
  },
  previewCard: {
    alignItems: 'center',
    minHeight: 300,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  previewContainer: {
    width: PREVIEW_SIZE + 40,
    height: PREVIEW_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  styleTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  styleDescription: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  selectedText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});
