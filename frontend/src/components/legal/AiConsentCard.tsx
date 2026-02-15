import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
 */
export const AiConsentCard: React.FC<AiConsentCardProps> = ({
  onAccept,
  onDecline,
}) => {
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
          <Text style={styles.title}>AI & Data Use</Text>
        </View>

      <Text style={styles.text}>
        Aurora can use your personal input to provide AI-powered support. This may
        include:
      </Text>

      <View style={styles.list}>
        <View style={styles.listItem}>
          <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
          <Text style={styles.listText}>
            What you type in conversations and journal entries
          </Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="mic" size={16} color={COLORS.primary} />
          <Text style={styles.listText}>
            Voice recordings and transcripts when you use voice support
          </Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="heart" size={16} color={COLORS.primary} />
          <Text style={styles.listText}>
            Optional health information you choose to share in the app
          </Text>
        </View>
      </View>

      <Text style={styles.text}>
        This data is sent to our secure servers and to our AI technology provider,
        OpenAI, only to generate supportive responses and insights. It is not used
        for advertising or sold to data brokers.
      </Text>
      <Text style={styles.text}>
        OpenAI is contractually obligated to protect your data and provides the same 
        or equal protection of personal data as we do. OpenAI does not use your data 
        to train their models and is bound by their privacy policy and our data 
        processing agreement.
      </Text>

      <Text style={styles.text}>
        You can continue to use Aurora without AI features if you prefer not to
        share this data.
      </Text>

      <View style={styles.buttons}>
        {onDecline && (
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={onDecline}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Not now
            </Text>
          </Pressable>
        )}
        <Pressable style={[styles.button, styles.primaryButton]} onPress={onAccept}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            I agree
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
    backgroundColor: 'rgba(15, 15, 25, 1)', // Fully opaque background to block Aurora symbol
    borderColor: COLORS.glass.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
  },
  text: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  list: {
    marginVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  listText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
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

