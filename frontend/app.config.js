require('dotenv').config();

module.exports = {
  expo: {
    name: 'Aurora',
    slug: 'aurora',
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
      bundleIdentifier: 'com.aurora.app',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'We need access to your photo library to let you share images in posts.',
        NSPhotoLibraryAddUsageDescription: 'We need access to save images to your photo library.',
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
      package: 'com.aurora.app',
      permissions: [
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
        'READ_MEDIA_VIDEO',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission: 'The app accesses your photos to let you share them in posts.',
          cameraPermission: 'The app accesses your camera to let you take photos for posts.',
        },
      ],
    ],
    extra: {
      // Backend API URL (Railway)
      API_URL: process.env.API_URL || 'https://aurora-production.up.railway.app/api',
      // OpenAI API Key
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      // Railway proxy URL for OpenAI Realtime API
      PROXY_URL: process.env.PROXY_URL || 'wss://aurora-production.up.railway.app',
      // For local physical device testing, set your computer's IP (e.g., '192.168.1.100')
      PROXY_HOST: process.env.PROXY_HOST || null,
      // Note: PersonaPlex now connects via backend API (no direct config needed)
    },
  },
};
