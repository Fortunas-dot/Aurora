import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * SecureStore options: AFTER_FIRST_UNLOCK allows reads as soon as the device
 * has been unlocked once after boot, without requiring active user interaction.
 * This prevents "User interaction is not allowed" errors during app startup.
 */
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

/**
 * Returns true if the error is the iOS "User interaction is not allowed" timing
 * issue — the item simply isn't readable yet; callers already fall back gracefully.
 */
function isUserInteractionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('User interaction is not allowed');
}

/**
 * Platform-aware storage utility
 * Uses localStorage on web, SecureStore on native platforms
 */
class SecureStorage {
  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        throw error;
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
      } catch (error) {
        if (!isUserInteractionError(error)) {
          console.error('Error saving to SecureStore:', error);
        }
        throw error;
      }
    }
  }

  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    } else {
      try {
        return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
      } catch (error) {
        if (!isUserInteractionError(error)) {
          console.error('Error reading from SecureStore:', error);
        }
        return null;
      }
    }
  }

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
        throw error;
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
      } catch (error) {
        if (!isUserInteractionError(error)) {
          console.error('Error removing from SecureStore:', error);
        }
        throw error;
      }
    }
  }
}

export const secureStorage = new SecureStorage();
