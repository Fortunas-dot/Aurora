import { Platform } from 'react-native';

let initialized = false;

/**
 * Initialize Facebook SDK and send a basic "app activated" event so
 * Meta can detect that the SDK is installed and receiving traffic.
 *
 * This is safe to call multiple times; it will only run once.
 * It also safely no-ops on platforms/environments where the native
 * module is not available (e.g. web, Expo Go).
 */
export async function initializeFacebookSDK() {
  if (initialized) return;

  // Only attempt on native mobile platforms
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  try {
    // Dynamic import to avoid bundling issues where the native module
    // is not available (e.g. web or Expo Go).
    const fb = await import('react-native-fbsdk-next');
    const { Settings, AppEventsLogger } = fb;

    // Initialize the SDK
    try {
      Settings.initializeSDK();
    } catch (initError: any) {
      // If initialization fails due to native module issues, just bail out
      if (
        initError?.message?.includes('native module') ||
        initError?.message?.includes('doesn\'t exist')
      ) {
        console.warn('⚠️ Facebook SDK not available in this build (expected in Expo Go / web).');
        return;
      }
      console.warn('⚠️ Error initializing Facebook SDK:', initError);
      return;
    }

    // Log a basic activate event so Meta can see traffic
    try {
      AppEventsLogger.logEvent('fb_mobile_activate_app');
    } catch (eventError: any) {
      console.warn('⚠️ Error logging fb_mobile_activate_app event:', eventError);
    }

    initialized = true;
    console.log('✅ Facebook SDK initialized and fb_mobile_activate_app logged');
  } catch (error: any) {
    // Swallow import errors in environments where the native module is not present
    if (
      error?.message?.includes('native module') ||
      error?.message?.includes('Cannot find module') ||
      error?.code === 'MODULE_NOT_FOUND'
    ) {
      console.log('⚠️ Facebook SDK not available (likely Expo Go or web), skipping initialization.');
      return;
    }

    console.warn('⚠️ Failed to initialize Facebook SDK:', error);
  }
}

