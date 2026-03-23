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
 *  3. Creates a bridging header so ObjC TikTok SDK is usable from Swift AppDelegate
 *  4. Injects SDK initialization into AppDelegate (didFinishLaunchingWithOptions)
 *  5. Writes TikTokEventModule.h/.m and registers them in Xcode (React Native bridge)
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
const TIKTOK_APP_ID        = '6758727961';
const TIKTOK_TIKTOK_APP_ID = '7620071833756237841';

// ─── Native module source files ───────────────────────────────────────────────
const HEADER_CONTENT = `\
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface TikTokEventModule : NSObject <RCTBridgeModule>
@end

NS_ASSUME_NONNULL_END
`;

const SOURCE_CONTENT = `\
#import "TikTokEventModule.h"
#import <TikTokBusinessSDK/TikTokBusiness.h>

@implementation TikTokEventModule

RCT_EXPORT_MODULE(TikTokEvents);

// Identify user (link internal ID to TikTok user)
RCT_EXPORT_METHOD(identify:(NSString *)externalId
                  externalUserName:(NSString *)externalUserName
                  phoneNumber:(NSString *)phoneNumber
                  email:(NSString *)email)
{
  [TikTokBusiness identifyWithExternalID:externalId
                         externalUserName:externalUserName
                             phoneNumber:phoneNumber
                                   email:email];
}

// Clear user identity on logout
RCT_EXPORT_METHOD(logout)
{
  [TikTokBusiness logout];
}

// Track a simple named event (Registration, Login, Subscribe, etc.)
RCT_EXPORT_METHOD(trackEvent:(NSString *)eventName)
{
  TikTokBaseEvent *event = [TikTokBaseEvent eventWithName:eventName];
  [TikTokBusiness trackTTEvent:event];
}

// Track a purchase event
// Uses TikTokBaseEvent with "PlaceAnOrder" to avoid specialized-class
// availability issues across SDK versions (TikTokPurchaseEvent /
// TikTokContentsEvent / TikTokContentParams are not guaranteed to be
// exposed through the main TikTokBusiness.h umbrella header).
RCT_EXPORT_METHOD(trackPurchase:(NSDictionary *)params)
{
  NSString *eventName = params[@"eventName"] ?: @"PlaceAnOrder";
  TikTokBaseEvent *event = [TikTokBaseEvent eventWithName:eventName];
  [TikTokBusiness trackTTEvent:event];
}

@end
`;

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

// ─── 3. Bridging header (makes ObjC TikTok SDK available in Swift) ──────────
function withTikTokBridgingHeader(config) {
  // Step A: write the bridging header file
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const iosDir      = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName;
      const targetDir   = path.join(iosDir, projectName);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const bridgingHeaderPath = path.join(targetDir, `${projectName}-Bridging-Header.h`);

      const bridgingHeaderContent = `\
//
//  ${projectName}-Bridging-Header.h
//  Auto-generated by withTikTokSDK Expo plugin
//
//  Exposes Objective-C TikTok Business SDK headers to Swift.
//

#import <TikTokBusinessSDK/TikTokBusiness.h>
`;

      // Only write if not already present (or if TikTok import is missing)
      if (
        !fs.existsSync(bridgingHeaderPath) ||
        !fs.readFileSync(bridgingHeaderPath, 'utf8').includes('TikTokBusiness')
      ) {
        // If the file already exists (from Expo), append the import instead of overwriting
        if (fs.existsSync(bridgingHeaderPath)) {
          const existing = fs.readFileSync(bridgingHeaderPath, 'utf8');
          if (!existing.includes('TikTokBusiness')) {
            fs.writeFileSync(
              bridgingHeaderPath,
              existing + '\n#import <TikTokBusinessSDK/TikTokBusiness.h>\n',
              'utf8'
            );
            console.log('✅ Appended TikTok import to existing bridging header');
          }
        } else {
          fs.writeFileSync(bridgingHeaderPath, bridgingHeaderContent, 'utf8');
          console.log('✅ Created bridging header at', bridgingHeaderPath);
        }
      } else {
        console.log('✅ Bridging header already contains TikTok import');
      }

      return config;
    },
  ]);

  // Step B: set SWIFT_OBJC_BRIDGING_HEADER build setting in Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectName  = config.modRequest.projectName;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    const bridgingHeaderValue = `"${projectName}/${projectName}-Bridging-Header.h"`;

    Object.keys(configurations).forEach((key) => {
      const buildSettings = configurations[key]?.buildSettings;
      if (!buildSettings) return;
      if (!buildSettings.PRODUCT_NAME) return;

      // Only set if not already configured (or if it's the default empty value)
      const existing = buildSettings.SWIFT_OBJC_BRIDGING_HEADER;
      if (!existing || existing === '""') {
        buildSettings.SWIFT_OBJC_BRIDGING_HEADER = bridgingHeaderValue;
      } else if (!String(existing).includes('Bridging-Header')) {
        // Already has a custom bridging header – don't override it
        console.warn(
          `⚠️  SWIFT_OBJC_BRIDGING_HEADER already set to ${existing}. ` +
          `Add '#import <TikTokBusinessSDK/TikTokBusiness.h>' to that file manually.`
        );
      }
    });

    console.log('✅ Set SWIFT_OBJC_BRIDGING_HEADER in Xcode for TikTok SDK');
    return config;
  });

  return config;
}

