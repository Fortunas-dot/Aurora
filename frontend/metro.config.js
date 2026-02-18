const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Improve hot reload stability
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

// Improve watchman stability
config.watchFolders = [path.resolve(__dirname)];

// Configure resolver to use stub for expo-tracking-transparency in non-iOS environments
// This prevents Metro from trying to bundle the native module during development/web builds

// Add extraNodeModules to map expo-tracking-transparency to our stub for non-iOS
if (!config.resolver.extraNodeModules) {
  config.resolver.extraNodeModules = {};
}

// Store original resolveRequest
const originalResolveRequest = config.resolver.resolveRequest;

// Override resolveRequest to replace module with stub for non-iOS platforms
config.resolver.resolveRequest = (context, moduleName, platform, modulePath) => {
  // Replace expo-tracking-transparency with stub for non-iOS platforms
  if (moduleName === 'expo-tracking-transparency' && platform !== 'ios') {
    const stubPath = path.resolve(__dirname, 'src/services/trackingTransparency.stub.js');
    return {
      type: 'sourceFile',
      filePath: stubPath,
    };
  }
  
  // Use default resolution for all other modules
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform, modulePath);
  }
  // Fallback to default Metro resolution
  return context.resolveRequest(context, moduleName, platform, modulePath);
};

module.exports = config;
