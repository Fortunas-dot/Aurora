import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GlassCard } from '../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface AiConsentCardProps {
  onAccept: () => void;
  onDecline?: () => void;
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
}) => {
  const router = useRouter();

  const openOpenAIPrivacy = () => {
    Linking.openURL('https://openai.com/privacy');
  };

  const openPrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['rgba(15, 15, 25, 1)', 'rgba(20, 20, 30, 1)']}
        style={styles.backgroundGradient}
      />
      <GlassCard style={styles.card} padding="lg" variant="dark">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>AI Data Sharing Consent</Text>
        </View>

      <Text style={styles.importantText}>
        Your permission is required before using AI features.
      </Text>

      <Text style={styles.sectionHeader}>What data will be shared:</Text>
      <View style={styles.list}>
        <View style={styles.listItem}>
          <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
          <Text style={styles.listText}>
            Text you type in AI chat conversations
          </Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="book" size={16} color={COLORS.primary} />
          <Text style={styles.listText}>
            Journal entries (for AI-generated prompts and insights)
          </Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="mic" size={16} color={COLORS.primary} />
          <Text style={styles.listText}>
            Voice recordings and transcripts (for voice therapy)
          </Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="heart" size={16} color={COLORS.primary} />
          <Text style={styles.listText}>
            Health information you've added to your profile (if applicable)
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Who receives this data:</Text>
      <View style={styles.recipientBox}>
        <Text style={styles.recipientName}>OpenAI</Text>
        <Text style={styles.recipientDesc}>
          Our AI technology provider. OpenAI processes your data to generate 
          supportive responses and insights. OpenAI does not use your data to 
          train their AI models.
        </Text>
        <Pressable onPress={openOpenAIPrivacy}>
          <Text style={styles.linkText}>View OpenAI's Privacy Policy →</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionHeader}>Data protection:</Text>
      <Text style={styles.text}>
        • Your data is encrypted in transit and at rest{'\n'}
        • OpenAI is contractually obligated to protect your data{'\n'}
        • Your data is NOT used for advertising{'\n'}
        • Your data is NOT sold to third parties{'\n'}
        • You can revoke consent at any time in Settings
      </Text>

      <Pressable onPress={openPrivacyPolicy}>
        <Text style={styles.linkText}>Read our full Privacy Policy →</Text>
      </Pressable>

      <Text style={styles.optionalText}>
        AI features are optional. You can use Aurora's community, journaling, 
        and other features without enabling AI.
      </Text>

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
            Allow AI Features
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
    marginBottom: SPACING.lg,
    position: 'relative',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.xl,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(15, 15, 25, 1)',
    borderColor: COLORS.glass.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  importantText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  text: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  list: {
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  listText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  recipientBox: {
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  recipientName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  recipientDesc: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  linkText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  optionalText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
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

