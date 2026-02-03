import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput, LoadingOverlay } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { AuroraCore } from '../../src/components/voice/AuroraCore';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuthStore();
  
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
              <AuroraCore state="idle" audioLevel={0} size={120} />
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
            />

            <GlassInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              label="Password"
              secureTextEntry
              icon="lock-closed-outline"
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

          {/* Continue as Guest */}
          <GlassButton
            title="Continue as guest"
            onPress={() => router.replace('/(tabs)')}
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
  guestButton: {
    alignSelf: 'center',
  },
});

