require('dotenv').config();

module.exports = {
  expo: {
    name: 'Aurora',
    slug: 'aurora',
    owner: 'pawbuddies',
    version: '1.0.0',
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
        LSApplicationQueriesSchemes: ['fbapi', 'fb-messenger-share-api', 'fbauth2', 'fbshareextension'],
        ITSAppUsesNonExemptEncryption: false,
        ...(process.env.FACEBOOK_CLIENT_TOKEN ? { FacebookClientToken: process.env.FACEBOOK_CLIENT_TOKEN } : {}),
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0E1A',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'resize',
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
        if (!facebookAppId && process.env.NODE_ENV === 'production') {
          console.warn('⚠️  FACEBOOK_APP_ID not set in production. Facebook login will not work.');
        }
        const config = {
          appID: facebookAppId || '1261010692592854',
          displayName: 'Aurora',
          scheme: facebookAppId ? `fb${facebookAppId}` : 'fb1261010692592854',
        };
          // Client Token is optional - only add if you have it
          if (process.env.FACEBOOK_CLIENT_TOKEN) {
            config.clientToken = process.env.FACEBOOK_CLIENT_TOKEN;
          }
          return config;
        })(),
      ],
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
      // OpenAI API Key
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      // Railway proxy URL for OpenAI Realtime API
      PROXY_URL: process.env.PROXY_URL || 'wss://aurora-production.up.railway.app',
      // For local physical device testing, set your computer's IP (e.g., '192.168.1.100')
      PROXY_HOST: process.env.PROXY_HOST || null,
      // PostHog Analytics
      POSTHOG_API_KEY: process.env.POSTHOG_API_KEY || null,
      POSTHOG_HOST: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
    },
  },
};
