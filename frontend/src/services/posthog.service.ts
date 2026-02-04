import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.POSTHOG_API_KEY;
const POSTHOG_HOST = Constants.expoConfig?.extra?.POSTHOG_HOST || 'https://eu.i.posthog.com';

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
      await PostHog.initAsync(POSTHOG_API_KEY, {
        host: POSTHOG_HOST,
        enableSessionReplay: true,
        // Enable autocapture for automatic event tracking
        autocapture: true,
        // Capture screen views automatically
        captureScreenViews: true,
        // Enable debug mode in development
        debug: __DEV__,
      });

      this.initialized = true;
      console.log('✅ PostHog initialized successfully');
    } catch (error) {
      console.error('❌ PostHog initialization failed:', error);
    }
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    PostHog.identify(userId, properties);
  }

  reset() {
    if (!this.initialized) return;
    PostHog.reset();
  }

  capture(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    PostHog.capture(eventName, properties);
  }

  screen(screenName: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    PostHog.screen(screenName, properties);
  }

  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;
    PostHog.setUserProperties(properties);
  }
}

export const posthogService = new PostHogService();
