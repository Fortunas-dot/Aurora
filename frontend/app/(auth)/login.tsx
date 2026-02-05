import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput, LoadingOverlay } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { AuroraCore } from '../../src/components/voice/AuroraCore';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginWithFacebook, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleLogin = async () => {
    setValidationError('');
    clearError();

    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }
    if (!password) {
      setValidationError('Password is required');
      return;
    }

    const success = await login(email.trim(), password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleFacebookLogin = async () => {
    setValidationError('');
    clearError();
    
    const success = await loginWithFacebook();
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const displayError = validationError || error;

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
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <AuroraCore state="idle" audioLevel={0} size={180} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue with Aurora</Text>
          </View>

          {/* Login Form */}
          <GlassCard style={styles.formCard} padding="lg" gradient>
            <GlassInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              label="Email"
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
              placeholder="Password"
              label="Password"
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
              title="Log in"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              style={styles.loginButton}
            />

            <Pressable style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>
          </GlassCard>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Register</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Facebook Login Button */}
          <Pressable
            onPress={handleFacebookLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.facebookButton,
              pressed && styles.facebookButtonPressed,
              isLoading && styles.facebookButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={['#1877F2', '#166FE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.facebookGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-facebook" size={20} color="#FFFFFF" style={{ marginRight: SPACING.sm }} />
                  <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Continue as Guest */}
          <GlassButton
            title="Continue as guest"
            onPress={() => {
              // Navigate directly to tabs without checking auth
              // User will be in guest mode (not authenticated)
              router.replace('/(tabs)');
            }}
            variant="ghost"
            icon={<Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />}
            style={styles.guestButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Logging in..." />
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.glass.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
  },
  facebookButton: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  facebookGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  facebookButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  facebookButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  facebookButtonDisabled: {
    opacity: 0.5,
  },
  guestButton: {
    alignSelf: 'center',
  },
});

