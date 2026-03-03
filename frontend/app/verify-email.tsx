import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { authService } from '../src/services/auth.service';
import { useAuthStore } from '../src/store/authStore';
import { posthogService, POSTHOG_EVENTS, POSTHOG_PROPERTIES } from '../src/services/posthog.service';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const updateUser = useAuthStore((state) => state.updateUser);
  const userId = useAuthStore((state) => state.user?._id);

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading');
  const [message, setMessage] = useState<string>('');

  const token = typeof params?.token === 'string' ? params.token : undefined;

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      setMessage('No verification token found. Please open the link again from your email or request a new one.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);

        if (response.success) {
          setStatus('success');
          setMessage('Your email has been verified. Thank you for confirming your account.');

          if (userId) {
            updateUser({ emailVerified: true });
            posthogService.trackEvent(POSTHOG_EVENTS.USER_EMAIL_VERIFIED, {
              [POSTHOG_PROPERTIES.USER_ID]: userId,
              [POSTHOG_PROPERTIES.TIMESTAMP]: new Date().toISOString(),
            });
          }
        } else {
          setStatus('error');
          setMessage(response.message || 'Invalid or expired verification link.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.message || 'Something went wrong while verifying your email.');
      }
    };

    verify();
  }, [token, userId, updateUser]);

  const title =
    status === 'success'
      ? 'Email verified'
      : status === 'missing'
      ? 'Verification link not found'
      : status === 'error'
      ? 'Verification failed'
      : 'Verifying email...';

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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{message || 'Please wait while we confirm your email...'}</Text>
        </View>

        <GlassCard style={styles.card} padding="lg" gradient>
          {status === 'loading' && (
            <Text style={styles.bodyText}>We’re verifying your email address. This should only take a moment.</Text>
          )}

          {status === 'success' && (
            <View>
              <Text style={styles.bodyText}>
                Your email is verified. This helps us keep your account secure and makes sure we can reach you when
                needed.
              </Text>
              <GlassButton
                title="Continue to Aurora"
                onPress={() => router.replace('/(tabs)')}
                variant="primary"
                size="lg"
                fullWidth
                style={styles.primaryButton}
              />
            </View>
          )}

          {(status === 'error' || status === 'missing') && (
            <View>
              <Text style={styles.bodyText}>
                Your verification link seems to be invalid or expired. You can request a new verification email from the
                app.
              </Text>
              <GlassButton
                title="Back to login"
                onPress={() => router.replace('/(auth)/login')}
                variant="primary"
                size="lg"
                fullWidth
                style={styles.primaryButton}
              />
            </View>
          )}
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

