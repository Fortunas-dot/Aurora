import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GlassCard } from '../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface AiConsentCardProps {
  onAccept: () => void;
  onDecline?: () => void;
  onLearnMore?: () => void;
  compact?: boolean;
}

/**
 * Card that explains AI data usage and asks for consent before sending
 * personal data (journal entries, chat messages, voice transcripts) to
 * Aurora's backend and OpenAI.
 * 
 * Required by Apple App Store Guidelines 5.1.1(i) and 5.1.2(i):
 * - Disclose what data will be sent
 * - Specify who the data is sent to
 * - Obtain the user's permission before sending data
 */
export const AiConsentCard: React.FC<AiConsentCardProps> = ({
  onAccept,
  onDecline,
  onLearnMore,
  compact = false,
}) => {
  const router = useRouter();

  const openOpenAIPrivacy = () => {
    Linking.openURL('https://openai.com/privacy');
  };

  const openPrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  return (
    <View style={[styles.cardContainer, compact && styles.cardContainerCompact]}>
      <LinearGradient
        colors={['rgba(15, 15, 25, 1)', 'rgba(20, 20, 30, 1)']}
        style={styles.backgroundGradient}
      />
      <GlassCard style={styles.card} padding="md" variant="dark">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>AI Data Sharing</Text>
          {onLearnMore && (
            <Pressable onPress={onLearnMore} style={styles.learnMoreButton}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.learnMoreText}>Learn More</Text>
            </Pressable>
          )}
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <Text style={styles.importantText}>
            To use AI features, your data will be shared with OpenAI:
          </Text>

          <View style={styles.dataList}>
            <Text style={styles.dataItem}>• Chat messages & journal entries</Text>
            <Text style={styles.dataItem}>• Voice recordings (for voice therapy)</Text>
            <Text style={styles.dataItem}>• Health info from your profile</Text>
          </View>

          <View style={styles.recipientBox}>
            <View style={styles.recipientHeader}>
              <Text style={styles.recipientName}>Sent to: OpenAI</Text>
            </View>
            <Text style={styles.recipientDesc}>
              OpenAI generates AI responses. They do not use your data to train AI models.
            </Text>
            <Pressable onPress={openOpenAIPrivacy}>
              <Text style={styles.linkText}>OpenAI Privacy Policy →</Text>
            </Pressable>
          </View>

          <Text style={styles.protectionText}>
            ✓ Encrypted  ✓ Not used for ads  ✓ Not sold  ✓ Revocable in Settings
          </Text>

          <Pressable onPress={openPrivacyPolicy}>
            <Text style={styles.linkText}>Full Privacy Policy →</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.buttons}>
          {onDecline && (
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={onDecline}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Don't Allow
              </Text>
            </Pressable>
          )}
          <Pressable style={[styles.button, styles.primaryButton]} onPress={onAccept}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Allow
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxHeight: 400,
    marginBottom: SPACING.md,
    position: 'relative',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  cardContainerCompact: {
    maxHeight: 350,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(15, 15, 25, 1)',
    borderColor: COLORS.glass.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.glass.backgroundLight,
  },
  learnMoreText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  scrollContent: {
    maxHeight: 250,
  },
  importantText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  dataList: {
    marginBottom: SPACING.sm,
  },
  dataItem: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  recipientBox: {
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  recipientName: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '600',
  },
  recipientDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: SPACING.xs,
  },
  linkText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  protectionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.textInverse,
  },
  secondaryButton: {
    backgroundColor: COLORS.glass.background,
    borderColor: COLORS.glass.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
  },
  buttonText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
});

