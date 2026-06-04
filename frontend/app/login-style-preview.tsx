import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '../src/components/common';
import { LoginExperience } from '../src/components/auth/LoginExperience';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useTranslation } from '../src/hooks/useTranslation';
import { useSettingsStore } from '../src/store/settingsStore';
import {
  DEFAULT_LOGIN_SCREEN_VARIANT,
  isLoginScreenVariant,
  LOGIN_VARIANT_TITLE_KEY,
  type LoginScreenVariant,
} from '../src/constants/loginScreenVariant';

export default function LoginStylePreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { variant: variantParam } = useLocalSearchParams<{ variant?: string }>();
  const setLoginScreenVariant = useSettingsStore((s) => s.setLoginScreenVariant);

  const variant: LoginScreenVariant = isLoginScreenVariant(variantParam)
    ? variantParam
    : DEFAULT_LOGIN_SCREEN_VARIANT;

  const onApply = useCallback(async () => {
    await setLoginScreenVariant(variant);
    Alert.alert(t('login_style_applied_title'), t('login_style_applied_body'), [
      { text: t('ok'), onPress: () => router.back() },
    ]);
  }, [router, setLoginScreenVariant, t, variant]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderBottomColor: colors.glass.border,
            backgroundColor: colors.glass.backgroundDark,
          },
        ]}
      >
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[styles.previewLabel, { color: colors.textMuted }]}>{t('login_style_preview_label')}</Text>
          <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
            {t(LOGIN_VARIANT_TITLE_KEY[variant])}
          </Text>
        </View>
        <GlassButton title={t('login_style_use')} onPress={onApply} variant="primary" size="sm" style={styles.useBtn} />
      </View>

      <LoginExperience variant={variant} showLanguagePicker={false} previewMode />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    zIndex: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    minWidth: 0,
  },
  previewLabel: {
    ...TYPOGRAPHY.caption,
    letterSpacing: 0.4,
  },
  previewName: {
    ...TYPOGRAPHY.bodyMedium,
  },
  useBtn: {
    paddingHorizontal: SPACING.md,
  },
});
