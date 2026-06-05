import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Read the Facebook App ID + Client Token from app.config.js → extra so the
// values used by Settings.setAppID() at runtime stay in sync with what's
// baked into Info.plist / AndroidManifest. Drift between the two causes the
// iOS login flow to crash when Facebook tries to callback via fb<APP_ID>://
// because no URL scheme matches.
const FB_EXTRA: any = (Constants.expoConfig?.extra as any) || {};
const FB_APP_ID: string = FB_EXTRA.FACEBOOK_APP_ID || '1356345856462215';
const FB_CLIENT_TOKEN: string = FB_EXTRA.FACEBOOK_CLIENT_TOKEN || '1746ac26be98d3ead245f1e8957d068a';

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
  private appEventsLogger: any | null = null;

  /**
   * Initialize Facebook SDK and log app activation event.
   * Safe to call multiple times; will only run once.
   */
  async initialize(options?: { trackingAllowed?: boolean }): Promise<void> {
    if (this.initialized) return;

    // Only attempt on real native platforms
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    try {
      // Load native module
      const fb = await import('react-native-fbsdk-next');
      const { AppEventsLogger, Settings } = fb;
      this.appEventsLogger = AppEventsLogger;

      // Stap 1: App ID en Client Token instellen VOOR initializeSDK
      // Deze moeten overeenkomen met Info.plist / AndroidManifest config —
      // daarom lezen we uit Constants.expoConfig.extra, niet hardcoden.
      Settings.setAppID(FB_APP_ID);
      Settings.setClientToken(FB_CLIENT_TOKEN);

      // Stap 2: SDK initialiseren – dit activeert de JS ↔ native bridge
      Settings.initializeSDK();

      // Stap 3: Tracking na init configureren (iOS ATT compliant)
      if (options?.trackingAllowed !== false) {
        Settings.setAdvertiserTrackingEnabled(true);
      } else {
        Settings.setAdvertiserTrackingEnabled(false);
      }

      console.log('📱 FB SDK - Initializing & configured...');

      // Stap 4: Log activate app event
      AppEventsLogger.logEvent('fb_mobile_activate_app');
      console.log('📱 FB SDK - activate_app logged');

      // Stap 5: Flush in dev mode for faster test events visibility
      if (__DEV__) {
        AppEventsLogger.flush();
        console.log('📱 FB SDK - flushed');
      }

      this.initialized = true;
    } catch (error: any) {
      if (
        error?.message?.includes('native module') ||
        error?.message?.includes('Cannot find module') ||
        error?.code === 'MODULE_NOT_FOUND'
      ) {
        console.log('⚠️ Facebook SDK not available (likely Expo Go / web), skipping initialization.');
        return;
      }
      console.error('📱 FB SDK - Error:', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Log a Facebook event.
   */
  logEvent(eventName: FbEventName, params?: Record<string, any>, valueToSum?: number): void {
    if (!this.initialized || !this.appEventsLogger) {
      return;
    }

    try {
      if (typeof valueToSum === 'number') {
        this.appEventsLogger.logEvent(eventName, valueToSum, params);
      } else {
        this.appEventsLogger.logEvent(eventName, params);
      }
      if (__DEV__) {
        this.appEventsLogger.flush();
      }
      console.log('📱 FB SDK - event:', eventName);
    } catch (error) {
      console.error('📱 FB SDK - event error:', error);
    }
  }

  logScreenView(screenName: string): void {
    this.logEvent(FB_EVENTS.SCREEN_VIEW, { screen_name: screenName });
  }

  logSignup(method: string): void {
    this.logEvent(FB_EVENTS.USER_SIGNED_UP, { method });
  }

  logLogin(method: string): void {
    this.logEvent(FB_EVENTS.USER_LOGGED_IN, { method });
  }

  logLogout(): void {
    this.logEvent(FB_EVENTS.USER_LOGGED_OUT);
  }

  logSubscriptionPurchased(planId: string, price: number, currency: string): void {
    this.logEvent(FB_EVENTS.SUBSCRIPTION_PURCHASED, { plan_id: planId, currency }, price);
  }

  logSubscriptionCancelled(planId: string, reason?: string): void {
    this.logEvent(FB_EVENTS.SUBSCRIPTION_CANCELLED, {
      plan_id: planId,
      reason,
    });
  }

  /**
   * Force flush all pending Facebook events immediately.
   * Useful for testing or ensuring events are sent before app closes.
   */
  async flushEvents(): Promise<void> {
    if (!this.initialized || !this.appEventsLogger) {
      return;
    }

    try {
      if (typeof this.appEventsLogger.flush === 'function') {
        this.appEventsLogger.flush();
        console.log('📱 FB SDK - manually flushed');
      }
    } catch (error: any) {
      console.warn('⚠️ Failed to flush Facebook events:', error);
    }
  }
}

export const facebookAnalytics = new FacebookAnalyticsService();

/**
 * Backwards-compatible helper for existing initialization call in _layout.tsx.
 */
export async function initializeFacebookSDK(options?: { trackingAllowed?: boolean }) {
  await facebookAnalytics.initialize(options);
}
