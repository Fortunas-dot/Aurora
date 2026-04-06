import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { authService } from '../src/services/auth.service';
import { posthogService, POSTHOG_EVENTS, POSTHOG_PROPERTIES } from '../src/services/posthog.service';
import { useTranslation } from '../src/hooks/useTranslation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setValidationError('');
    setApiError('');

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setValidationError(t('email_required'));
      return;
    }

    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setValidationError(t('invalid_email'));
      return;
    }

    setLoading(true);

    try {
      const response = await authService.requestPasswordReset(trimmed);

      if (response.success) {
        setSuccess(true);
        posthogService.trackEvent(POSTHOG_EVENTS.PASSWORD_RESET_REQUESTED, {
          [POSTHOG_PROPERTIES.TIMESTAMP]: new Date().toISOString(),
        });
      } else {
        setApiError(response.message || 'Something went wrong. Please try again.');
      }
    } catch (error: any) {
      setApiError(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>{t('forgot_title')}</Text>
            <Text style={styles.subtitle}>
              {t('forgot_subtitle')}
            </Text>
          </View>

          <GlassCard style={styles.card} padding="lg" gradient>
            {success ? (
              <View>
                <Text style={styles.successTitle}>Email sent</Text>
                <Text style={styles.successText}>
                  If an Aurora account exists with {email.trim()}, we’ve sent a password reset link.
                  Please also check your spam or junk folder.
                </Text>

                <GlassButton
                  title="Back to login"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.primaryButton}
                />
              </View>
            ) : (
              <View>
                <GlassInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  label={t('email_label')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon="mail-outline"
                  textContentType="emailAddress"
                  autoComplete="email"
                />

                {(validationError || apiError) && (
                  <Text style={styles.errorText}>{validationError || apiError}</Text>
                )}

                <GlassButton
                  title={t('send_reset_link')}
                  onPress={handleSubmit}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  style={styles.primaryButton}
                />

                <GlassButton
                  title={t('back_to_login')}
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
});

