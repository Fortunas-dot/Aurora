import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput, LoadingOverlay } from '../../src/components/common';
import { AuthLanguagePicker } from '../../src/components/auth/AuthLanguagePicker';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { AuroraCore } from '../../src/components/voice/AuroraCore';
import { useTranslation } from '../../src/hooks/useTranslation';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { login, authSubmitting, error, clearError, isAuthenticated, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

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

  const displayError = validationError || error;

  if (isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <AuthLanguagePicker />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.xxl, paddingBottom: insets.bottom + SPACING.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <AuroraCore state="idle" audioLevel={0} size={180} />
            </View>
            <Text style={styles.title}>{t('login_welcome_back')}</Text>
            <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
          </View>

          <GlassCard style={styles.formCard} padding="lg" gradient>
            <GlassInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('email_label')}
              label={t('email_label')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail-outline"
              textContentType="username"
              autoComplete="username"
              returnKeyType="next"
            />

            <GlassInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('password_label')}
              label={t('password_label')}
              secureTextEntry
              icon="lock-closed-outline"
              textContentType="password"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            {displayError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            <GlassButton
              title={t('log_in')}
              onPress={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={authSubmitting}
              style={styles.loginButton}
            />

            <Pressable
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>{t('forgot_password')}</Text>
            </Pressable>
          </GlassCard>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>{t('no_account')}</Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>{t('register_link')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={authSubmitting} message={t('logging_in')} />
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
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: SPACING.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorGlass,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  registerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  registerLink: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
});
