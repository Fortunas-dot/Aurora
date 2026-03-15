# Facebook Events Setup — Van A tot Z

## A. Architectuurprincipe

**De native Facebook SDK leest ALLE configuratie uit native bestanden (Info.plist op iOS, AndroidManifest.xml op Android). Geen JavaScript-side configuratie — de SDK doet het werk.**

---

## B. Build-Time Configuratie (Tijdens EAS Build)

### 1. `app.config.js` — Centrale Configuratie

#### iOS Info.plist Configuratie

```javascript
ios: {
  infoPlist: {
    FacebookAppID: process.env.FACEBOOK_APP_ID || '1261010692592854',
    FacebookDisplayName: 'Aurora',
    FacebookAutoLogAppEventsEnabled: true, // Enable automatic app event logging (required for test events)
    // CFBundleURLTypes for Facebook URL scheme (required for SDK deep linking)
    CFBundleURLTypes: [
      {
        CFBundleURLSchemes: [
          process.env.FACEBOOK_APP_ID ? `fb${process.env.FACEBOOK_APP_ID}` : 'fb1261010692592854',
        ],
      },
    ],
    LSApplicationQueriesSchemes: ['fbapi', 'fb-messenger-share-api', 'fbauth2', 'fbshareextension'],
    // Client Token is REQUIRED for events to transmit - ensure it's always set
    FacebookClientToken: process.env.FACEBOOK_CLIENT_TOKEN || 'b1aa7924c3706f5ade68c995488318ab',
  },
}
```

**Wat hier gebeurt:**
- `FacebookAppID`: App ID voor identificatie
- `FacebookClientToken`: **CRITICAL** - Vereist voor event transmissie
- `FacebookAutoLogAppEventsEnabled: true`: Zorgt dat events automatisch worden gelogd
- `CFBundleURLTypes`: URL scheme voor Facebook deep linking

### 2. `react-native-fbsdk-next` Plugin Configuratie

```javascript
[
  'react-native-fbsdk-next',
  {
    appID: facebookAppId || '1261010692592854',
    displayName: 'Aurora',
    scheme: facebookAppId ? `fb${facebookAppId}` : 'fb1261010692592854',
    // Client Token is REQUIRED for events to transmit to Facebook servers
    clientToken: facebookClientToken,
    // Critical settings for Facebook SDK to work correctly
    advertiserIDCollectionEnabled: true,
    autoLogAppEventsEnabled: true,
    isAutoInitEnabled: true,
  },
],
```

**Wat deze plugin doet:**
- Voegt native Facebook SDK toe aan het project
- Configureert App ID, Client Token, en andere instellingen
- Zet `autoLogAppEventsEnabled: true` en `isAutoInitEnabled: true`

### 3. Custom Expo Plugins

#### Plugin 1: `withIOSFacebookClientToken.js`

**Doel:** Garandeert dat `FacebookClientToken` ALTIJD in Info.plist staat (vereist voor event transmissie).

**Wat het doet:**
- Leest `FACEBOOK_CLIENT_TOKEN` uit environment variabelen
- Zet `FacebookClientToken` expliciet in Info.plist
- Overschrijft eventuele verkeerde waarden van andere plugins
- Zorgt dat `FacebookAppID`, `FacebookDisplayName`, en `FacebookAutoLogAppEventsEnabled` ook correct zijn
- Voegt Facebook URL scheme toe als die nog niet bestaat

**Code:**
```javascript
const { withInfoPlist } = require('@expo/config-plugins');

module.exports = function withIOSFacebookClientToken(config) {
  return withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    
    const clientToken = process.env.FACEBOOK_CLIENT_TOKEN || 'b1aa7924c3706f5ade68c995488318ab';
    const appID = process.env.FACEBOOK_APP_ID || '1261010692592854';
    const displayName = 'Aurora';
    
    // CRITICAL: ALWAYS set FacebookClientToken
    infoPlist.FacebookClientToken = clientToken;
    infoPlist.FacebookAppID = appID;
    infoPlist.FacebookDisplayName = displayName;
    infoPlist.FacebookAutoLogAppEventsEnabled = true;
    
    // Ensure URL scheme is set
    if (!infoPlist.CFBundleURLTypes || !Array.isArray(infoPlist.CFBundleURLTypes)) {
      infoPlist.CFBundleURLTypes = [];
    }
    
    const hasFacebookScheme = infoPlist.CFBundleURLTypes.some(
      (urlType) => 
        urlType.CFBundleURLSchemes && 
        Array.isArray(urlType.CFBundleURLSchemes) &&
        urlType.CFBundleURLSchemes.some((scheme) => scheme.startsWith('fb'))
    );
    
    if (!hasFacebookScheme) {
      infoPlist.CFBundleURLTypes.push({
        CFBundleURLSchemes: [`fb${appID}`],
      });
    }
    
    return config;
  });
};
```

