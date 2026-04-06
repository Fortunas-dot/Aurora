import { useCallback } from 'react';
import { translate, type TranslationKey } from '../locales/translate';
import { useSettingsStore } from '../store/settingsStore';

export const useTranslation = () => {
  const language = useSettingsStore((s) => s.language);
  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );
  return { t, language };
};
