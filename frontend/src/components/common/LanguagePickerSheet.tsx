import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { useSettingsStore } from '../../store/settingsStore';
import { useTranslation } from '../../hooks/useTranslation';
import { APP_LANGUAGES, type Language } from '../../utils/i18n';

export const LANGUAGE_SHEET_ROWS: Record<
  Language,
  { flag: string; englishName: string }
> = {
  en: { flag: '🇬🇧', englishName: 'English' },
  ar: { flag: '🇸🇦', englishName: 'Arabic' },
  es: { flag: '🇪🇸', englishName: 'Spanish' },
  ja: { flag: '🇯🇵', englishName: 'Japanese' },
};

type LanguagePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Bottom sheet to pick app language (shared by auth bar and Settings).
 */
export function LanguagePickerSheet({ visible, onClose }: LanguagePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, setLanguage } = useSettingsStore();

  const selectLanguage = useCallback(
    async (code: Language) => {
      await setLanguage(code);
      onClose();
    },
    [setLanguage, onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.modalSheet,
            { paddingBottom: Math.max(insets.bottom, SPACING.lg) },
          ]}
        >
          <View style={styles.modalGrabber} />
          <Text style={styles.modalTitle}>{t('language_sheet_title')}</Text>
          <Text style={styles.modalSubtitle}>{t('language_sheet_subtitle')}</Text>

          {APP_LANGUAGES.map((lang, index) => {
            const selected = language === lang.code;
            const row = LANGUAGE_SHEET_ROWS[lang.code];
            const isLast = index === APP_LANGUAGES.length - 1;
            return (
              <Pressable
                key={lang.code}
                onPress={() => selectLanguage(lang.code)}
                style={({ pressed }) => [
                  styles.langRow,
                  !isLast && styles.langRowBorder,
                  selected && styles.langRowSelected,
                  pressed && styles.langRowPressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t('accessibility_language', { label: lang.label })}
              >
                <Text style={styles.langRowFlag} accessibilityElementsHidden>
                  {row.flag}
                </Text>
                <View style={styles.langRowTextWrap}>
                  <Text style={styles.langRowNative}>{lang.nativeLabel}</Text>
                  <Text style={styles.langRowEnglish}>{row.englishName}</Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                ) : (
                  <View style={styles.langRowRadioPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.glass.border,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  langRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  langRowSelected: {
    backgroundColor: `${COLORS.primary}18`,
  },
  langRowPressed: {
    opacity: 0.92,
  },
  langRowFlag: {
    fontSize: 28,
    marginRight: SPACING.md,
    lineHeight: 34,
  },
  langRowTextWrap: {
    flex: 1,
  },
  langRowNative: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
  },
  langRowEnglish: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  langRowRadioPlaceholder: {
    width: 24,
    height: 24,
  },
});
