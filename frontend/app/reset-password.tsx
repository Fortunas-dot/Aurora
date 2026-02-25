import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { authService } from '../src/services/auth.service';
import { posthogService, POSTHOG_EVENTS, POSTHOG_PROPERTIES } from '../src/services/posthog.service';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (params?.token && typeof params.token === 'string') {
      setToken(params.token);
    } else {
      setToken(null);
    }
  }, [params]);

  const handleSubmit = async () => {
    setValidationError('');
    setApiError('');

    if (!token) {
      setValidationError('No valid reset token found. Please request a new reset link.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setValidationError('Please fill in both password fields');
      return;
    }

    if (newPassword.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, newPassword);

      if (response.success) {
        setSuccess(true);
        posthogService.trackEvent(POSTHOG_EVENTS.PASSWORD_RESET_COMPLETED, {
          [POSTHOG_PROPERTIES.TIMESTAMP]: new Date().toISOString(),
        });
      } else {
        setApiError(response.message || 'Invalid or expired reset link. Please request a new one.');
      }
    } catch (error: any) {
      setApiError(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showTokenError = token === null;

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Choose a new password</Text>
            <Text style={styles.subtitle}>
              Your new password should be something only you know, and different from passwords you use elsewhere.
            </Text>
          </View>

          <GlassCard style={styles.card} padding="lg" gradient>
            {showTokenError ? (
              <View>
                <Text style={styles.errorTitle}>Reset link invalid</Text>
                <Text style={styles.subtitle}>
                  This reset link is missing or invalid. Please go back to Aurora and request a new password reset email.
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
            ) : success ? (
              <View>
                <Text style={styles.successTitle}>Password updated</Text>
                <Text style={styles.successText}>
                  Your password has been reset. You can now log in with your new password.
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
            ) : (
              <View>
                <GlassInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  label="New password"
                  secureTextEntry
                  icon="lock-closed-outline"
                  textContentType="newPassword"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <GlassInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  label="Confirm new password"
                  secureTextEntry
                  icon="lock-closed-outline"
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {(validationError || apiError) && (
                  <Text style={styles.errorText}>{validationError || apiError}</Text>
                )}

                <GlassButton
                  title="Update password"
                  onPress={handleSubmit}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  style={styles.primaryButton}
                />

                <GlassButton
                  title="Back to login"
                  onPress={() => router.replace('/(auth)/login')}
                  variant="ghost"
                  size="md"
                  fullWidth
                />
              </View>
            )}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
});