#### Plugin 2: `withIOSFacebookAppDelegate.js`

**Doel:** Initialiseert Facebook SDK vroeg in de app lifecycle (in AppDelegate).

**Wat het doet:**
- Voegt `#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>` toe aan AppDelegate
- Voegt Facebook SDK initialisatie toe in `didFinishLaunchingWithOptions`
- Voegt ook initialisatie toe in SceneDelegate (voor iOS 13+)

**Code:**
```javascript
const { withAppDelegate } = require('@expo/config-plugins');

module.exports = function withIOSFacebookAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    const appDelegate = config.modResults.contents;

    // Add import for Facebook SDK
    const importStatement = `#import <FBSDKCoreKit/FBSDKCoreKit-Swift.h>`;
    
    if (appDelegate.includes('#import <UIKit/UIKit.h>')) {
      config.modResults.contents = appDelegate.replace(
        /#import <UIKit\/UIKit\.h>/,
        `#import <UIKit/UIKit.h>\n${importStatement}`
      );
    }

    // Add Facebook SDK initialization in didFinishLaunchingWithOptions
    const didFinishLaunchingPattern = /- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions\s*\{/;
    
    if (didFinishLaunchingPattern.test(appDelegate)) {
      config.modResults.contents = config.modResults.contents.replace(
        didFinishLaunchingPattern,
        (match) => {
          return `${match}\n  // Initialize Facebook SDK early for app events\n  [FBSDKApplicationDelegate.sharedInstance application:application didFinishLaunchingWithOptions:launchOptions];\n`;
        }
      );
    }

    return config;
  });
};
```

#### Plugin 3: `withAndroidFacebookAutoLog.js`

**Doel:** Zet `AutoLogAppEventsEnabled` en `AutoInitEnabled` op `true` in AndroidManifest.xml.

**Wat het doet:**
- Voegt `<meta-data android:name="com.facebook.sdk.AutoLogAppEventsEnabled" android:value="true"/>` toe
- Voegt `<meta-data android:name="com.facebook.sdk.AutoInitEnabled" android:value="true"/>` toe

**Code:**
```javascript
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidFacebookAutoLog(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    if (androidManifest.application && androidManifest.application.length > 0) {
      const application = androidManifest.application[0];
      
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }

      // Add or update AutoLogAppEventsEnabled
      let existingAutoLog = application['meta-data'].find(
        (meta) =>
          meta.$ &&
          meta.$['android:name'] === 'com.facebook.sdk.AutoLogAppEventsEnabled'
      );

      if (!existingAutoLog) {
        application['meta-data'].push({
          $: {
            'android:name': 'com.facebook.sdk.AutoLogAppEventsEnabled',
            'android:value': 'true',
          },
        });
      } else {
        existingAutoLog.$['android:value'] = 'true';
      }

      // Add AutoInitEnabled
      let existingAutoInit = application['meta-data'].find(
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
```

---

## C. Runtime Code (JavaScript/TypeScript)

### 1. Service: `facebookAnalytics.service.ts`

**Belangrijk:** Geen `Settings.setClientToken()` of andere Settings calls. De native SDK leest alles uit Info.plist/AndroidManifest.xml.

#### Initialize Methode

```typescript
async initialize(options?: { trackingAllowed?: boolean }): Promise<void> {
  if (this.initialized) return;

  // Only attempt on real native platforms
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  try {
    // Load native module
    const fb = await import('react-native-fbsdk-next');
    const { AppEventsLogger } = fb;
    this.appEventsLogger = AppEventsLogger;

    // Alleen loggen, GEEN Settings aanpassen
    // Laat de native SDK alles zelf doen via Info.plist
    console.log('📱 FB SDK - Initializing...');

    // Log activate app
    AppEventsLogger.logEvent('fb_mobile_activate_app');
    console.log('📱 FB SDK - activate_app logged');

    // Flush in dev mode for faster test events visibility
    if (__DEV__) {
      AppEventsLogger.flush();
      console.log('📱 FB SDK - flushed');
    }

    this.initialized = true;
  } catch (error: any) {
    if (
      error?.message?.includes('native module') ||
      error?.message?.includes('Cannot find module') ||
      error?.code === 'MODULE_NOT_FOUND'
    ) {
      console.log('⚠️ Facebook SDK not available (likely Expo Go / web), skipping initialization.');
      return;
    }
    console.error('📱 FB SDK - Error:', error);
  }
}
```

#### Event Logging Methode

```typescript
logEvent(eventName: FbEventName, params?: Record<string, any>, valueToSum?: number): void {
  if (!this.initialized || !this.appEventsLogger) {
    return;
  }

  try {
    if (typeof valueToSum === 'number') {
      this.appEventsLogger.logEvent(eventName, valueToSum, params);
    } else {
      this.appEventsLogger.logEvent(eventName, params);
    }
    if (__DEV__) {
      this.appEventsLogger.flush();
    }
    console.log('📱 FB SDK - event:', eventName);
  } catch (error) {
    console.error('📱 FB SDK - event error:', error);
  }
}
```

#### Helper Methods

- `logScreenView(screenName: string)` — Logt screen views
- `logSignup(method: string)` — Logt user signups
- `logLogin(method: string)` — Logt user logins
- `logLogout()` — Logt user logouts
- `logSubscriptionPurchased(planId, price, currency)` — Logt in-app purchases
- `logSubscriptionCancelled(planId, reason?)` — Logt cancellations
- `flushEvents()` — Force flush alle pending events

### 2. Initialisatie in `_layout.tsx`

```typescript
// Request App Tracking Transparency permission (iOS only)
let trackingAllowed: boolean = true;
try {
  trackingAllowed = await Promise.race([
    trackingTransparencyService.requestPermission(),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(true), 1000);
    }),
  ]);
} catch (error) {
  // Handle gracefully
}

