const { withDangerousMod, withXcodeProject, withAppDelegate } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin for TikTok Business SDK (iOS)
 *
 * Per TikTok Business API docs:
 *   https://business-api.tiktok.com/portal/docs?id=1739585432134657
 *
 * What this does:
 *  1. Adds `pod 'TikTokBusinessSDK'` to the generated Podfile
 *  2. Appends -ObjC and -lc++ to OTHER_LDFLAGS in Xcode (required by SDK)
 *  3. Injects SDK initialization into AppDelegate (didFinishLaunchingWithOptions)
 *
 * Credentials:
 *   appId      → your TikTok for Business App ID  (safe to ship in binary)
 *   tiktokAppId → your TikTok App ID               (safe to ship in binary)
 *   appSecret  → NEVER put in the mobile app;
 *                use it only in your backend for Events API server-to-server calls.
 *
 * NSUserTrackingUsageDescription is already declared in app.config.js infoPlist,
 * and expo-tracking-transparency is already in the plugins list, so ATT is covered.
 */

// ─── Constants ───────────────────────────────────────────────────────────────
const TIKTOK_APP_ID     = '6758727961';
const TIKTOK_TIKTOK_APP_ID = '7620071833756237841';

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

      // Insert the pod right before `use_expo_modules!` (always present in
      // Expo-generated Podfiles).
      if (contents.includes('use_expo_modules!')) {
        contents = contents.replace(
          'use_expo_modules!',
          `pod 'TikTokBusinessSDK'\n  use_expo_modules!`
        );
      } else if (contents.includes('use_native_modules!')) {
        contents = contents.replace(
          'use_native_modules!',
          `pod 'TikTokBusinessSDK'\n  use_native_modules!`
        );
      } else {
        contents = contents.replace(
          /^(\s+)(end\s*)$/m,
          `$1pod 'TikTokBusinessSDK'\n$1$2`
        );
      }

      fs.writeFileSync(podfilePath, contents);
      console.log("✅ Added pod 'TikTokBusinessSDK' to Podfile");
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
      if (!buildSettings.PRODUCT_NAME) return;

      let flags = buildSettings.OTHER_LDFLAGS;
      if (!flags) {
        flags = ['$(inherited)'];
      } else if (!Array.isArray(flags)) {
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

// ─── 3. AppDelegate initialization ──────────────────────────────────────────
function withTikTokAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    let appDelegate = config.modResults.contents;

    // ── Guard: skip if already initialized ──────────────────────────────────
    if (appDelegate.includes('TikTokBusiness') || appDelegate.includes('TikTokConfig')) {
      console.log('✅ TikTok SDK AppDelegate initialization already present');
      return config;
    }

    // ── Add import ───────────────────────────────────────────────────────────
    const tiktokImport = `#import <TikTokBusinessSDK/TikTokBusiness.h>`;

    if (appDelegate.includes('#import <UIKit/UIKit.h>')) {
      appDelegate = appDelegate.replace(
        '#import <UIKit/UIKit.h>',
        `#import <UIKit/UIKit.h>\n${tiktokImport}`
      );
    } else if (appDelegate.includes('#import "AppDelegate.h"')) {
      appDelegate = appDelegate.replace(
        '#import "AppDelegate.h"',
        `#import "AppDelegate.h"\n${tiktokImport}`
      );
    } else {
      // Prepend to file if no known import anchor found
      appDelegate = `${tiktokImport}\n${appDelegate}`;
    }

    // ── Add initialization in didFinishLaunchingWithOptions ─────────────────
    const initCode = `
  // ── TikTok Business SDK initialization ──────────────────────────────────
  TikTokConfig *tiktokConfig = [[TikTokConfig alloc]
    initWithAppId:@"${TIKTOK_APP_ID}"
    tiktokAppId:@"${TIKTOK_TIKTOK_APP_ID}"];
  [TikTokBusiness initializeSdk:tiktokConfig];
  // ────────────────────────────────────────────────────────────────────────
`;

    // Match both Swift-template style and classic ObjC style
    const didFinishPattern =
      /(-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\)\s*\w+\s+didFinishLaunchingWithOptions:\s*\(NSDictionary\s*\*\)\s*\w+\s*\{)/;

    if (didFinishPattern.test(appDelegate)) {
      appDelegate = appDelegate.replace(didFinishPattern, (match) => {
        return `${match}${initCode}`;
      });
      console.log('✅ TikTok SDK initialization injected into AppDelegate');
    } else {
      console.warn(
        '⚠️  Could not locate didFinishLaunchingWithOptions in AppDelegate – ' +
        'TikTok SDK init code was NOT injected. You may need to add it manually.'
      );
    }

    config.modResults.contents = appDelegate;
    return config;
  });
}

// ─── Combined plugin ─────────────────────────────────────────────────────────
module.exports = function withTikTokSDK(config) {
  config = withTikTokPodfile(config);
  config = withTikTokLinkerFlags(config);
  config = withTikTokAppDelegate(config);
  return config;
};
