import * as SecureStore from 'expo-secure-store';

export type Language = 'nl' | 'en';

const translations = {
  nl: {
    // Settings
    settings: 'Instellingen',
    appSettings: 'App Instellingen',
    privacySettings: 'Privacy Instellingen',
    notificationSettings: 'Notificatie Instellingen',
    language: 'Taal',
    theme: 'Thema',
    dark: 'Donker',
    light: 'Licht',
    system: 'Systeem',
    
    // Privacy
    showEmail: 'E-mailadres tonen',
    showEmailDesc: 'Laat anderen je e-mailadres zien op je profiel',
    isAnonymous: 'Anoniem profiel',
    isAnonymousDesc: 'Verberg je identiteit in posts en comments',
    
    // Notifications
    pushNotifications: 'Push notificaties',
    pushNotificationsDesc: 'Ontvang notificaties op je apparaat',
    emailNotifications: 'E-mail notificaties',
    emailNotificationsDesc: 'Ontvang notificaties via e-mail',
    likes: 'Likes',
    comments: 'Reacties',
    messages: 'Berichten',
    follows: 'Volgers',
    groups: 'Groepen',
    
    // Common
    save: 'Opslaan',
    cancel: 'Annuleren',
    back: 'Terug',
    loading: 'Laden...',
    error: 'Fout',
    success: 'Succes',
    enabled: 'Ingeschakeld',
    disabled: 'Uitgeschakeld',
    on: 'Aan',
    off: 'Uit',
  },
  en: {
    // Settings
    settings: 'Settings',
    appSettings: 'App Settings',
    privacySettings: 'Privacy Settings',
    notificationSettings: 'Notification Settings',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    
    // Privacy
    showEmail: 'Show Email',
    showEmailDesc: 'Let others see your email address on your profile',
    isAnonymous: 'Anonymous Profile',
    isAnonymousDesc: 'Hide your identity in posts and comments',
    
    // Notifications
    pushNotifications: 'Push Notifications',
    pushNotificationsDesc: 'Receive notifications on your device',
    emailNotifications: 'Email Notifications',
    emailNotificationsDesc: 'Receive notifications via email',
    likes: 'Likes',
    comments: 'Comments',
    messages: 'Messages',
    follows: 'Follows',
    groups: 'Groups',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    enabled: 'Enabled',
    disabled: 'Disabled',
    on: 'On',
    off: 'Off',
  },
};

class I18n {
  private currentLanguage: Language = 'nl';

  async init(): Promise<void> {
    const savedLanguage = await SecureStore.getItemAsync('app_language');
    if (savedLanguage && (savedLanguage === 'nl' || savedLanguage === 'en')) {
      this.currentLanguage = savedLanguage as Language;
    } else {
      // Try to detect from device locale
      // For now, default to Dutch
      this.currentLanguage = 'nl';
    }
  }

  async setLanguage(language: Language): Promise<void> {
    this.currentLanguage = language;
    await SecureStore.setItemAsync('app_language', language);
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: keyof typeof translations.nl): string {
    return translations[this.currentLanguage][key] || translations.nl[key] || key;
  }

  // Get all translations for current language
  getTranslations(): typeof translations.nl {
    return translations[this.currentLanguage];
  }
}

export const i18n = new I18n();

// Initialize on import
i18n.init().catch(console.error);

