import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput, LoadingOverlay } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleRegister = async () => {
    setValidationError('');
    clearError();

    // Validation
    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }
    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setValidationError('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (!password) {
      setValidationError('Password is required');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const success = await register(
      email.trim(),
      password,
      username.trim()
    );
    
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
            { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl },
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
            <Text style={styles.title}>Account Aanmaken</Text>
            <Text style={styles.subtitle}>Word lid van de Aurora community</Text>
          </View>

          {/* Register Form */}
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
              value={username}
              onChangeText={setUsername}
              placeholder="Gebruikersnaam"
              label="Gebruikersnaam"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              icon="person-outline"
            />

            <GlassInput
              value={password}
              onChangeText={setPassword}
              placeholder="Wachtwoord"
              label="Wachtwoord"
              secureTextEntry
              icon="lock-closed-outline"
            />

            <GlassInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Bevestig wachtwoord"
              label="Bevestig wachtwoord"
              secureTextEntry
              icon="lock-closed-outline"
            />

            {displayError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.privacyText}>
                Je privacy is belangrijk. Je kunt altijd anoniem blijven.
              </Text>
            </View>

            <GlassButton
              title="Registreren"
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              style={styles.registerButton}
            />
          </GlassCard>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Heb je al een account? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.loginLink}>Inloggen</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Account aanmaken..." />
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
});

