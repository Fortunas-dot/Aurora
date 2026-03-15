require('dotenv').config();

module.exports = {
  expo: {
    name: 'Aurora',
    slug: 'aurora',
    owner: 'pawbuddies',
    version: '1.0.4',
    runtimeVersion: {
      policy: 'appVersion', // Use app version as runtime version
    },
    updates: {
      url: 'https://u.expo.dev/3e76b1de-69b1-45db-ab68-c957d25e4002',
      fallbackToCacheTimeout: 0,
      checkAutomatically: 'ON_LOAD',
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'aurora',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0E1A',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.auroracommune.app',
      config: {
        facebookAppId: process.env.FACEBOOK_APP_ID || (process.env.NODE_ENV === 'production' ? undefined : '1261010692592854'),
        facebookDisplayName: 'Aurora',
      },
      infoPlist: {
        FacebookAppID: process.env.FACEBOOK_APP_ID || (process.env.NODE_ENV === 'production' ? undefined : '1261010692592854'),
        FacebookDisplayName: 'Aurora',
        FacebookAutoLogAppEventsEnabled: true, // Enable automatic app event logging (required for test events)
        // CFBundleURLTypes for Facebook URL scheme (required for SDK deep linking)
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              process.env.FACEBOOK_APP_ID ? `fb${process.env.FACEBOOK_APP_ID}` : 'fb1261010692592854',
            ],
          },
        ],
        LSApplicationQueriesSchemes: ['fbapi', 'fb-messenger-share-api', 'fbauth2', 'fbshareextension'],
        ITSAppUsesNonExemptEncryption: false,
        NSUserTrackingUsageDescription: 'We use your data to improve your experience and provide personalized mental health support. Your privacy is important to us.',
        CFBundleDevelopmentRegion: 'en', // Force English locale for native components
        CFBundleLocalizations: ['en'], // Only allow English locale
        // Client Token is REQUIRED for events to transmit - ensure it's always set
        FacebookClientToken: process.env.FACEBOOK_CLIENT_TOKEN || 'b1aa7924c3706f5ade68c995488318ab',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0E1A',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'pan',
      package: 'com.auroracommune.app',
      config: {
        facebookAppId: process.env.FACEBOOK_APP_ID || (process.env.NODE_ENV === 'production' ? undefined : '1261010692592854'),
        facebookDisplayName: 'Aurora',
      },
      permissions: [],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      // Viewport settings for proper scaling on iPad/web
      meta: {
        viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
      },
      // Security headers for web
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-updates', // Required for OTA updates
      'expo-tracking-transparency', // Required for iOS App Tracking Transparency
      'expo-localization', // Required for locale detection
      // Note: Metro config replaces this module with stub for non-iOS platforms to prevent bundling errors
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#60A5FA',
          sounds: [],
        },
      ],
      [
        'react-native-fbsdk-next',
        (() => {
        const facebookAppId = process.env.FACEBOOK_APP_ID || (process.env.NODE_ENV === 'production' ? undefined : '1261010692592854');
        // Client Token with fallback - REQUIRED for events to transmit
        const facebookClientToken = process.env.FACEBOOK_CLIENT_TOKEN || 'b1aa7924c3706f5ade68c995488318ab';
        
        if (!facebookAppId && process.env.NODE_ENV === 'production') {
          console.warn('⚠️  FACEBOOK_APP_ID not set in production. Facebook login will not work.');
        }
        
        if (!process.env.FACEBOOK_CLIENT_TOKEN) {
          console.warn('⚠️  FACEBOOK_CLIENT_TOKEN not in env, using fallback token. For production, set it in Railway/EAS env vars.');
        }
        
        const config = {
          appID: facebookAppId || '1261010692592854',
          displayName: 'Aurora',
          scheme: facebookAppId ? `fb${facebookAppId}` : 'fb1261010692592854',
          // Client Token is REQUIRED for events to transmit to Facebook servers
          clientToken: facebookClientToken,
          // Critical settings for Facebook SDK to work correctly
          advertiserIDCollectionEnabled: true,
          autoLogAppEventsEnabled: true,
          // We initialize the SDK manually in JS via Settings.initializeSDK()
          // so auto init must be disabled to avoid double init.
          isAutoInitEnabled: false,
        };
        
        return config;
        })(),
      ],
      require('./plugins/withAndroidLocale'),
      require('./plugins/withAndroidFacebookAutoLog'),
      require('./plugins/withIOSFacebookAppDelegate'),
      require('./plugins/withIOSFacebookClientToken'),
    ],
    extra: {
      // Expo Project ID for push notifications and EAS
      eas: {
        projectId: '3e76b1de-69b1-45db-ab68-c957d25e4002',
      },
      // Backend API URL
      // - For PRODUCTION: Set API_URL in .env to your Railway/Render URL (e.g., 'https://aurora-production.up.railway.app/api')
      // - For DEVELOPMENT: Leave as localhost (or set API_HOST for physical device testing)
      // IMPORTANT: In production builds, API_URL MUST be set to a production URL, not localhost!
      API_URL: process.env.API_URL || (process.env.NODE_ENV === 'production' 
        ? 'https://aurora-production.up.railway.app/api' 
        : 'http://localhost:3000/api'),
      // For local physical device testing, set your computer's IP (e.g., '192.168.1.100')
      // Only used in development mode when API_URL contains localhost
      API_HOST: process.env.API_HOST || null,
      // NOTE: OpenAI API Key is NOT exposed in frontend - all AI calls go through backend
      // Railway proxy URL for OpenAI Realtime API (voice)
      PROXY_URL: process.env.PROXY_URL || 'wss://aurora-production.up.railway.app',
      // For local physical device testing, set your computer's IP (e.g., '192.168.1.100')
      PROXY_HOST: process.env.PROXY_HOST || null,
      // PostHog Analytics
      // Prefer EXPO_PUBLIC_POSTHOG_API_KEY (recommended by PostHog) but keep POSTHOG_API_KEY for backwards compatibility
      EXPO_PUBLIC_POSTHOG_API_KEY:
        process.env.EXPO_PUBLIC_POSTHOG_API_KEY ||
        process.env.POSTHOG_API_KEY ||
        'phc_6BMEJjnxrz3BAfLj8Y1N0lOizGAhnk1d9XNp3Tl2HRB',
      POSTHOG_API_KEY:
        process.env.POSTHOG_API_KEY ||
        process.env.EXPO_PUBLIC_POSTHOG_API_KEY ||
        'phc_6BMEJjnxrz3BAfLj8Y1N0lOizGAhnk1d9XNp3Tl2HRB',
      POSTHOG_HOST: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
    },
  },
};
