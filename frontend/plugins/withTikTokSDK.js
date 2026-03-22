const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin for TikTok Business SDK (iOS)
 *
 * What this does:
 *  1. Adds `pod 'TikTokBusinessSDK'` to the generated Podfile
 *  2. Appends `-ObjC` and `-lc++` to OTHER_LDFLAGS in the Xcode project
 *     (required by TikTok's SDK build settings)
 *
 * NSUserTrackingUsageDescription is already declared in app.config.js infoPlist,
 * and expo-tracking-transparency is already in the plugins list, so ATT is covered.
 */

// ─── 1. Podfile modification ────────────────────────────────────────────────
function withTikTokPodfile(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn('⚠️  Podfile not found – skipping TikTokBusinessSDK pod');
        return config;
      }

      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (contents.includes('TikTokBusinessSDK')) {
        console.log('✅ TikTokBusinessSDK already present in Podfile');
        return config;
      }

      // Insert the pod right before `use_expo_modules!` which is present in
      // every Expo-generated Podfile.
      if (contents.includes('use_expo_modules!')) {
        contents = contents.replace(
          'use_expo_modules!',
          `pod 'TikTokBusinessSDK'\n  use_expo_modules!`
        );
      } else if (contents.includes('use_native_modules!')) {
        // Fallback for older Expo templates
        contents = contents.replace(
          'use_native_modules!',
          `pod 'TikTokBusinessSDK'\n  use_native_modules!`
        );
      } else {
        // Last-resort: insert before the closing `end` of the first target block
        contents = contents.replace(
          /^(\s+)(end\s*)$/m,
          `$1pod 'TikTokBusinessSDK'\n$1$2`
        );
      }

      fs.writeFileSync(podfilePath, contents);
      console.log('✅ Added pod \'TikTokBusinessSDK\' to Podfile');
      return config;
    },
  ]);
}

// ─── 2. Xcode linker flags ──────────────────────────────────────────────────
function withTikTokLinkerFlags(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();

    Object.keys(configurations).forEach((key) => {
      const buildSettings = configurations[key]?.buildSettings;
      if (!buildSettings) return;

      // Skip config sections that have no PRODUCT_NAME (e.g. file references)
      if (!buildSettings.PRODUCT_NAME) return;

      let flags = buildSettings.OTHER_LDFLAGS;

      // Normalise to array
      if (!flags) {
        flags = ['$(inherited)'];
      } else if (!Array.isArray(flags)) {
        // Could be a quoted string like '"$(inherited)"'
        flags = [String(flags)];
      }

      const joined = flags.join(' ');
      if (!joined.includes('-ObjC')) flags.push('-ObjC');
      if (!joined.includes('-lc++')) flags.push('-lc++');

      buildSettings.OTHER_LDFLAGS = flags;
    });

    console.log('✅ Added -ObjC and -lc++ to Xcode OTHER_LDFLAGS for TikTok SDK');
    return config;
  });
}

// ─── Combined plugin ─────────────────────────────────────────────────────────
module.exports = function withTikTokSDK(config) {
  config = withTikTokPodfile(config);
  config = withTikTokLinkerFlags(config);
  return config;
};
