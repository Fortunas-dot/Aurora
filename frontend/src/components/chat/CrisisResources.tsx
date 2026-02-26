import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { CrisisResources as CrisisResourcesType } from '../../store/chatStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface CrisisResourcesProps {
  resources: CrisisResourcesType;
}

export const CrisisResources: React.FC<CrisisResourcesProps> = ({ resources }) => {
  const { colors } = useTheme();

  const handleCall = (number: string) => {
    // Remove non-numeric characters except + for international numbers
    const cleanNumber = number.replace(/[^\d+]/g, '');
    if (cleanNumber.startsWith('http')) {
      Linking.openURL(cleanNumber);
    } else {
      Linking.openURL(`tel:${cleanNumber}`);
    }
  };

  const handleText = (number: string) => {
    // For text lines like "Text HOME to 741741"
    if (number.toLowerCase().includes('text')) {
      // Extract the number from the text
      const match = number.match(/\d+/);
      if (match) {
        Linking.openURL(`sms:${match[0]}`);
      }
    } else {
      const cleanNumber = number.replace(/[^\d+]/g, '');
      Linking.openURL(`sms:${cleanNumber}`);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: colors.error }]}
      >
        <View style={styles.header}>
          <Ionicons name="warning" size={24} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>
            Immediate Support Available
          </Text>
        </View>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {resources.message}
        </Text>

        <Text style={[styles.subtitle, { color: colors.text }]}>
          Reach out to these resources right now:
        </Text>

        <View style={styles.resourcesList}>
          {resources.resources.map((resource, index) => (
            <View key={index} style={[styles.resourceItem, { backgroundColor: colors.glass.background }]}>
              <View style={styles.resourceInfo}>
                <Text style={[styles.resourceName, { color: colors.text }]}>
                  {resource.name}
                </Text>
                <Text style={[styles.resourceNumber, { color: colors.textMuted }]}>
                  {resource.number}
                </Text>
                <Text style={[styles.resourceAvailable, { color: colors.textMuted }]}>
                  Available: {resource.available}
                </Text>
              </View>
              <View style={styles.resourceActions}>
                {resource.number.includes('http') ? (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleCall(resource.number)}
                  >
                    <Ionicons name="open-outline" size={18} color={colors.white} />
                  </Pressable>
                ) : resource.number.toLowerCase().includes('text') ? (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleText(resource.number)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={colors.white} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleCall(resource.number)}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.white} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            If you're in immediate danger, please call emergency services (911, 112, or your local emergency number) right away.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    flex: 1,
  },
  message: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  resourcesList: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  resourceNumber: {
    ...TYPOGRAPHY.body,
    marginBottom: 2,
  },
  resourceAvailable: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
