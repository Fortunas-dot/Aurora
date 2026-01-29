import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/constants/theme';

export default function VoiceTherapyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Voice Therapy</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Coming Soon Content */}
      <View style={styles.content}>
        {/* Aurora Core */}
        <View style={styles.coreContainer}>
          <AuroraCore state="idle" audioLevel={0} />
        </View>

        {/* Coming Soon Badge */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Binnenkort beschikbaar</Text>
        </View>

        {/* Title */}
        <Text style={styles.titleText}>Voice Therapy</Text>

        {/* Description */}
        <Text style={styles.descriptionText}>
          We werken hard aan een geweldige voice therapy ervaring. 
          Binnenkort kun je met Aurora praten via spraak in een veilige en ondersteunende omgeving.
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Real-time spraak conversaties</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Natuurlijke gesprekken met Aurora</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Veilige en privé omgeving</Text>
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  coreContainer: {
    marginBottom: SPACING.xl,
  },
  badgeContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginBottom: SPACING.lg,
  },
  badgeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.background,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  descriptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
});
