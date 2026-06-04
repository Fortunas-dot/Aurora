/**
 * AppsFlyer attribution & in-app events (react-native-appsflyer).
 * Expo: native AppsFlyerLib is linked via the config plugin — no Swift import in app code.
 * Requires a dev client / production build — not available in Expo Go.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const APPSFLYER_DEV_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APPSFLYER_DEV_KEY) ||
  (typeof Constants !== 'undefined' &&
    (Constants.expoConfig?.extra as Record<string, string | undefined>)?.APPSFLYER_DEV_KEY) ||
  'RBJkuembZMxdf9Vq2yurf7';

/** iOS App Store numeric ID (no "id" prefix) */
const APPSFLYER_IOS_APP_ID =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APPSFLYER_APP_ID) ||
  (typeof Constants !== 'undefined' &&
    (Constants.expoConfig?.extra as Record<string, string | undefined>)?.APPSFLYER_APP_ID) ||
  '6758727961';

/** Standard AppsFlyer event names (see AppsFlyer in-app events catalog) */
export const AF_EVENTS = {
  LOGIN: 'af_login',
  COMPLETE_REGISTRATION: 'af_complete_registration',
  PURCHASE: 'af_purchase',
  SUBSCRIBE: 'af_subscribe',
  CONTENT_VIEW: 'af_content_view',
  TUTORIAL_COMPLETION: 'af_tutorial_completion',
  START_TRIAL: 'af_start_trial',
  /** Healthcare vertical — AI chat session */
  CHAT_DOCTOR: 'chat_doctor',
} as const;

type AfEventName = (typeof AF_EVENTS)[keyof typeof AF_EVENTS] | string;

type PendingEvent = { eventName: AfEventName; eventValues: Record<string, string | number> };

class AppsFlyerService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private pendingEvents: PendingEvent[] = [];

  private isNative(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Initialize AppsFlyer after ATT (iOS). Safe to call multiple times.
   * Set customerUserId before init when available so the install event is attributed.
   */
  async initialize(options?: {
    trackingAllowed?: boolean;
    customerUserId?: string | null;
  }): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    if (!this.isNative()) return;

    this.initPromise = this.doInitialize(options);
    return this.initPromise;
  }

  private async doInitialize(options?: {
    trackingAllowed?: boolean;
    customerUserId?: string | null;
  }): Promise<void> {
    try {
      const appsFlyer = (await import('react-native-appsflyer')).default;

      const userId = options?.customerUserId?.trim();
      if (userId) {
        appsFlyer.setCustomerUserId(userId);
      }

      const initOptions: {
        devKey: string;
        isDebug: boolean;
        onInstallConversionDataListener: boolean;
        onDeepLinkListener: boolean;
        appId?: string;
        timeToWaitForATTUserAuthorization?: number;
      } = {
        devKey: APPSFLYER_DEV_KEY,
        isDebug: __DEV__,
        onInstallConversionDataListener: false,
        onDeepLinkListener: false,
      };

      if (Platform.OS === 'ios') {
        initOptions.appId = APPSFLYER_IOS_APP_ID;
        if (options?.trackingAllowed !== false) {
          initOptions.timeToWaitForATTUserAuthorization = 60;
        }
      }

      await new Promise<void>((resolve, reject) => {
        appsFlyer.initSdk(
          initOptions,
          () => resolve(),
          (err) => reject(err)
        );
      });

      this.initialized = true;
      this.flushPendingEvents();

      if (__DEV__) {
        console.log('✅ AppsFlyer SDK initialized');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('native module') ||
        message.includes('Cannot find module') ||
        message.includes('RNAppsFlyer')
      ) {
        console.log('⚠️ AppsFlyer not available (Expo Go / web), skipping.');
        return;
      }
      console.warn('⚠️ AppsFlyer initialization failed:', error);
    } finally {
      this.initPromise = null;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private flushPendingEvents(): void {
    const queue = [...this.pendingEvents];
    this.pendingEvents = [];
    for (const { eventName, eventValues } of queue) {
      this.sendLogEvent(eventName, eventValues);
    }
  }

  private sendLogEvent(
    eventName: AfEventName,
    eventValues: Record<string, string | number>
  ): void {
    void import('react-native-appsflyer')
      .then(({ default: appsFlyer }) => {
        appsFlyer.logEvent(eventName, eventValues);
        if (__DEV__) {
          console.log(`[AppsFlyer] ${eventName}`, eventValues);
        }
      })
      .catch((e) => {
        if (__DEV__) console.warn('[AppsFlyer] logEvent error:', eventName, e);
      });
  }

  private logEvent(eventName: AfEventName, eventValues: Record<string, string | number> = {}): void {
    if (!this.isNative()) return;
    if (!this.initialized) {
      this.pendingEvents.push({ eventName, eventValues });
      return;
    }
    this.sendLogEvent(eventName, eventValues);
  }

  setCustomerUserId(userId: string): void {
    if (!this.isNative() || !userId) return;
    void import('react-native-appsflyer')
      .then(({ default: appsFlyer }) => {
        appsFlyer.setCustomerUserId(userId);
      })
      .catch(() => {});
  }

  identify(userId: string): void {
    this.setCustomerUserId(userId);
  }

  trackRegistration(method = 'email'): void {
    this.logEvent(AF_EVENTS.COMPLETE_REGISTRATION, {
      af_registration_method: method,
    });
  }

  trackLogin(method = 'email'): void {
    this.logEvent(AF_EVENTS.LOGIN, {
      af_login_method: method,
    });
  }

  trackSubscribe(): void {
    this.logEvent(AF_EVENTS.SUBSCRIBE, {});
  }

  trackPurchase(params: {
    contentId: string;
    price: number;
    currency?: string;
    contentType?: string;
  }): void {
    this.logEvent(AF_EVENTS.PURCHASE, {
      af_content_id: params.contentId,
      af_content_type: params.contentType || 'subscription',
      af_revenue: String(params.price),
      af_currency: params.currency || 'EUR',
    });
  }

  trackContentView(screenName: string): void {
    this.logEvent(AF_EVENTS.CONTENT_VIEW, {
      af_content: screenName,
      af_content_id: screenName,
      af_content_type: 'screen',
    });
  }

  trackTutorialCompletion(tutorialId = 'aurora_onboarding'): void {
    this.logEvent(AF_EVENTS.TUTORIAL_COMPLETION, {
      af_success: 'true',
      af_tutorial_id: tutorialId,
      af_content: 'Aurora onboarding',
    });
  }

  trackStartTrial(productId?: string): void {
    this.logEvent(AF_EVENTS.START_TRIAL, {
      ...(productId ? { af_content_id: productId } : {}),
    });
  }

  /** Healthcare vertical — user opened Aurora AI chat */
  trackChatDoctor(params?: { specialty?: string }): void {
    this.logEvent(AF_EVENTS.CHAT_DOCTOR, {
      doctor_name: 'Aurora',
      specialty: params?.specialty || 'mental_health_ai',
    });
  }
}

export const appsFlyerService = new AppsFlyerService();
