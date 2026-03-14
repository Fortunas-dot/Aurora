const { withAppDelegate } = require('@expo/config-plugins');

/**
 * Expo config plugin to ensure Facebook SDK is properly initialized in AppDelegate
 * This ensures the SDK is initialized early enough for test events to work
 */
module.exports = function withIOSFacebookAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    const appDelegate = config.modResults.contents;

    // Check if Facebook SDK initialization is already present
    if (appDelegate.includes('FBSDKCoreKit') || appDelegate.includes('ApplicationDelegate')) {
      console.log('✅ Facebook SDK AppDelegate initialization already present');
      return config;
    }

    // Add import for Facebook SDK
    const importStatement = `#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>`;
    
    // Find the import section (usually after #import <UIKit/UIKit.h>)
    if (appDelegate.includes('#import <UIKit/UIKit.h>')) {
      config.modResults.contents = appDelegate.replace(
        /#import <UIKit\/UIKit\.h>/,
        `#import <UIKit/UIKit.h>\n${importStatement}`
      );
    } else if (appDelegate.includes('#import "AppDelegate.h"')) {
      // Alternative: add after AppDelegate.h import
      config.modResults.contents = appDelegate.replace(
        /#import "AppDelegate\.h"/,
        `#import "AppDelegate.h"\n${importStatement}`
      );
    }

    // Add Facebook SDK initialization in didFinishLaunchingWithOptions
    // Look for the method signature
    const didFinishLaunchingPattern = /- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions\s*\{/;
    
    if (didFinishLaunchingPattern.test(appDelegate)) {
      // Add initialization right after the method starts
      config.modResults.contents = config.modResults.contents.replace(
        didFinishLaunchingPattern,
        (match) => {
          return `${match}\n  // Initialize Facebook SDK early for app events\n  [FBSDKApplicationDelegate.sharedInstance application:application didFinishLaunchingWithOptions:launchOptions];\n`;
        }
      );
    }

    // Also add to scene delegate if present (for iOS 13+)
    if (appDelegate.includes('UISceneDelegate')) {
      const sceneDidConnectPattern = /- \(void\)scene:\(UIScene \*\)scene willConnectToSession:\(UISceneSession \*\)session options:\(UISceneConnectionOptions \*\)connectionOptions\s*\{/;
      
      if (sceneDidConnectPattern.test(config.modResults.contents)) {
        config.modResults.contents = config.modResults.contents.replace(
          sceneDidConnectPattern,
          (match) => {
            return `${match}\n  // Initialize Facebook SDK for scene-based apps\n  if (connectionOptions.URLContexts.count > 0) {\n    NSURL *url = connectionOptions.URLContexts.allObjects.firstObject.URL;\n    [FBSDKApplicationDelegate.sharedInstance application:[UIApplication sharedApplication] openURL:url sourceApplication:nil annotation:nil];\n  }\n`;
          }
        );
      }
    }

    return config;
  });
};