// Initialize Facebook SDK
initializeFacebookSDK({ trackingAllowed }).catch((error) => {
  console.warn('Facebook SDK initialization failed:', error);
});
```

#### Screen Tracking

```typescript
// Track screen views in Facebook
useEffect(() => {
  if (!pathname) return;
  const screenName = pathname.replace(/^\//, '') || 'home';
  facebookAnalytics.logScreenView(screenName);
}, [pathname]);
```

---

## D. Flow: Van Build Tot Event

### Stap 1: EAS Build Starten

```bash
eas build --profile development --platform ios
```

### Stap 2: Expo Config Plugins Draaien

1. **`react-native-fbsdk-next` plugin:**
   - Voegt native Facebook SDK toe
   - Configureert basis instellingen

2. **`withIOSFacebookClientToken.js`:**
   - Zet `FacebookClientToken` in Info.plist
   - Zet `FacebookAppID`, `FacebookDisplayName`, `FacebookAutoLogAppEventsEnabled`
   - Voegt URL scheme toe

3. **`withIOSFacebookAppDelegate.js`:**
   - Voegt Facebook SDK initialisatie toe aan AppDelegate

4. **`withAndroidFacebookAutoLog.js`:**
   - Zet `AutoLogAppEventsEnabled` en `AutoInitEnabled` in AndroidManifest.xml

### Stap 3: Native Build

**iOS Info.plist bevat:**
```xml
<key>FacebookAppID</key>
<string>1261010692592854</string>
<key>FacebookClientToken</key>
<string>b1aa7924c3706f5ade68c995488318ab</string>
<key>FacebookAutoLogAppEventsEnabled</key>
<true/>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fb1261010692592854</string>
    </array>
  </dict>
</array>
```

**Android AndroidManifest.xml bevat:**
```xml
<meta-data android:name="com.facebook.sdk.AutoLogAppEventsEnabled" android:value="true"/>
<meta-data android:name="com.facebook.sdk.AutoInitEnabled" android:value="true"/>
```

### Stap 4: App Start

1. **Native SDK initialiseert automatisch** (via AppDelegate/AndroidManifest)
2. **SDK leest configuratie** uit Info.plist/AndroidManifest.xml
3. **`_layout.tsx` roept `initializeFacebookSDK()` aan**
4. **Service logt `fb_mobile_activate_app`**
5. **Events worden naar Facebook servers gestuurd**

### Stap 5: Event Logging Tijdens Gebruik

- Gebruiker navigeert → `logScreenView()` wordt aangeroepen
- Gebruiker logt in → `logLogin()` wordt aangeroepen
- Etc.

---

## E. Belangrijke Punten

### ✅ Wat WEL Werkt

- ✅ **Native configuratie** via Info.plist/AndroidManifest.xml
- ✅ **Client Token** staat in native build
- ✅ **Auto-logging** is ingeschakeld
- ✅ **SDK initialiseert vroeg** in lifecycle
- ✅ **Geen JS-side Settings manipulatie**

### ❌ Wat NIET Meer Gebeurt

- ❌ Geen `Settings.setClientToken()` calls
- ❌ Geen `Settings.setAppID()` calls
- ❌ Geen programmatische Settings aanpassingen
- ❌ Geen handmatige API tests
- ❌ Geen uitgebreide debugging code

---

## F. Testen

1. **Maak nieuwe EAS build:**
   ```bash
   eas build --profile development --platform ios
   ```

2. **Installeer build op test device**

3. **Open app en gebruik het**

4. **Check Facebook Events Manager → Test Events tab**

5. **Events zouden binnen 10-30 seconden moeten verschijnen** (in dev mode met flush)

---

## G. Environment Variabelen

### Lokaal (`.env`)

```env
FACEBOOK_APP_ID=1261010692592854
FACEBOOK_CLIENT_TOKEN=b1aa7924c3706f5ade68c995488318ab
```

### Production (Railway/EAS)

Zet deze variabelen in:
- **Railway:** Project Settings → Variables
- **EAS:** `eas secret:create --scope project --name FACEBOOK_APP_ID --value 1261010692592854`
- **EAS:** `eas secret:create --scope project --name FACEBOOK_CLIENT_TOKEN --value b1aa7924c3706f5ade68c995488318ab`

---

## H. Troubleshooting

### Events verschijnen niet in Facebook Events Manager

1. **Check of Client Token in native build staat:**
   - Open `ios/Aurora/Info.plist` na `expo prebuild`
   - Zoek naar `FacebookClientToken`
   - Moet `b1aa7924c3706f5ade68c995488318ab` zijn

2. **Check of App ID correct is:**
   - Facebook Events Manager → Settings → App ID moet `1261010692592854` zijn

3. **Check of test device is toegevoegd:**
   - Facebook Events Manager → Test Events → Add Test Device
   - Voeg je device ID toe

4. **Check console logs:**
   - Zoek naar `📱 FB SDK - event:` logs
   - Als je deze ziet, worden events gelogd
   - Als je ze niet ziet, is SDK niet geïnitialiseerd

5. **Maak nieuwe build:**
   - OTA updates werken niet voor native configuratie
   - Je MOET een nieuwe EAS build maken

### SDK initialiseert niet

1. **Check of native module beschikbaar is:**
   - Alleen in native builds (niet Expo Go)
   - Check console voor `⚠️ Facebook SDK not available`

2. **Check AppDelegate:**
   - Open `ios/Aurora/AppDelegate.m` (na prebuild)
   - Zoek naar `FBSDKApplicationDelegate`
   - Moet aanwezig zijn

3. **Check Info.plist:**
   - Open `ios/Aurora/Info.plist`
   - Zoek naar `FacebookAppID` en `FacebookClientToken`
   - Moeten beide aanwezig zijn

---

## I. Bestanden Overzicht

### Configuratie Bestanden

- `frontend/app.config.js` — Centrale Expo configuratie
- `frontend/.env` — Lokale environment variabelen

### Plugin Bestanden

- `frontend/plugins/withIOSFacebookClientToken.js` — iOS Client Token plugin
- `frontend/plugins/withIOSFacebookAppDelegate.js` — iOS AppDelegate plugin
- `frontend/plugins/withAndroidFacebookAutoLog.js` — Android AutoLog plugin

### Service Bestanden

- `frontend/src/services/facebookAnalytics.service.ts` — Facebook Analytics service
- `frontend/app/_layout.tsx` — App initialisatie en screen tracking

---

## J. Samenvatting

**De setup is nu volledig vereenvoudigd:**

1. **Build-time:** Configuratie via `app.config.js` en custom plugins
2. **Native:** SDK leest alles uit Info.plist/AndroidManifest.xml
3. **Runtime:** Alleen `AppEventsLogger.logEvent()` gebruiken
4. **Geen JS-side configuratie** — native SDK doet het werk

**De setup volgt nu de aanbevolen aanpak van Meta: native configuratie, geen programmatische Settings aanpassingen.**
