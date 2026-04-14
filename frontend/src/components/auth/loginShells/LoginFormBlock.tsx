import React from 'react';
import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton, GlassInput } from '../../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../constants/theme';
import type { LoginShellRenderProps } from './types';

type Props = Pick<
  LoginShellRenderProps,
  'email' | 'password' | 'setEmail' | 'setPassword' | 'displayError' | 'authSubmitting' | 'onSubmit' | 't' | 'router'
> & {
  cardStyle?: ViewStyle;
};

export function LoginFormBlock({
  email,
  password,
  setEmail,
  setPassword,
  displayError,
  authSubmitting,
  onSubmit,
  t,
  router,
  cardStyle,
}: Props) {
  return (
    <GlassCard style={StyleSheet.flatten([styles.formCard, cardStyle])} padding="lg" gradient>
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
        onSubmitEditing={onSubmit}
      />

      {displayError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      ) : null}

      <GlassButton
        title={t('log_in')}
        onPress={onSubmit}
        variant="primary"
        size="lg"
        fullWidth
        loading={authSubmitting}
        style={styles.loginButton}
      />

      <Pressable style={styles.forgotPassword} onPress={() => router.push('/forgot-password')} hitSlop={8}>
        <Text style={styles.forgotPasswordText}>{t('forgot_password')}</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  formCard: {
    marginBottom: SPACING.sm,
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
});