// ─── 4. AppDelegate initialization ──────────────────────────────────────────
function withTikTokAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    let appDelegate = config.modResults.contents;

    // ── Guard: skip if already initialized ──────────────────────────────────
    if (appDelegate.includes('TikTokBusiness') || appDelegate.includes('TikTokConfig')) {
      console.log('✅ TikTok SDK AppDelegate initialization already present');
      return config;
    }

    // ── Detect Swift vs Objective-C ─────────────────────────────────────────
    // Expo SDK 50+ may generate AppDelegate.swift; older ones use AppDelegate.mm
    const filePath = config.modResults.path || '';
    const isSwift =
      filePath.endsWith('.swift') ||
      // Fallback: check for Swift-specific syntax in the file content
      /^\s*import\s+UIKit/m.test(appDelegate) ||
      /^\s*func\s+application\(/m.test(appDelegate);

    if (isSwift) {
      // ────────────────────────────────────────────────────────────────────
      // Swift AppDelegate
      // TikTokBusinessSDK is an ObjC framework exposed via bridging header.
      // Do NOT use `import TikTokBusinessSDK` – use the classes directly
      // (they are available via the bridging header set in step 3).
      // ────────────────────────────────────────────────────────────────────

      const initCode = `
    // ── TikTok Business SDK initialization ──────────────────────────────────
    let ttConfig = TikTokConfig(accessToken: nil, appId: "${TIKTOK_APP_ID}", tiktokAppId: "${TIKTOK_TIKTOK_APP_ID}")
    TikTokBusiness.initializeSdk(ttConfig)
    // ────────────────────────────────────────────────────────────────────────
`;

      // Match Swift's didFinishLaunchingWithOptions signature
      const swiftDidFinishPattern =
        /func\s+application\s*\(\s*_\s+application\s*:\s*UIApplication\s*,\s*didFinishLaunchingWithOptions[^{]*\{/;

      if (swiftDidFinishPattern.test(appDelegate)) {
        appDelegate = appDelegate.replace(swiftDidFinishPattern, (match) => `${match}${initCode}`);
        console.log('✅ TikTok SDK initialization injected into Swift AppDelegate (via bridging header)');
      } else {
        console.warn(
          '⚠️  Could not locate didFinishLaunchingWithOptions in Swift AppDelegate – ' +
          'TikTok SDK init code was NOT injected. You may need to add it manually.'
        );
      }
    } else {
      // ────────────────────────────────────────────────────────────────────
      // Objective-C AppDelegate (.m / .mm)
      // ────────────────────────────────────────────────────────────────────
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

      const initCode = `
  // ── TikTok Business SDK initialization ──────────────────────────────────
  TikTokConfig *tiktokConfig = [[TikTokConfig alloc]
    initWithAccessToken:nil
    appId:@"${TIKTOK_APP_ID}"
    tiktokAppId:@"${TIKTOK_TIKTOK_APP_ID}"];
  [TikTokBusiness initializeSdk:tiktokConfig];
  // ────────────────────────────────────────────────────────────────────────
`;

      const objcDidFinishPattern =
        /(-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\)\s*\w+\s+didFinishLaunchingWithOptions:\s*\(NSDictionary\s*\*\)\s*\w+\s*\{)/;

      if (objcDidFinishPattern.test(appDelegate)) {
        appDelegate = appDelegate.replace(objcDidFinishPattern, (match) => `${match}${initCode}`);
        console.log('✅ TikTok SDK initialization injected into ObjC AppDelegate');
      } else {
        console.warn(
          '⚠️  Could not locate didFinishLaunchingWithOptions in ObjC AppDelegate – ' +
          'TikTok SDK init code was NOT injected. You may need to add it manually.'
        );
      }
    }

    config.modResults.contents = appDelegate;
    return config;
  });
}

// ─── 5. Native module: TikTokEventModule (.h + .m) ──────────────────────────
function withTikTokNativeModule(config) {
  // Step A: write the source files into ios/<projectName>/
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const iosDir     = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName;
      const targetDir  = path.join(iosDir, projectName);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const headerPath = path.join(targetDir, 'TikTokEventModule.h');
      const sourcePath = path.join(targetDir, 'TikTokEventModule.m');

      fs.writeFileSync(headerPath, HEADER_CONTENT, 'utf8');
      fs.writeFileSync(sourcePath, SOURCE_CONTENT, 'utf8');
      console.log('✅ TikTokEventModule.h/.m written to', targetDir);
      return config;
    },
  ]);

  // Step B: register the files in the Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectName  = config.modRequest.projectName;

    // Guard: skip if already registered
    const fileRefs = xcodeProject.pbxFileReferenceSection();
    const alreadyAdded = Object.values(fileRefs).some(
      (ref) => ref && ref.path && String(ref.path).includes('TikTokEventModule')
    );
    if (alreadyAdded) {
      console.log('✅ TikTokEventModule already registered in Xcode project');
      return config;
    }

    const target   = xcodeProject.getFirstTarget().uuid;
    const groupKey = xcodeProject.findPBXGroupKey({ name: projectName });

    // Add .m to Sources build phase
    xcodeProject.addSourceFile(
      `${projectName}/TikTokEventModule.m`,
      { target },
      groupKey
    );
    // Add .h as a header reference (no build phase needed)
    xcodeProject.addFile(
      `${projectName}/TikTokEventModule.h`,
      groupKey,
      {
        lastKnownFileType: 'sourcecode.c.h',
        sourceTree: '"<group>"',
      }
    );

    console.log('✅ TikTokEventModule registered in Xcode project');
    return config;
  });

  return config;
}

// ─── Combined plugin ─────────────────────────────────────────────────────────
module.exports = function withTikTokSDK(config) {
  config = withTikTokPodfile(config);
  config = withTikTokLinkerFlags(config);
  config = withTikTokBridgingHeader(config);   // ← new: bridging header step
  config = withTikTokAppDelegate(config);
  config = withTikTokNativeModule(config);
  return config;
};
