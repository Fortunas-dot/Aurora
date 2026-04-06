import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useSettingsStore } from '../../store/settingsStore';
import { useTranslation } from '../../hooks/useTranslation';
import { APP_LANGUAGES } from '../../utils/i18n';
import { LanguagePickerSheet } from '../common/LanguagePickerSheet';

/**
 * Globe + bottom-sheet language picker for auth screens (login, register).
 */
export function AuthLanguagePicker() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const [visible, setVisible] = useState(false);

  const currentLangMeta = APP_LANGUAGES.find((l) => l.code === language) ?? APP_LANGUAGES[0];

  const close = useCallback(() => setVisible(false), []);

  return (
    <>
      <View
        style={[styles.languageBar, { top: insets.top + SPACING.sm, right: SPACING.lg }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setVisible(true);
          }}
          style={({ pressed }) => [styles.languageTrigger, pressed && styles.languageTriggerPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility_language', { label: currentLangMeta.label })}
          hitSlop={12}
        >
          <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
          <Text style={styles.languageTriggerLabel} numberOfLines={1}>
            {currentLangMeta.nativeLabel}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <LanguagePickerSheet visible={visible} onClose={close} />
    </>
  );
}

const styles = StyleSheet.create({
  languageBar: {
    position: 'absolute',
    zIndex: 20,
    maxWidth: '55%',
  },
  languageTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    ...SHADOWS.sm,
  },
  languageTriggerPressed: {
    opacity: 0.88,
  },
  languageTriggerLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    maxWidth: 120,
  },
});
