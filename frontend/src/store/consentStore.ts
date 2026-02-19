import { create } from 'zustand';
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

export const useConsentStore = create<ConsentState>((set) => ({
  aiConsentStatus: 'unknown',
  isLoading: false,

  loadConsent: async () => {
    set({ isLoading: true });
    try {
      const stored = await secureStorage.getItemAsync(AI_CONSENT_KEY);
      if (stored === 'granted' || stored === 'denied') {
        set({ aiConsentStatus: stored, isLoading: false });
      } else {
        set({ aiConsentStatus: 'unknown', isLoading: false });
      }
    } catch {
      set({ aiConsentStatus: 'unknown', isLoading: false });
    }
  },

  grantAiConsent: async () => {
    try {
      await secureStorage.setItemAsync(AI_CONSENT_KEY, 'granted');
    } finally {
      set({ aiConsentStatus: 'granted' });
    }
  },

  denyAiConsent: async () => {
    try {
      await secureStorage.setItemAsync(AI_CONSENT_KEY, 'denied');
    } finally {
      set({ aiConsentStatus: 'denied' });
    }
  },

  resetConsent: async () => {
    try {
      await secureStorage.deleteItemAsync(AI_CONSENT_KEY);
    } finally {
      set({ aiConsentStatus: 'unknown' });
    }
  },
}));

