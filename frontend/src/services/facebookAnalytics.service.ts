import { Platform } from 'react-native';

/**
 * Centralised Facebook App Events service for Aurora.
 *
 * Based on the PawBuddies guide, but adapted to be SAFE for:
 * - Expo Go
 * - Web / non-native environments
 * - Native builds without Facebook config
 *
 * All native calls are wrapped in dynamic imports and guarded so that
 * missing native modules never crash the app.
 */

export const FB_EVENTS = {
  APP_LAUNCH: 'fb_mobile_activate_app',
  USER_SIGNED_UP: 'fb_user_signed_up',
  USER_LOGGED_IN: 'fb_user_logged_in',
  USER_LOGGED_OUT: 'fb_user_logged_out',
  SUBSCRIPTION_PURCHASED: 'fb_subscription_purchased',
  SUBSCRIPTION_CANCELLED: 'fb_subscription_cancelled',
  SCREEN_VIEW: 'fb_screen_view',
} as const;

type FbEventName = (typeof FB_EVENTS)[keyof typeof FB_EVENTS] | string;

class FacebookAnalyticsService {
  private initialized = false;
  private settings: any | null = null;
  private appEventsLogger: any | null = null;

  /**
   * Internal helper: load native module if available.
   */
  private async loadNativeModule() {
    // Only attempt on real native platforms
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return null;
    }

    try {
      const fb = await import('react-native-fbsdk-next');
      return fb;
    } catch (error: any) {
      if (
        error?.message?.includes('native module') ||
        error?.message?.includes('Cannot find module') ||
        error?.code === 'MODULE_NOT_FOUND'
      ) {
        console.log('⚠️ Facebook SDK not available (likely Expo Go / web), skipping initialization.');
        return null;
      }

      console.warn('⚠️ Failed to import Facebook SDK module:', error);
      return null;
    }
  }

  /**
   * Initialize Facebook SDK and send the standard app activation event.
   * Safe to call multiple times; will only run once.
   */
  async initialize() {
    if (this.initialized) return;

    const fb = await this.loadNativeModule();
    if (!fb) return;

    const { Settings, AppEventsLogger } = fb;

    try {
      if (Settings && typeof Settings.initializeSDK === 'function') {
        Settings.initializeSDK();
      }
    } catch (initError: any) {
      if (
        initError?.message?.includes('native module') ||
        initError?.message?.includes("doesn't exist")
      ) {
        console.warn('⚠️ Facebook SDK native module not available in this build.');
        return;
      }
      console.warn('⚠️ Error initializing Facebook SDK:', initError);
      return;
    }

    this.settings = Settings;
    this.appEventsLogger = AppEventsLogger;

    // Log standard "app activation" event so Meta can see traffic
    try {
      this.logEvent(FB_EVENTS.APP_LAUNCH, { platform: Platform.OS });
      console.log('✅ FacebookAnalyticsService initialized and fb_mobile_activate_app logged');
    } catch (eventError: any) {
      console.warn('⚠️ Error logging fb_mobile_activate_app event:', eventError);
    }

    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  /**
   * Low-level wrapper around AppEventsLogger.logEvent
   */
  logEvent(eventName: FbEventName, params?: Record<string, any>, valueToSum?: number) {
    if (!this.initialized || !this.appEventsLogger) {
      // Avoid noisy logs in dev if SDK is not available
      return;
    }

    try {
      if (typeof valueToSum === 'number') {
        this.appEventsLogger.logEvent(eventName, valueToSum, params);
      } else {
        this.appEventsLogger.logEvent(eventName, params);
      }
    } catch (error) {
      console.warn('⚠️ Error logging Facebook event:', eventName, error);
    }
  }

  logScreenView(screenName: string) {
    this.logEvent(FB_EVENTS.SCREEN_VIEW, { screen_name: screenName });
  }

  logSignup(method: string) {
    this.logEvent(FB_EVENTS.USER_SIGNED_UP, { method });
  }

  logLogin(method: string) {
    this.logEvent(FB_EVENTS.USER_LOGGED_IN, { method });
  }

  logLogout() {
    this.logEvent(FB_EVENTS.USER_LOGGED_OUT);
  }

  logSubscriptionPurchased(planId: string, price: number, currency: string) {
    this.logEvent(
      FB_EVENTS.SUBSCRIPTION_PURCHASED,
      { plan_id: planId, currency },
      price,
    );
  }

  logSubscriptionCancelled(planId: string, reason?: string) {
    this.logEvent(FB_EVENTS.SUBSCRIPTION_CANCELLED, {
      plan_id: planId,
      reason,
    });
  }
}

export const facebookAnalytics = new FacebookAnalyticsService();

/**
 * Backwards-compatible helper for existing initialization call in _layout.tsx.
 * (Keeps working if you later import { facebookAnalytics } directly.)
 */
export async function initializeFacebookSDK() {
  await facebookAnalytics.initialize();
}

