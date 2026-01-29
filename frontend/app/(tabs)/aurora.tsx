import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../../src/components/common';
import { AuroraCore } from '../../src/components/voice/AuroraCore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export default function AuroraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.headerTitle}>Aurora AI</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Aurora Visualization */}
        <View style={styles.auroraContainer}>
          <AuroraCore state="idle" audioLevel={0} />
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Hoe kan ik je helpen?</Text>
          
          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/voice')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="mic" size={28} color={COLORS.primary} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Voice Therapy</Text>
                <Text style={styles.optionDescription}>
                  Praat met Aurora via spraak in een veilige omgeving
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/text-chat')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(94, 234, 212, 0.3)', 'rgba(52, 211, 153, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.accent} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Text Chat</Text>
                <Text style={styles.optionDescription}>
                  Chat met Aurora via tekst op je eigen tempo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/journal')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(251, 191, 36, 0.3)', 'rgba(245, 158, 11, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="journal" size={28} color={COLORS.warning} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Dagboek</Text>
                <Text style={styles.optionDescription}>
                  Schrijf je gedachten op met AI-begeleiding
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  auroraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  optionsContainer: {
    paddingHorizontal: SPACING.md,
  },
  optionsTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  optionCard: {
    marginBottom: SPACING.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  optionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: 2,
  },
  optionDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
});

