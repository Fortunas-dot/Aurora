import * as PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.POSTHOG_API_KEY;
const POSTHOG_HOST = Constants.expoConfig?.extra?.POSTHOG_HOST || 'https://eu.i.posthog.com';

// Event names - use these constants to ensure consistency
export const POSTHOG_EVENTS = {
  // Screen views (automatisch getrackt, maar je kunt custom events toevoegen)
  SCREEN_VIEW: '$screen',
  
  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_EMAIL_VERIFIED: 'user_email_verified',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  LOGIN_FAILED: 'login_failed',
  SIGNUP_FAILED: 'signup_failed',
  
  // Subscription & Payments
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  SUBSCRIPTION_PURCHASED: 'subscription_purchased',
  SUBSCRIPTION_RESTORED: 'subscription_restored',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_FAILED: 'payment_failed',
  PAYWALL_SHOWN: 'paywall_shown',
  PAYWALL_DISMISSED: 'paywall_dismissed',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  
  // Feature Usage
  FEATURE_USED: 'feature_used',
  BUTTON_CLICKED: 'button_clicked',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  SORT_APPLIED: 'sort_applied',
  
  // User Actions (pas aan naar jouw app features)
  ITEM_CREATED: 'item_created',
  ITEM_UPDATED: 'item_updated',
  ITEM_DELETED: 'item_deleted',
  ITEM_VIEWED: 'item_viewed',
  ITEM_SHARED: 'item_shared',
  ITEM_FAVORITED: 'item_favorited',
  
  // Social/Community
  POST_CREATED: 'post_created',
  POST_LIKED: 'post_liked',
  POST_COMMENTED: 'post_commented',
  POST_SHARED: 'post_shared',
  POST_REPORTED: 'post_reported',
  COMMENT_LIKED: 'comment_liked',
  
  // Engagement
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
  DEEP_LINK_OPENED: 'deep_link_opened',
  SHARE_INVITE_SENT: 'share_invite_sent',
  
  // App Lifecycle
  APP_OPENED: 'app_opened',
  APP_OPENED_DAILY: 'app_opened_daily',
  APP_INITIALIZED: 'app_initialized',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_FOREGROUNDED: 'app_foregrounded',
  APP_CRASHED: 'app_crashed',
  
  // Errors & Issues
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
} as const;

// Property names - use these constants for custom properties
export const POSTHOG_PROPERTIES = {
  // Standard properties
  SCREEN_NAME: '$screen_name',
  USER_ID: 'user_id',
  PLATFORM: 'platform',
  LANGUAGE: 'language',
  TIMESTAMP: 'timestamp',
  
  // Custom properties (pas aan naar jouw app)
  ITEM_ID: 'item_id',
  ITEM_TYPE: 'item_type',
  ITEM_CATEGORY: 'item_category',
  PLAN_TYPE: 'plan_type',
  SUBSCRIPTION_STATUS: 'subscription_status',
  PAYMENT_METHOD: 'payment_method',
  ERROR_MESSAGE: 'error_message',
  ERROR_TYPE: 'error_type',
  ERROR_STACK: 'error_stack',
  BUTTON_NAME: 'button_name',
  FEATURE_NAME: 'feature_name',
  SEARCH_QUERY: 'search_query',
  FILTER_TYPE: 'filter_type',
  FILTER_VALUE: 'filter_value',
  RESULTS_COUNT: 'results_count',
} as const;

class PostHogService {
  private initialized = false;

