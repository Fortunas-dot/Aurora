const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to enable Facebook AutoLogAppEventsEnabled for Android
 * This ensures automatic app event logging is enabled (required for test events)
 */
module.exports = function withAndroidFacebookAutoLog(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // Find or create the <application> tag
    if (androidManifest.application && androidManifest.application.length > 0) {
      const application = androidManifest.application[0];
      
      // Ensure application has meta-data array
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }

      // Check if AutoLogAppEventsEnabled meta-data already exists
      const existingAutoLog = application['meta-data'].find(
        (meta) =>
          meta.$ &&
          meta.$['android:name'] === 'com.facebook.sdk.AutoLogAppEventsEnabled'
      );

      // Add or update the AutoLogAppEventsEnabled meta-data
      if (!existingAutoLog) {
        application['meta-data'].push({
          $: {
            'android:name': 'com.facebook.sdk.AutoLogAppEventsEnabled',
            'android:value': 'true',
          },
        });
      } else {
        // Update existing entry to ensure it's true
        existingAutoLog.$['android:value'] = 'true';
      }

      // Add AutoInitEnabled for Android (required for early SDK initialization)
      const existingAutoInit = application['meta-data'].find(
        (meta) =>
          meta.$ &&
          meta.$['android:name'] === 'com.facebook.sdk.AutoInitEnabled'
      );

      if (!existingAutoInit) {
        application['meta-data'].push({
          $: {
            'android:name': 'com.facebook.sdk.AutoInitEnabled',
            'android:value': 'true',
          },
        });
      } else {
        existingAutoInit.$['android:value'] = 'true';
      }
    }

    return config;
  });
};
