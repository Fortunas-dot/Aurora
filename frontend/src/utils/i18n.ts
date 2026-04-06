import { secureStorage } from './secureStorage';
import { translate, type TranslationKey } from '../locales/translate';
import { EN } from '../locales/en';

export type Language = 'en' | 'ar' | 'es' | 'ja';

export const APP_LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
];

class I18n {
  private currentLanguage: Language = 'en';

  async init(): Promise<void> {
    const savedLanguage = await secureStorage.getItemAsync('app_language');
    const valid = APP_LANGUAGES.map((l) => l.code);
    if (savedLanguage && valid.includes(savedLanguage as Language)) {
      this.currentLanguage = savedLanguage as Language;
    } else {
      this.currentLanguage = 'en';
    }
  }

  async setLanguage(language: Language): Promise<void> {
    this.currentLanguage = language;
    await secureStorage.setItemAsync('app_language', language);
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: TranslationKey, vars?: Record<string, string | number>): string {
    return translate(this.currentLanguage, key, vars);
  }

  /** Flat map of all strings for the active language (legacy / settings screens using object access). */
  getTranslations(): Record<TranslationKey, string> & Record<string, string> {
    const keys = Object.keys(EN) as TranslationKey[];
    const out = {} as Record<string, string>;
    for (const k of keys) {
      out[k] = translate(this.currentLanguage, k);
    }
    return out as Record<TranslationKey, string> & Record<string, string>;
  }
}

export const i18n = new I18n();

i18n.init().catch(console.error);
