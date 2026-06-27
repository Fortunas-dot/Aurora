const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to enable `:modular_headers => true` for the Google pods
 * that AppCheckCore (pulled in via @react-native-google-signin/google-signin)
 * depends on but which do not ship their own module maps.
 *
 * Without this, `pod install` fails on the New Architecture / static libraries:
 *   "The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and
 *    `RecaptchaInterop`, which do not define modules."
 *
 * We inject explicit pod declarations with modular headers at the top of the
 * app target so they take effect for the whole dependency graph.
 */
const PODS_NEEDING_MODULAR_HEADERS = ['GoogleUtilities', 'RecaptchaInterop'];

module.exports = function withIOSModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      const lines = PODS_NEEDING_MODULAR_HEADERS.map(
        (pod) => `  pod '${pod}', :modular_headers => true`
      );

      // Skip if already injected (idempotent across prebuilds).
      if (contents.includes(lines[0])) {
        return config;
      }

      // Insert right after the main `target '...' do` line.
      const targetRegex = /(target\s+['"][^'"]+['"]\s+do\s*\n)/;
      if (targetRegex.test(contents)) {
        contents = contents.replace(targetRegex, `$1${lines.join('\n')}\n`);
        console.log('🔧 [Plugin] Added modular headers for:', PODS_NEEDING_MODULAR_HEADERS.join(', '));
      } else {
        console.warn('⚠️  [Plugin] Could not find app target in Podfile to inject modular headers');
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
