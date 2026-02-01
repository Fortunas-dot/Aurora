import { useEffect, useState } from 'react';
import { i18n } from '../utils/i18n';
import { useSettingsStore } from '../store/settingsStore';

export const useTranslation = () => {
  const { language } = useSettingsStore();
  const [t, setT] = useState(() => i18n.getTranslations());

  useEffect(() => {
    setT(i18n.getTranslations());
  }, [language]);

  return {
    t: (key: keyof typeof t) => t[key] || key,
    language,
  };
};

