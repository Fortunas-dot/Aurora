import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { posthogService, POSTHOG_EVENTS, POSTHOG_PROPERTIES } from '../src/services/posthog.service';

export default function EmailVerifiedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    if (user?._id) {
      updateUser({ emailVerified: true });
      posthogService.trackEvent(POSTHOG_EVENTS.USER_EMAIL_VERIFIED, {
        [POSTHOG_PROPERTIES.USER_ID]: user._id,
        [POSTHOG_PROPERTIES.TIMESTAMP]: new Date().toISOString(),
      });
    }
  }, [user, updateUser]);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Email verified</Text>
          <Text style={styles.subtitle}>
            Thank you for confirming your email address. This helps us keep your Aurora account secure.
          </Text>
        </View>

        <GlassCard style={styles.card} padding="lg" gradient>
          <Text style={styles.bodyText}>
            You can now continue using Aurora. If you ever change your email address, we’ll ask you to verify it again.
          </Text>

          <GlassButton
            title="Continue"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.primaryButton}
          />
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
  },
  bodyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    marginTop: SPACING.md,
  },
});

