import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/secureStorage';

type AiConsentStatus = 'unknown' | 'granted' | 'denied';

interface ConsentState {
  // AI & data sharing consent
  aiConsentStatus: AiConsentStatus;
  isLoading: boolean;

  // Actions
  loadConsent: () => Promise<void>;
  grantAiConsent: () => Promise<void>;
  denyAiConsent: () => Promise<void>;
  resetConsent: () => Promise<void>;
}

const AI_CONSENT_KEY = 'ai_data_consent';
// Fallback key stored in AsyncStorage so consent persists even if SecureStore fails
const AI_CONSENT_FALLBACK_KEY = '@aurora:ai_data_consent';

export const useConsentStore = create<ConsentState>((set) => ({
  aiConsentStatus: 'unknown',
  isLoading: false,

  loadConsent: async () => {
    set({ isLoading: true });
    try {
      // 1) Try secure storage (preferred)
      const storedSecure = await secureStorage.getItemAsync(AI_CONSENT_KEY);
      if (storedSecure === 'granted' || storedSecure === 'denied') {
        set({ aiConsentStatus: storedSecure, isLoading: false });
        return;
      }

      // 2) Fallback: try AsyncStorage (covers dev issues with SecureStore)
      const storedFallback = await AsyncStorage.getItem(AI_CONSENT_FALLBACK_KEY);
      if (storedFallback === 'granted' || storedFallback === 'denied') {
        set({ aiConsentStatus: storedFallback as AiConsentStatus, isLoading: false });
        // Best-effort migrate back into secure storage, ignore errors
        secureStorage
          .setItemAsync(AI_CONSENT_KEY, storedFallback)
          .catch(() => {});
        return;
      }

      set({ aiConsentStatus: 'unknown', isLoading: false });
    } catch {
      set({ aiConsentStatus: 'unknown', isLoading: false });
    }
  },

  grantAiConsent: async () => {
    try {
      // Write to both stores; if one fails we still persist in the other
      await Promise.allSettled([
        secureStorage.setItemAsync(AI_CONSENT_KEY, 'granted'),
        AsyncStorage.setItem(AI_CONSENT_FALLBACK_KEY, 'granted'),
      ]);
    } finally {
      set({ aiConsentStatus: 'granted' });
    }
  },

  denyAiConsent: async () => {
    try {
      await Promise.allSettled([
        secureStorage.setItemAsync(AI_CONSENT_KEY, 'denied'),
        AsyncStorage.setItem(AI_CONSENT_FALLBACK_KEY, 'denied'),
      ]);
    } finally {
      set({ aiConsentStatus: 'denied' });
    }
  },

  resetConsent: async () => {
    try {
      await Promise.allSettled([
        secureStorage.deleteItemAsync(AI_CONSENT_KEY),
        AsyncStorage.removeItem(AI_CONSENT_FALLBACK_KEY),
      ]);
    } finally {
      set({ aiConsentStatus: 'unknown' });
    }
  },
}));

