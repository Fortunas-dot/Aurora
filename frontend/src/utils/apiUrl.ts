import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper to safely get string value from config
const getConfigString = (value: any): string | null => {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return null;
};

/**
 * Get API URL with platform-specific handling
 * - Production: Uses configured API_URL from environment
 * - Android Emulator: Uses 10.0.2.2 to access host machine's localhost
 * - iOS Simulator/Web: Uses localhost
 * - Physical Device: Uses API_HOST if configured, otherwise falls back to platform default
 */
export const getApiUrl = (): string => {
  // Always use Railway backend
  const railwayUrl = 'https://aurora-production.up.railway.app/api';
  console.log('[API] Using Railway backend:', railwayUrl);
  return railwayUrl;
};

