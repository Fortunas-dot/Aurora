import type { PostHog } from 'posthog-react-native';

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
  private client: PostHog | null = null;

  /**
   * Initialize the service with a PostHog client instance.
   * This should be called from a component that has access to usePostHog()
   * (see PostHogInitializer in _layout.tsx).
   */
  initialize(client: PostHog) {
    if (!client) {
      console.warn('PostHogService.initialize called without a client instance');
      return;
    }

    this.client = client;
    this.initialized = true;

    // Guaranteed "hello" event so PostHog always sees at least one event
    try {
      this.client.capture(POSTHOG_EVENTS.APP_INITIALIZED, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('PostHog app_initialized event failed:', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized || !this.client) return;
    try {
      this.client.identify(userId, properties);
    } catch (error) {
      console.warn('PostHog identify failed:', error);
    }
  }

  reset() {
    if (!this.initialized || !this.client) return;
    try {
      this.client.reset();
    } catch (error) {
      console.warn('PostHog reset failed:', error);
    }
  }

  capture(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized || !this.client) return;
    try {
      this.client.capture(eventName, properties);
    } catch (error) {
      console.warn('PostHog capture failed:', error);
    }
  }

  // Alias for capture - more semantic
  trackEvent(eventName: string, properties?: Record<string, any>) {
    this.capture(eventName, properties);
  }

  screen(screenName: string, properties?: Record<string, any>) {
    if (!this.initialized || !this.client) return;
    try {
      this.client.screen(screenName, properties);
    } catch (error) {
      console.warn('PostHog screen failed:', error);
    }
  }

  // Alias for screen - more semantic
  trackScreenView(screenName: string, properties?: Record<string, any>) {
    this.screen(screenName, properties);
  }

  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized || !this.client) return;
    try {
      this.client.setUserProperties(properties);
    } catch (error) {
      console.warn('PostHog setUserProperties failed:', error);
    }
  }
}

export const posthogService = new PostHogService();
