import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface SafetyDisclaimerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ 
  onDismiss, 
  showDismiss = false 
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Important Safety Information
          </Text>
          {showDismiss && onDismiss && (
            <Pressable onPress={onDismiss} style={styles.dismissButton}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Aurora is an AI companion designed to provide supportive mental health guidance. 
          Aurora is not a replacement for professional therapy, medical advice, or emergency services.
        </Text>
        <View style={styles.bulletPoints}>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              For medical emergencies, call your local emergency number (911, 112, etc.)
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              For medication questions, consult your doctor or psychiatrist
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              Aurora cannot diagnose conditions or provide medical treatment
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  content: {
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  dismissButton: {
    padding: SPACING.xs,
  },
  text: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 18,
  },
  bulletPoints: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  bulletPoint: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  bullet: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 18,
  },
  bulletText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
