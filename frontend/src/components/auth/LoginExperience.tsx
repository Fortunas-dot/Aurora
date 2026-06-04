import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingOverlay } from '../common';
import { AuthLanguagePicker } from './AuthLanguagePicker';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import type { LoginScreenVariant } from '../../constants/loginScreenVariant';
import { LoginShellRenderer } from './loginShells/LoginShellRenderer';

export type LoginExperienceProps = {
  variant: LoginScreenVariant;
  /** When true, hides the floating language control (cleaner style previews). */
  showLanguagePicker?: boolean;
  /**
   * Style preview from Settings while still logged in — do not redirect away or hide the form.
   */
  previewMode?: boolean;
};

export function LoginExperience({
  variant,
  showLanguagePicker = true,
  previewMode = false,
}: LoginExperienceProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { login, authSubmitting, error, clearError, isAuthenticated, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (previewMode) return;
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [previewMode, isAuthenticated, isLoading, router]);

  const handleLogin = async () => {
    setValidationError('');
    clearError();

    if (!email.trim()) {
      setValidationError(t('email_required'));
      return;
    }
    if (!password) {
      setValidationError(t('password_required'));
      return;
    }

    const success = await login(email.trim(), password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const displayError = validationError || (error ?? '') || '';

  if (!previewMode && isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {showLanguagePicker ? <AuthLanguagePicker /> : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.keyboardView,
          (variant === 'cipher_frame' || variant === 'coral_wave') && {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ScrollView
          style={
            variant === 'cipher_frame' || variant === 'coral_wave'
              ? { flex: 1, backgroundColor: colors.background }
              : { flex: 1 }
          }
          contentContainerStyle={[
            styles.scrollContent,
            variant === 'cipher_frame' || variant === 'coral_wave'
              ? {
                  paddingHorizontal: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  justifyContent: 'flex-start',
                }
              : {
                  paddingTop: insets.top + SPACING.md,
                  paddingBottom: insets.bottom + SPACING.xl,
                },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LoginShellRenderer
            variant={variant}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
            displayError={displayError}
            authSubmitting={authSubmitting}
            onSubmit={handleLogin}
            t={t}
            router={router}
          />

          {variant !== 'summit_line' && variant !== 'cipher_frame' && variant !== 'coral_wave' ? (
            <View style={styles.registerRow}>
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>{t('no_account')}</Text>
              <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>{t('register_link')}</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={authSubmitting} message={t('logging_in')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  registerText: {
    ...TYPOGRAPHY.body,
  },
  registerLink: {
    ...TYPOGRAPHY.bodyMedium,
  },
});
