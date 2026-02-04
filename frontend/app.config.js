require('dotenv').config();

module.exports = {
  expo: {
    name: 'Aurora',
    slug: 'aurora',
    owner: 'Fortunas',
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
    },
    web: {
      favicon: './assets/favicon.png',
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
    ],
    extra: {
      // Expo Project ID for push notifications and EAS
      // Temporarily commented out to recreate project under Fortunas organization
      // eas: {
      //   projectId: 'db4cf440-87fa-4d7e-96dd-e018c9bf743e',
      // },
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
    },
  },
};
