/**
 * tiktok.service.ts
 *
 * JavaScript bridge to the native TikTokEventModule (Objective-C).
 * The native module is registered as "TikTokEvents" via RCT_EXPORT_MODULE.
 *
 * All calls are guarded:
 *  - iOS only (the SDK is iOS-only)
 *  - Native module must be available (won't be in Expo Go – only in dev/prod builds)
 *  - Every call is wrapped in try/catch so tracking never crashes the app
 */

import { NativeModules, Platform } from 'react-native';

const { TikTokEvents } = NativeModules;

const isAvailable = (): boolean =>
  Platform.OS === 'ios' && !!TikTokEvents;

// ─── Event name constants (mirrors TikTok SDK TTEventName* constants) ─────────
export const TIKTOK_EVENTS = {
  REGISTRATION:    'Registration',
  LOGIN:           'Login',
  SUBSCRIBE:       'Subscribe',
  START_TRIAL:     'StartTrial',
  VIEW_CONTENT:    'ViewContent',
  LAUNCH_APP:      'LaunchAPP',
  PURCHASE:        'Purchase',
  SEARCH:          'Search',
  ADD_PAYMENT_INFO: 'AddPaymentInfo',
  COMPLETE_TUTORIAL: 'CompleteTutorial',
} as const;

// ─── Identify ─────────────────────────────────────────────────────────────────
/**
 * Call after login or registration to link the user to their TikTok profile.
 * @param externalId   Your internal user ID (e.g. MongoDB _id)
 * @param username     Display name / username
 * @param phoneNumber  E.164 format preferred, or empty string
 * @param email        User email, or empty string
 */
function identify(
  externalId: string,
  username: string,
  phoneNumber: string,
  email: string
): void {
  if (!isAvailable()) return;
  try {
    TikTokEvents.identify(externalId, username, phoneNumber, email);
  } catch (e) {
    if (__DEV__) console.warn('[TikTok] identify error:', e);
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
/** Call on user logout to clear TikTok's internal identity state. */
function logout(): void {
  if (!isAvailable()) return;
  try {
    TikTokEvents.logout();
  } catch (e) {
    if (__DEV__) console.warn('[TikTok] logout error:', e);
  }
}

// ─── Simple events ────────────────────────────────────────────────────────────
function trackEvent(eventName: string): void {
  if (!isAvailable()) return;
  try {
    TikTokEvents.trackEvent(eventName);
  } catch (e) {
    if (__DEV__) console.warn('[TikTok] trackEvent error:', eventName, e);
  }
}

/** User completed registration */
const trackRegistration = () => trackEvent(TIKTOK_EVENTS.REGISTRATION);

/** User logged in */
const trackLogin = () => trackEvent(TIKTOK_EVENTS.LOGIN);

/** User subscribed to a paid plan */
const trackSubscribe = () => trackEvent(TIKTOK_EVENTS.SUBSCRIBE);

/** User started a free trial */
const trackStartTrial = () => trackEvent(TIKTOK_EVENTS.START_TRIAL);

/** User viewed content (e.g. opened a chat session) */
const trackViewContent = () => trackEvent(TIKTOK_EVENTS.VIEW_CONTENT);

/** App was launched (call from _layout.tsx on mount) */
const trackLaunchApp = () => trackEvent(TIKTOK_EVENTS.LAUNCH_APP);

// ─── Purchase event (with product details) ───────────────────────────────────
interface PurchaseParams {
  contentId:    string;   // product identifier, e.g. 'com.aurora.app.monthly'
  contentName:  string;   // human name, e.g. 'Aurora Premium Monthly'
  contentType:  string;   // e.g. 'subscription'
  description:  string;   // short description
  price:        number;   // unit price, e.g. 9.99
  value:        string;   // total order value as string, e.g. '9.99'
}

/** Track a completed in-app purchase (subscription) */
function trackPurchase(params: PurchaseParams): void {
  if (!isAvailable()) return;
  try {
    TikTokEvents.trackPurchase(params);
  } catch (e) {
    if (__DEV__) console.warn('[TikTok] trackPurchase error:', e);
  }
}

// ─── Debug / test event code ──────────────────────────────────────────────────
/**
 * Set TikTok test event code so your events appear in TikTok Events Manager → Test Events.
 *
 * How to use:
 *  1. Open TikTok Events Manager → select your App → "Test Events" tab.
 *  2. Copy the test_event_code shown there.
 *  3. Call `tiktokService.setTestEventCode('YOUR_CODE')` at app startup (see _layout.tsx).
 *  4. Make a dev build, trigger events, confirm they appear in Event Activity.
 *  5. ⚠️  Remove the call to this function before releasing to production.
 *     Leaving test_event_code active routes ALL data to test mode and excludes
 *     it from ad campaigns.
 */
function setTestEventCode(code: string): void {
  if (!isAvailable()) return;
  try {
    TikTokEvents.setTestEventCode(code);
    if (__DEV__) console.log('[TikTok] 🧪 Test event code set →', code);
  } catch (e) {
    if (__DEV__) console.warn('[TikTok] setTestEventCode error:', e);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const tiktokService = {
  identify,
  logout,
  trackRegistration,
  trackLogin,
  trackSubscribe,
  trackStartTrial,
  trackViewContent,
  trackLaunchApp,
  trackPurchase,
  setTestEventCode,
};
