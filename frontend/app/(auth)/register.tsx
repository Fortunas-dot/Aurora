import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput, LoadingOverlay } from '../../src/components/common';
import { AuthLanguagePicker } from '../../src/components/auth/AuthLanguagePicker';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { apiService } from '../../src/services/api.service';
import { useTranslation } from '../../src/hooks/useTranslation';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { register, authSubmitting, registerError, clearError } = useAuthStore();
  const { startOnboarding } = useOnboardingStore();
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const validateUsernameLocally = (value: string): string | null => {
    if (!value.trim()) {
      return t('username_required');
    }
    if (value.length < 3) {
      return t('username_min_length');
    }
    if (value.length > 30) {
      return t('username_max_length');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return t('username_invalid_chars');
    }
    return null;
  };

  const checkUsernameAvailability = async (): Promise<boolean> => {
    const value = username.trim();
    const localError = validateUsernameLocally(value);
    if (localError) {
      setUsernameError(localError);
      setUsernameStatus('');
      return false;
    }

    setIsCheckingUsername(true);
    try {
      const response = await apiService.get<{ available: boolean }>('/auth/check-username?username=' + encodeURIComponent(value));

      if (!response.success) {
        // On API error, don't hard-block registration, just show message
        if (response.message) {
          setUsernameError(response.message);
          setUsernameStatus('');
        }
        return true;
      }

      const available = (response.data as any)?.available;
      if (available === false) {
        setUsernameError(t('username_taken'));
        setUsernameStatus('');
        return false;
      }

      setUsernameError('');
      setUsernameStatus(t('username_available'));
      return true;
    } catch (e: any) {
      // Network error – allow user to try to register anyway, but show a gentle info message
      setUsernameStatus(t('username_check_failed'));
      return true;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleRegister = async () => {
    setValidationError('');
    setEmailError('');
    setUsernameError('');
    setUsernameStatus('');
    clearError();

    // Validation
    if (!email.trim()) {
      setEmailError(t('email_required'));
      return;
    }
    const usernameValidation = validateUsernameLocally(username);
    if (usernameValidation) {
      setValidationError(usernameValidation);
      setUsernameError(usernameValidation);
      return;
    }
    if (!password) {
      setValidationError(t('password_required'));
      return;
    }
    if (password.length < 6) {
      setValidationError(t('password_min_length'));
      return;
    }
    if (password !== confirmPassword) {
      setValidationError(t('passwords_no_match'));
      return;
    }
    if (!acceptedTerms) {
      setValidationError(t('terms_required'));
      return;
    }

    // Final username availability check before submit
    const usernameOk = await checkUsernameAvailability();
    if (!usernameOk) {
      // Error is shown inline via usernameError
      return;
    }

    const success = await register(
      email.trim(),
      password,
      username.trim()
    );
    
    if (success) {
      // After successful registration, start onboarding and show the onboarding experience
      startOnboarding();
      router.replace('/onboarding');
    }
  };

  // Clear any leftover global auth errors when this screen mounts
  useEffect(() => {
    clearError();
    setValidationError('');
    setEmailError('');
  }, [clearError]);

  const displayError = validationError || registerError;

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
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
          {/* Back Button */}
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Ionicons name="person-add" size={36} color={COLORS.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>{t('register_title')}</Text>
            <Text style={styles.subtitle}>{t('register_subtitle')}</Text>
          </View>

          {/* Register Form */}
          <GlassCard style={styles.formCard} padding="lg" gradient>
            <GlassInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) {
                  setEmailError('');
                }
              }}
              placeholder={t('email_label')}
              label={t('email_label')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail-outline"
              textContentType="emailAddress"
              autoComplete="email"
              error={emailError}
            />

            <GlassInput
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (usernameError) {
                  setUsernameError('');
                }
                if (usernameStatus) {
                  setUsernameStatus('');
                }
              }}
              placeholder={t('username_label')}
              label={t('username_label')}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              icon="person-outline"
              textContentType="username"
              autoComplete="username"
              style={styles.usernameInput}
              error={usernameError}
              hideErrorText
              onBlur={checkUsernameAvailability}
            />
            {!!usernameError && (
              <View style={[styles.usernamePillBase, styles.usernamePillError]}>
                <Text style={styles.usernamePillErrorText}>{usernameError}</Text>
              </View>
            )}
            {!!usernameStatus && !usernameError && (
              <View style={[styles.usernamePillBase, styles.usernamePillSuccess]}>
                <Text style={styles.usernamePillSuccessText}>{usernameStatus}</Text>
              </View>
            )}

            <GlassInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('password_label')}
              label={t('password_label')}
              secureTextEntry
              icon="lock-closed-outline"
              textContentType="newPassword"
              autoComplete="password"
            />

            <GlassInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('confirm_password_label')}
              label={t('confirm_password_label')}
              secureTextEntry
              icon="lock-closed-outline"
              textContentType="newPassword"
              autoComplete="password"
            />

            {displayError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Terms Agreement */}
            <Pressable
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={16} color={COLORS.text} />}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  {t('terms_agree_prefix')}
                  <Text
                    style={styles.termsLink}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push('/terms-of-service');
                    }}
                  >
                    {t('terms_of_service_link')}
                  </Text>
                  {t('terms_agree_suffix')}
                </Text>
              </View>
            </Pressable>

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.privacyText}>
                {t('privacy_note_register')}
              </Text>
            </View>

            <GlassButton
              title={t('register_button')}
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              loading={authSubmitting}
              style={styles.registerButton}
            />
          </GlassCard>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('already_have_account')}</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.loginLink}>{t('log_in_link')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={authSubmitting} message={t('creating_account')} />
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
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
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successGlass,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  privacyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  registerButton: {
    marginTop: SPACING.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
    marginRight: SPACING.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.glass.background,
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  usernameInput: {
    marginBottom: 0,
  },
  usernamePillBase: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginTop: -8,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  usernamePillError: {
    backgroundColor: COLORS.errorGlass,
  },
  usernamePillErrorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  usernamePillSuccess: {
    backgroundColor: COLORS.successGlass,
  },
  usernamePillSuccessText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
  },
});

