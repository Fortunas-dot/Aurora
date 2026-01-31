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
  // Check for configured API URL (production, Railway, etc.)
  const configuredUrl = getConfigString(Constants.expoConfig?.extra?.API_URL);
  
  // If a production URL is configured (doesn't contain localhost), use it
  if (configuredUrl && !configuredUrl.includes('localhost') && !configuredUrl.includes('127.0.0.1')) {
    console.log('[API] Using configured production URL:', configuredUrl);
    return configuredUrl;
  }
  
  // Local development fallbacks
  if (__DEV__) {
    // Custom host for physical device testing (iOS physical devices need this)
    const customHost = getConfigString(Constants.expoConfig?.extra?.API_HOST);
    if (customHost) {
      const url = `http://${customHost}:3000/api`;
      console.log('[API] Using custom API_HOST:', url);
      return url;
    }
    
    // Try to get the Expo dev server hostname (works for physical devices)
    const expoHost = Constants.expoConfig?.hostUri;
    if (expoHost) {
      // Extract IP from hostUri (format: "192.168.1.100:8081")
      const hostIp = expoHost.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        const url = `http://${hostIp}:3000/api`;
        console.log('[API] Using Expo dev server IP:', url);
        return url;
      }
    }
    
    // Platform-specific defaults
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      const url = 'http://10.0.2.2:3000/api';
      console.log('[API] Using Android emulator URL:', url);
      return url;
    }
    
    // iOS: For physical devices, localhost won't work - need computer's IP
    // For iOS simulator, localhost works
    // If we couldn't get the IP from hostUri, fall back to localhost
    const url = 'http://localhost:3000/api';
    console.warn('[API] Using localhost URL. For iOS physical device, set API_HOST or ensure Expo dev server is accessible:', url);
    return url;
  }
  
  // Production mode - API_URL MUST be configured
  if (!configuredUrl || configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1')) {
    const errorMsg = '[API] ERROR: API_URL not configured for production! Set API_URL in .env to your production backend URL (e.g., https://your-app.up.railway.app/api)';
    console.error(errorMsg);
    // Still return a URL to prevent app crash, but log the error
    // In production, this should never happen if properly configured
    return configuredUrl || 'https://aurora-production.up.railway.app/api';
  }
  
  return configuredUrl;
};

