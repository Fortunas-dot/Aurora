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
  async initialize(options?: { trackingAllowed?: boolean }) {
    if (this.initialized) return;

    const fb = await this.loadNativeModule();
    if (!fb) return;

    const { Settings, AppEventsLogger } = fb;

    try {
      if (Settings && typeof Settings.initializeSDK === 'function') {
        Settings.initializeSDK();
      }

      // Enable debug logging for Facebook events (helps with test events visibility)
      if (Settings && typeof (Settings as any).setIsDebugEnabled === 'function') {
        try {
          (Settings as any).setIsDebugEnabled(__DEV__ || true); // Enable in dev and for test events
          console.log('✅ Facebook SDK debug logging enabled');
        } catch (debugError: any) {
          console.warn('⚠️ Failed to enable Facebook SDK debug logging:', debugError);
        }
      }

      // Enable app events logging behavior (iOS specific)
      if (
        Platform.OS === 'ios' &&
        Settings &&
        typeof (Settings as any).enableLoggingBehavior === 'function'
      ) {
        try {
          // LoggingBehavior enum values: appEvents, developerErrors, networkRequests, etc.
          (Settings as any).enableLoggingBehavior('appEvents');
          console.log('✅ Facebook app events logging behavior enabled');
        } catch (loggingError: any) {
          console.warn('⚠️ Failed to enable Facebook app events logging behavior:', loggingError);
        }
      }

      // Align with iOS 14.5+ requirement to set advertiser tracking consent
      // React Native FB SDK exposes this as Settings.setAdvertiserTrackingEnabled on iOS.
      if (
        Platform.OS === 'ios' &&
        Settings &&
        typeof (Settings as any).setAdvertiserTrackingEnabled === 'function' &&
        typeof options?.trackingAllowed === 'boolean'
      ) {
        try {
          (Settings as any).setAdvertiserTrackingEnabled(options.trackingAllowed);
          console.log(
            `✅ Facebook advertiser tracking ${options.trackingAllowed ? 'enabled' : 'disabled'} based on ATT consent.`,
          );
        } catch (consentError: any) {
          console.warn('⚠️ Failed to set Facebook advertiser tracking flag:', consentError);
        }
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
      // Log to console for debugging (helps verify events are being sent)
      console.log(`📊 Facebook event logged: ${eventName}`, params || {}, valueToSum || '');
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
export async function initializeFacebookSDK(options?: { trackingAllowed?: boolean }) {
  await facebookAnalytics.initialize(options);
}

