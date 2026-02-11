import { secureStorage } from './secureStorage';

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
    profileVisibility: 'Profiel zichtbaarheid',
    profileVisibilityDesc: 'Bepaal wie je profiel kan zien',
    whoCanMessage: 'Wie kan je berichten sturen',
    whoCanMessageDesc: 'Bepaal wie je directe berichten kan sturen',
    accountData: 'Account gegevens',
    exportData: 'Mijn gegevens exporteren',
    exportDataDesc: 'Download een kopie van je account gegevens',
    deleteAccount: 'Account verwijderen',
    deleteAccountDesc: 'Verwijder je account en alle gegevens permanent',
    privacyPolicy: 'Privacybeleid',
    termsOfService: 'Servicevoorwaarden',
    
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
    
    // Voice Support
    'Voice Therapy': 'Voice Support',
    'Listening...': 'Luisteren...',
    'Aurora is speaking...': 'Aurora spreekt...',
    'Processing...': 'Verwerken...',
    'Ready to talk': 'Klaar om te praten',
    'Transcript': 'Transcriptie',
    'Mute': 'Dempen',
    'Unmute': 'Unmute',
    'How it works': 'Hoe het werkt',
    'Speak naturally - Aurora listens in real-time': 'Spreek natuurlijk - Aurora luistert in real-time',
    'Aurora responds with empathy and understanding': 'Aurora reageert met empathie en begrip',
    'Your conversations are private and secure': 'Je gesprekken zijn privé en veilig',
    'Login Required': 'Inloggen vereist',
    'Please log in to use voice therapy': 'Log in om voice support te gebruiken',
    'Login': 'Inloggen',
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
    profileVisibility: 'Profile Visibility',
    profileVisibilityDesc: 'Control who can see your profile',
    whoCanMessage: 'Who Can Message You',
    whoCanMessageDesc: 'Control who can send you direct messages',
    accountData: 'Account Data',
    exportData: 'Export My Data',
    exportDataDesc: 'Download a copy of your account data',
    deleteAccount: 'Delete Account',
    deleteAccountDesc: 'Permanently delete your account and all data',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    
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
    
    // Voice Support
    'Voice Therapy': 'Voice Support',
    'Listening...': 'Listening...',
    'Aurora is speaking...': 'Aurora is speaking...',
    'Processing...': 'Processing...',
    'Ready to talk': 'Ready to talk',
    'Transcript': 'Transcript',
    'Mute': 'Mute',
    'Unmute': 'Unmute',
    'How it works': 'How it works',
    'Speak naturally - Aurora listens in real-time': 'Speak naturally - Aurora listens in real-time',
    'Aurora responds with empathy and understanding': 'Aurora responds with empathy and understanding',
    'Your conversations are private and secure': 'Your conversations are private and secure',
    'Login Required': 'Login Required',
    'Please log in to use voice therapy': 'Please log in to use voice support',
    'Login': 'Login',
  },
};

class I18n {
  private currentLanguage: Language = 'en';

  async init(): Promise<void> {
    const savedLanguage = await secureStorage.getItemAsync('app_language');
    if (savedLanguage && (savedLanguage === 'nl' || savedLanguage === 'en')) {
      this.currentLanguage = savedLanguage as Language;
    } else {
      // Default to English
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

  t(key: keyof typeof translations.nl): string {
    // Always return English translations
    return translations.en[key] || translations.nl[key] || key;
  }

  // Get all translations for current language
  getTranslations(): typeof translations.nl {
    return translations[this.currentLanguage];
  }
}

export const i18n = new I18n();

// Initialize on import
i18n.init().catch(console.error);