  async initialize() {
    if (!POSTHOG_API_KEY) {
      console.warn('PostHog API key not found. PostHog will not be initialized.');
      return;
    }

    if (this.initialized) {
      return;
    }

    try {
      // In development, PostHog native module may not be available
      // This is expected and not an error
      if (__DEV__) {
        console.log('📊 PostHog: Running in development mode. Native module may not be available.');
      }

      // Try different initialization methods based on how PostHog is exported
      let initMethod: ((apiKey: string, options: any) => Promise<void>) | null = null;
      
      // Check for default export with initAsync
      if (PostHog.default && typeof PostHog.default.initAsync === 'function') {
        initMethod = PostHog.default.initAsync.bind(PostHog.default);
      }
      // Check for named export initAsync
      else if (PostHog && typeof (PostHog as any).initAsync === 'function') {
        initMethod = (PostHog as any).initAsync;
      }
      // Check for direct PostHog object with initAsync
      else if (typeof (PostHog as any).initAsync === 'function') {
        initMethod = (PostHog as any).initAsync;
      }
      
      if (initMethod) {
        await initMethod(POSTHOG_API_KEY, {
          host: POSTHOG_HOST,
          enableSessionReplay: true,
          autocapture: true,
          captureScreenViews: true,
          debug: __DEV__,
        });
        this.initialized = true;
        console.log('✅ PostHog initialized successfully');
        
        // Track app initialized event
        this.trackEvent(POSTHOG_EVENTS.APP_INITIALIZED, {
          timestamp: new Date().toISOString(),
        });
      } else {
        // In development, this is expected - native module only available in production builds
        if (__DEV__) {
          console.log('ℹ️ PostHog: Native module not available in development. This is expected.');
          console.log('ℹ️ PostHog will work in production builds.');
        } else {
          console.warn('⚠️ PostHog.initAsync is not available. PostHog may not be properly installed.');
          console.warn('PostHog object keys:', Object.keys(PostHog || {}));
          console.warn('PostHog.default:', (PostHog as any).default);
        }
        // Don't mark as initialized if we can't initialize
        return;
      }
    } catch (error) {
      // In development, errors are expected if native module isn't available
      if (__DEV__) {
        console.log('ℹ️ PostHog initialization skipped in development (native module not available)');
      } else {
        console.error('❌ PostHog initialization failed:', error);
      }
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    try {
      const identifyMethod = (PostHog.default?.identify) || (PostHog as any).identify || ((PostHog as any).default?.identify);
      if (identifyMethod && typeof identifyMethod === 'function') {
        identifyMethod(userId, properties);
      }
    } catch (error) {
      console.warn('PostHog identify failed:', error);
    }
  }

  reset() {
    if (!this.initialized) return;
    try {
      const resetMethod = (PostHog.default?.reset) || (PostHog as any).reset || ((PostHog as any).default?.reset);
      if (resetMethod && typeof resetMethod === 'function') {
        resetMethod();
      }
    } catch (error) {
      console.warn('PostHog reset failed:', error);
    }
  }

  capture(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    try {
      const captureMethod = (PostHog.default?.capture) || (PostHog as any).capture || ((PostHog as any).default?.capture);
      if (captureMethod && typeof captureMethod === 'function') {
        captureMethod(eventName, properties);
      }
    } catch (error) {
      console.warn('PostHog capture failed:', error);
    }
  }

  // Alias for capture - more semantic
  trackEvent(eventName: string, properties?: Record<string, any>) {
    this.capture(eventName, properties);
  }

  screen(screenName: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    try {
      const screenMethod = (PostHog.default?.screen) || (PostHog as any).screen || ((PostHog as any).default?.screen);
      if (screenMethod && typeof screenMethod === 'function') {
        screenMethod(screenName, properties);
      }
    } catch (error) {
      console.warn('PostHog screen failed:', error);
    }
  }

  // Alias for screen - more semantic
  trackScreenView(screenName: string, properties?: Record<string, any>) {
    this.screen(screenName, properties);
  }

  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;
    try {
      const setUserPropertiesMethod = (PostHog.default?.setUserProperties) || (PostHog as any).setUserProperties || ((PostHog as any).default?.setUserProperties);
      if (setUserPropertiesMethod && typeof setUserPropertiesMethod === 'function') {
        setUserPropertiesMethod(properties);
      }
    } catch (error) {
      console.warn('PostHog setUserProperties failed:', error);
    }
  }
}

export const posthogService = new PostHogService();
