const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure resolver to use stub for expo-tracking-transparency in non-iOS environments
// This prevents Metro from trying to bundle the native module during development/web builds
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Replace expo-tracking-transparency with stub for non-iOS platforms
  if (moduleName === 'expo-tracking-transparency' && platform !== 'ios') {
    return {
      filePath: path.resolve(__dirname, 'src/services/trackingTransparency.stub.ts'),
      type: 'sourceFile',
    };
  }
  // Use default resolution for all other modules
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
