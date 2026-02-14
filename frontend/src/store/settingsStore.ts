import { create } from 'zustand';
import { i18n, Language } from '../utils/i18n';
import { secureStorage } from '../utils/secureStorage';
import { useAuthStore } from './authStore';
import { userService } from '../services/user.service';

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  likes: boolean;
  comments: boolean;
  messages: boolean;
  follows: boolean;
  groups: boolean;
}

export interface PrivacySettings {
  showEmail: boolean;
  isAnonymous: boolean;
}

export interface AppSettings {
  language: Language;
  theme: 'dark' | 'light' | 'system';
  fontFamily?: string;
}

export type AuroraStyle = 'classic' | 'organic' | 'blobs';

interface SettingsState {
  // App Settings
  language: Language;
  theme: 'dark' | 'light' | 'system';
  fontFamily: string;
  auroraStyle: AuroraStyle;
  
  // Privacy Settings
  showEmail: boolean;
  isAnonymous: boolean;
  
  // Notification Preferences
  notificationPreferences: NotificationPreferences;
  
  // Loading state
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (theme: 'dark' | 'light' | 'system') => Promise<void>;
  setFontFamily: (fontFamily: string) => Promise<void>;
  setAuroraStyle: (style: AuroraStyle) => Promise<void>;
  setShowEmail: (show: boolean) => Promise<void>;
  setIsAnonymous: (anonymous: boolean) => Promise<void>;
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultNotificationPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: false,
  likes: true,
  comments: true,
  messages: true,
  follows: true,
  groups: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  language: 'en',
  theme: 'dark',
  fontFamily: 'system',
  auroraStyle: 'organic',
  showEmail: false,
  isAnonymous: true,
  notificationPreferences: defaultNotificationPreferences,
  isLoading: true,
  isSaving: false,

  // Set language
  setLanguage: async (language: Language) => {
    await i18n.setLanguage(language);
    await secureStorage.setItemAsync('app_language', language);
    set({ language });
  },

  // Set theme (automatically saves)
  setTheme: async (theme: 'dark' | 'light' | 'system') => {
    await secureStorage.setItemAsync('app_theme', theme);
    set({ theme });
    // Theme is already saved to SecureStore, no need to call saveSettings
  },

  // Set font family (automatically saves)
  setFontFamily: async (fontFamily: string) => {
    await secureStorage.setItemAsync('app_font_family', fontFamily);
    set({ fontFamily });
    // Font family is already saved to SecureStore, no need to call saveSettings
  },

  // Set Aurora style (automatically saves)
  setAuroraStyle: async (auroraStyle: AuroraStyle) => {
    await secureStorage.setItemAsync('app_aurora_style', auroraStyle);
    set({ auroraStyle });
  },

  // Set show email
  setShowEmail: async (show: boolean) => {
    set({ showEmail: show });
    // Save to backend
    const { user } = useAuthStore.getState();
    if (user) {
      try {
        await userService.updateProfile({ showEmail: show });
        useAuthStore.getState().updateUser({ showEmail: show });
      } catch (error) {
        console.error('Error updating showEmail:', error);
      }
    }
  },

  // Set is anonymous
  setIsAnonymous: async (anonymous: boolean) => {
    set({ isAnonymous: anonymous });
    // Save to backend
    const { user } = useAuthStore.getState();
    if (user) {
      try {
        await userService.updateProfile({ isAnonymous: anonymous });
        useAuthStore.getState().updateUser({ isAnonymous: anonymous });
      } catch (error) {
        console.error('Error updating isAnonymous:', error);
      }
    }
  },

  // Set notification preference
  setNotificationPreference: async (key: keyof NotificationPreferences, value: boolean) => {
    set((state) => ({
      notificationPreferences: {
        ...state.notificationPreferences,
        [key]: value,
      },
    }));
    
    // Save to secure store
    const prefs = get().notificationPreferences;
    await secureStorage.setItemAsync('notification_preferences', JSON.stringify(prefs));
  },

  // Load settings
  loadSettings: async () => {
    set({ isLoading: true });
    
    try {
      // App is always in English (Dutch translations are kept for future use)
      await i18n.init();
      const language: Language = 'en';
      
      // Set language in i18n to English
      await i18n.setLanguage(language);
      
      // App only supports dark mode - always set to dark
      const theme = 'dark';
      
      // Load font family
      const fontFamily = (await secureStorage.getItemAsync('app_font_family')) || 'system';
      
      // Load Aurora style (backward compatibility: 'sphere' maps to 'classic')
      const storedStyle = await secureStorage.getItemAsync('app_aurora_style');
      let auroraStyle: AuroraStyle;
      if (!storedStyle) {
        auroraStyle = 'organic'; // Default to new organic style
      } else if (storedStyle === 'sphere') {
        // Backward compatibility: old 'sphere' becomes 'classic'
        auroraStyle = 'classic';
        await secureStorage.setItemAsync('app_aurora_style', 'classic');
      } else {
        auroraStyle = storedStyle as AuroraStyle;
      }
      
      // Load notification preferences
      const prefsJson = await secureStorage.getItemAsync('notification_preferences');
      const notificationPreferences = prefsJson
        ? JSON.parse(prefsJson)
        : defaultNotificationPreferences;
      
      // Load privacy settings from user
      const { user } = useAuthStore.getState();
      const showEmail = user?.showEmail || false;
      const isAnonymous = user?.isAnonymous ?? true;
      
      set({
        language: language as Language,
        theme: theme as 'dark' | 'light' | 'system',
        fontFamily: fontFamily as string,
        auroraStyle,
        showEmail,
        isAnonymous,
        notificationPreferences,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ isLoading: false });
    }
  },

  // Save all settings
  saveSettings: async () => {
    set({ isSaving: true });
    
    try {
      const state = get();
      
      // Language is always English, no need to save
      
      // Save theme
      await secureStorage.setItemAsync('app_theme', state.theme);
      
      // Save font family
      await secureStorage.setItemAsync('app_font_family', state.fontFamily);
      
      // Save notification preferences
      await secureStorage.setItemAsync('notification_preferences', JSON.stringify(state.notificationPreferences));
      
      // Save privacy settings to backend
      const { user } = useAuthStore.getState();
      if (user) {
        await userService.updateProfile({
          showEmail: state.showEmail,
          isAnonymous: state.isAnonymous,
        });
        useAuthStore.getState().updateUser({
          showEmail: state.showEmail,
          isAnonymous: state.isAnonymous,
        });
      }
      
      set({ isSaving: false });
    } catch (error) {
      console.error('Error saving settings:', error);
      set({ isSaving: false });
    }
  },
}));

