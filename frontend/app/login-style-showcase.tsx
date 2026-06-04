import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton } from '../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useTranslation } from '../src/hooks/useTranslation';
import { useSettingsStore } from '../src/store/settingsStore';
import {
  LOGIN_SCREEN_VARIANTS,
  LOGIN_VARIANT_DESC_KEY,
  LOGIN_VARIANT_TITLE_KEY,
} from '../src/constants/loginScreenVariant';

export default function LoginStyleShowcaseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const activeVariant = useSettingsStore((s) => s.loginScreenVariant);

  return (
    <LinearGradient colors={colors.backgroundGradient} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings_login_styles')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{t('settings_login_styles_sub')}</Text>

        {LOGIN_SCREEN_VARIANTS.map((variant) => {
          const isCurrent = variant === activeVariant;
          return (
            <GlassCard key={variant} style={styles.card} padding="lg" gradient>
              <View style={styles.cardTop}>
                <View style={styles.cardTitles}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t(LOGIN_VARIANT_TITLE_KEY[variant])}</Text>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{t(LOGIN_VARIANT_DESC_KEY[variant])}</Text>
                </View>
                {isCurrent ? (
                  <View style={[styles.badge, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{t('login_style_current_badge')}</Text>
                  </View>
                ) : null}
              </View>
              <GlassButton
                title={t('login_style_preview_cta')}
                onPress={() =>
                  router.push({
                    pathname: '/login-style-preview',
                    params: { variant },
                  })
                }
                variant="primary"
                size="md"
                style={styles.previewBtn}
              />
            </GlassCard>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  intro: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
  card: {
    marginBottom: SPACING.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitles: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    ...TYPOGRAPHY.small,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  badgeText: {
    ...TYPOGRAPHY.captionMedium,
  },
  previewBtn: {
    alignSelf: 'stretch',
  },
});
