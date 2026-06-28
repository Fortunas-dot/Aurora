import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useTheme } from '../src/hooks/useTheme';
import { useTranslation } from '../src/hooks/useTranslation';
import { useAuthStore } from '../src/store/authStore';
import { usePremiumStore } from '../src/store/premiumStore';
import { revenueCatService, PREMIUM_ENTITLEMENT } from '../src/services/revenuecat.service';
import { facebookAnalytics } from '../src/services/facebookAnalytics.service';
import { tiktokService } from '../src/services/tiktok.service';
import { appsFlyerService } from '../src/services/appsflyer.service';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Aurora website (Stripe) — hosts the cancel endpoint + account page for
// web-funnel buyers who manage their subscription from inside the app.
const WEB_BASE = 'https://aurora-commune.com';

// Dark cosmic palette (Aurora Premium redesign)
const C = {
  bg: '#0a0719',
  bgTop: '#140d2b',
  bgMid: '#0d0920',
  accent: '#E97AC4', // magenta-pink: selection rings, dots, glow
  accentDeep: '#D456A8',
  lavender: '#DCAEE2', // eyebrow label
  lavenderLight: '#E7C6EC', // italic headline word
  textDim: 'rgba(255,255,255,0.62)',
  textMid: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.42)',
  cardBg: 'rgba(255,255,255,0.05)',
  cardBgSoft: 'rgba(255,255,255,0.045)',
  cardBorder: 'rgba(255,255,255,0.10)',
  green: '#3FD89A', // active/membership accent
  greenText: '#86E3B6',
};

// Per-benefit orb colors, matched to the design's hues (Community→Therapists→AI→Journals→Coming)
const BENEFIT_COLORS = [
  '#E07CC6', // pink
  '#5FAAD0', // blue
  '#9B72E2', // purple
  '#5FC79A', // green
  '#E0B85F', // amber
];

// Static starfield — fixed positions so it renders deterministically.
const STARS: { top: number; left: number; size: number; opacity: number }[] = [
  { top: 70, left: 36, size: 2, opacity: 0.85 }, { top: 84, left: 132, size: 1.5, opacity: 0.55 },
  { top: 110, left: 214, size: 2, opacity: 0.75 }, { top: 98, left: 308, size: 1.5, opacity: 0.45 },
  { top: 150, left: 60, size: 1.5, opacity: 0.5 }, { top: 168, left: 290, size: 3, opacity: 0.9 },
  { top: 196, left: 24, size: 2, opacity: 0.6 }, { top: 210, left: 348, size: 1.5, opacity: 0.5 },
  { top: 250, left: 110, size: 2, opacity: 0.7 }, { top: 300, left: 320, size: 1.5, opacity: 0.45 },
  { top: 340, left: 48, size: 2, opacity: 0.6 }, { top: 360, left: 230, size: 1.5, opacity: 0.5 },
  { top: 420, left: 300, size: 2, opacity: 0.55 }, { top: 470, left: 90, size: 1.5, opacity: 0.6 },
  { top: 520, left: 340, size: 2, opacity: 0.5 }, { top: 560, left: 40, size: 1.5, opacity: 0.55 },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?._id || '';
  const {
    isPremium,
    customerInfo,
    availablePackages,
    checkPremiumStatus,
    loadOfferings,
    purchasePackage,
    restorePurchases,
    clearError,
  } = usePremiumStore();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  // Local override of willRenew so the UI flips immediately after cancel/reactivate,
  // before RevenueCat's flag syncs. null = use RevenueCat's value.
  const [localWillRenew, setLocalWillRenew] = useState<boolean | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [threeMonthPackage, setThreeMonthPackage] = useState<PurchasesPackage | null>(null);
  // Which plan the buy button purchases ('monthly' is the default).
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'quarterly'>('monthly');
  // When a subscribed member taps "Change plan", reveal the plan picker over the membership screen.
  const [showPlans, setShowPlans] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false); // Start as false, will be set to true when loading
  const retryAttemptRef = useRef(0);
  // The package the buy button acts on, derived from the selected plan.
  const selectedPackage = selectedPlanId === 'quarterly' ? threeMonthPackage : monthlyPackage;

  // Active entitlement details for the membership screen (null when not premium).
  const activeEntitlement = customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT] ?? null;
  // Where the active subscription was bought decides how we manage/cancel it.
  // Apple (IAP) → native in-app sheet; Stripe (web funnel) → our own flow.
  const activeStore = activeEntitlement?.store; // 'APP_STORE' | 'STRIPE' | ...
  const isAppleSub = activeStore === 'APP_STORE' || activeStore === 'MAC_APP_STORE';
  const isStripeSub = activeStore === 'STRIPE' || activeStore === 'RC_BILLING';
  // Only real store subscriptions can be canceled/reactivated. Promotional and
  // lifetime grants report willRenew=false but aren't "canceled" — exclude them.
  const isManagedSub = isAppleSub || isStripeSub;
  // The membership is set to cancel (still active until period end). RevenueCat's
  // willRenew flips to false once the cancellation syncs; the local override
  // covers the brief window right after the user taps cancel/reactivate.
  const willNotRenew =
    isManagedSub &&
    (localWillRenew !== null ? !localWillRenew : activeEntitlement?.willRenew === false);
  const activeIsQuarter = activeEntitlement?.productIdentifier === 'com.aurora.app.3months';
  const activePackage = activeIsQuarter ? threeMonthPackage : monthlyPackage;

  // Find the optional 3-month package in a list of packages (may not exist yet).
  const findThreeMonth = (pkgs: PurchasesPackage[] | undefined | null) =>
    (pkgs?.find((p) => p.product?.identifier === 'com.aurora.app.3months')
      || pkgs?.find((p) => p.packageType === 'THREE_MONTH')
      || pkgs?.find((p) => p.identifier === '$rc_three_month' || p.identifier === 'three_month')
      || null);

  // Animations — gentle entrance only.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load subscription status and offerings
  const loadSubscriptionData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await checkPremiumStatus();
      await loadOfferings();
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  }, [isAuthenticated, checkPremiumStatus, loadOfferings]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  useFocusEffect(
    useCallback(() => {
      loadSubscriptionData();
    }, [loadSubscriptionData])
  );

  // Load RevenueCat offerings
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingProducts(false);
      setMonthlyPackage(null);
      return;
    }

    // Immediately check if RevenueCat is available (for web/Expo Go)
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      setIsLoadingProducts(false);
      setMonthlyPackage(null);
      return;
    }

    const initializeAndLoad = async () => {
      // First, try to initialize RevenueCat if not already initialized
      if (!revenueCatService.initialized) {
        console.log('🔄 Initializing RevenueCat for subscription page...');
        try {
          await revenueCatService.initialize(userId);
          // Wait a bit for initialization to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('❌ Failed to initialize RevenueCat:', error);
        }
      }

      // Check availability after initialization attempt
      if (!revenueCatService.isAvailableCheck()) {
        console.warn('⚠️ RevenueCat not available after initialization attempt.');
        console.warn('⚠️ RevenueCat requires native modules. If using Expo Go, create a development build.');
        setIsLoadingProducts(false);
        setMonthlyPackage(null);
        return;
      }

      const loadOfferingsData = async () => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let isCompleted = false;

        try {
          setIsLoadingProducts(true);

          // Add timeout to prevent infinite loading (5 seconds - shorter timeout)
          timeoutId = setTimeout(() => {
            if (!isCompleted) {
              console.warn('⚠️ Offerings load timeout after 5s, setting loading to false');
              setIsLoadingProducts(false);
              setMonthlyPackage(null);
              isCompleted = true;
            }
          }, 5000);

          try {
            await loadOfferings();

            // Wait a bit for state to update after loadOfferings
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get fresh availablePackages from store
            const currentPackages = usePremiumStore.getState().availablePackages;

            console.log('📦 Available packages from store:', currentPackages?.length || 0);
            if (currentPackages && currentPackages.length > 0) {
              console.log('📦 Package details:');
              currentPackages.forEach((pkg, index) => {
                console.log(`  Package ${index + 1}:`, {
                  identifier: pkg.identifier,
                  packageType: pkg.packageType,
                  productId: pkg.product?.identifier,
                  productPrice: pkg.product?.priceString,
                });
              });
            }

            // Find monthly package - try multiple strategies with priority
            if (currentPackages && currentPackages.length > 0) {
              // Strategy 1: Find by exact product identifier (PREFERRED)
              let monthly = currentPackages.find(
                (pkg) => pkg.product?.identifier === 'com.aurora.app.monthly'
              );

              if (monthly) {
                console.log('✅ Found package by exact product identifier:', monthly.identifier);
                const priceString = monthly.product?.priceString || '';
                if (!priceString.includes('24.90') && !priceString.includes('24,90')) {
                  console.warn('⚠️ WARNING: Product price does not match expected 24.90. Current price:', priceString);
                  console.warn('⚠️ Please check App Store Connect - product "com.aurora.app.monthly" should be priced at 24.90/month');
                }
              } else {
                // Strategy 2: Find by package type MONTHLY (fallback)
                monthly = currentPackages.find(
                  (pkg) => pkg.packageType === 'MONTHLY'
                );

                if (monthly) {
                  console.warn('⚠️ Using package by type MONTHLY (fallback):', monthly.identifier);
                  console.warn('⚠️ Product ID:', monthly.product?.identifier, 'Price:', monthly.product?.priceString);
                  console.warn('⚠️ RECOMMENDED: Configure product "com.aurora.app.monthly" in RevenueCat for correct pricing');
                } else {
                  // Strategy 3: Find by package identifier (fallback)
                  monthly = currentPackages.find(
                    (pkg) => pkg.identifier === 'monthly' || pkg.identifier === '$rc_monthly'
                  );

                  if (monthly) {
                    console.warn('⚠️ Using package by identifier (fallback):', monthly.identifier);
                    console.warn('⚠️ Product ID:', monthly.product?.identifier, 'Price:', monthly.product?.priceString);
                    console.warn('⚠️ RECOMMENDED: Configure product "com.aurora.app.monthly" in RevenueCat for correct pricing');
                  } else {
                    // Strategy 4: Use first available package as last resort (with strong warning)
                    monthly = currentPackages[0];
                    console.warn('⚠️⚠️ Using first available package as last resort (fallback):', monthly.identifier);
                    console.warn('⚠️⚠️ Product ID:', monthly.product?.identifier, 'Price:', monthly.product?.priceString);
                    console.warn('⚠️⚠️ STRONGLY RECOMMENDED: Configure product "com.aurora.app.monthly" with price 24.90/month in App Store Connect');
                  }
                }
              }

              if (monthly) {
                setMonthlyPackage(monthly);
                console.log('✅ Monthly package set:', {
                  identifier: monthly.identifier,
                  packageType: monthly.packageType,
                  productId: monthly.product?.identifier,
                  productPrice: monthly.product?.priceString,
                  productTitle: monthly.product?.title,
                });
              } else {
                console.error('❌ No monthly package found after all strategies');
                setMonthlyPackage(null);
              }
              // Also pick up the optional 3-month package from the same offering.
              const threeMonth = findThreeMonth(currentPackages);
              setThreeMonthPackage(threeMonth);
              if (threeMonth) {
                console.log('✅ 3-month package set:', threeMonth.product?.identifier, threeMonth.product?.priceString);
              }
            } else {
              console.warn('⚠️ No packages available from RevenueCat');
              setMonthlyPackage(null);
            }
          } catch (offeringsError) {
            console.error('❌ Error loading offerings:', offeringsError);
            setMonthlyPackage(null);
          }
        } catch (error) {
          console.error('❌ Error in loadOfferingsData:', error);
          setIsLoadingProducts(false);
          setMonthlyPackage(null);
        } finally {
          // Mark as completed and clear timeout
          isCompleted = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          // Always set loading to false in finally block
          setIsLoadingProducts(false);
        }
      };

      loadOfferingsData();
    };

    initializeAndLoad();

    // Cleanup on unmount
    return () => {
      setIsLoadingProducts(false);
    };
  }, [isAuthenticated, loadOfferings, userId]);

  // Retry mechanism: if no package found after initial load, try again after a delay
  useEffect(() => {
    if (!isAuthenticated || isLoadingProducts) return;
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    if (!revenueCatService.isAvailableCheck()) return;
    if (monthlyPackage) return; // Already have package

    // Wait a bit and retry if no package found
    const retryTimer = setTimeout(() => {
      const currentPackages = usePremiumStore.getState().availablePackages;
      if (currentPackages && currentPackages.length > 0 && !monthlyPackage) {
        console.log('🔄 Retrying to find monthly package...');

        // Try to find package again - try multiple strategies
        let monthly = currentPackages.find(
          (pkg) => pkg.product?.identifier === 'com.aurora.app.monthly'
        ) || currentPackages.find(
          (pkg) => pkg.packageType === 'MONTHLY'
        ) || currentPackages.find(
          (pkg) => pkg.identifier === 'monthly' || pkg.identifier === '$rc_monthly'
        ) || currentPackages[0];

        if (monthly) {
          setMonthlyPackage(monthly);
          console.log('✅ Monthly package found on retry:', monthly.identifier);
        }
        setThreeMonthPackage(findThreeMonth(currentPackages));
      }
    }, 2000);

    return () => clearTimeout(retryTimer);
  }, [isAuthenticated, isLoadingProducts, monthlyPackage]);

  // Handlers
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      Alert.alert(t('sub_login_required'), t('sub_login_to_purchase'), [
        { text: t('ok'), onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert(t('sub_not_available'), t('sub_iap_mobile_only'));
      return;
    }

    if (!selectedPackage) {
      // Try to reload offerings if package is not found (max 1 retry)
      if (retryAttemptRef.current === 0) {
        retryAttemptRef.current = 1;
        console.log('⚠️ Monthly package not found, attempting to reload offerings...');
        try {
          await loadOfferings();
          // Wait a bit for state to update
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check again after reload - try multiple strategies
          if (availablePackages.length > 0) {
            const monthly = availablePackages.find(
              (pkg) => pkg.product?.identifier === 'com.aurora.app.monthly'
            ) || availablePackages.find(
              (pkg) => pkg.packageType === 'MONTHLY'
            ) || availablePackages.find(
              (pkg) => pkg.identifier === 'monthly' || pkg.identifier === '$rc_monthly'
            ) || availablePackages[0];

            if (monthly) {
              setMonthlyPackage(monthly);
              setThreeMonthPackage(findThreeMonth(availablePackages));
              retryAttemptRef.current = 0; // Reset for next time
              // Retry purchase
              handlePurchase();
              return;
            }
          }
        } catch (error) {
          console.error('Error reloading offerings:', error);
        }
        retryAttemptRef.current = 0; // Reset even on error
      }

      Alert.alert(
        t('sub_package_not_available'),
        t('sub_package_not_available_body'),
        [{ text: t('ok') }]
      );
      return;
    }

    // Reset retry counter on successful package check
    retryAttemptRef.current = 0;

    // Block re-purchase only when the member is NOT explicitly changing plans.
    // The "Change plan" flow (showPlans) lets RevenueCat handle the upgrade/cross-grade.
    if (isPremium && !showPlans) {
      Alert.alert(t('sub_already_premium'), t('sub_already_premium_body'));
      return;
    }

    try {
      setIsPurchasing(true);
      clearError();

      const wasChangingPlan = isPremium && showPlans;
      const success = await purchasePackage(selectedPackage);

      if (success) {
        // Returning members changing plan go back to the membership screen.
        setShowPlans(false);
        // Facebook: track subscription purchase (best-effort; guard product data)
        const product = selectedPackage.product as any;
        const price = typeof product?.price === 'number' ? product.price : 0;
        const currency = product?.currency || 'EUR';
        facebookAnalytics.logSubscriptionPurchased(
          product?.identifier || 'com.aurora.app.monthly',
          price,
          currency
        );

        // TikTok: track subscription + purchase events
        tiktokService.trackSubscribe();
        tiktokService.trackPurchase({
          contentId:   product?.identifier || 'com.aurora.app.monthly',
          contentName: 'Aurora Premium Monthly',
          contentType: 'subscription',
          description: 'Aurora AI – Monthly Premium Subscription',
          price,
          value:       String(price),
        });

        appsFlyerService.trackSubscribe();
        appsFlyerService.trackPurchase({
          contentId: product?.identifier || 'com.aurora.app.monthly',
          price,
          currency,
          contentType: 'subscription',
        });

        Alert.alert(
          t('sub_welcome_premium_title'),
          t('sub_welcome_premium_body'),
          [
            {
              text: t('ok'),
              onPress: () => {
                // New subscribers continue onboarding; plan-changers stay on the membership screen.
                if (!wasChangingPlan) router.push('/health-info');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      if (error.message !== 'Purchase cancelled') {
        Alert.alert(t('sub_purchase_failed'), error.message || t('sub_purchase_failed_body'));
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert(t('sub_not_available'), t('sub_restore_mobile_only'));
      return;
    }

    try {
      setIsRestoring(true);
      clearError();

      const success = await restorePurchases();

      if (success) {
        // Facebook: treat restore as an active subscription (no separate event in guide)
        Alert.alert(t('sub_purchases_restored'), t('sub_purchases_restored_body'));
      } else {
        Alert.alert(t('sub_no_purchases'), t('sub_no_purchases_body'));
      }
    } catch (error: any) {
      Alert.alert(t('sub_restore_failed'), error.message || t('sub_restore_failed_body'));
    } finally {
      setIsRestoring(false);
    }
  };

  // Resolve where the active sub was bought, fetching fresh customer info if the
  // store-loaded entitlement isn't available yet. Only an explicit Stripe store
  // routes to our web cancel/portal flow — Apple/promotional/unknown go to the
  // native sheet (so an Apple buyer never sees a false "couldn't cancel").
  const resolveStore = async (): Promise<string | undefined> => {
    if (activeStore) return activeStore;
    try {
      const ci = await revenueCatService.getCustomerInfo();
      return ci?.entitlements.active[PREMIUM_ENTITLEMENT]?.store;
    } catch (error) {
      console.warn('Failed to resolve subscription store:', error);
      return undefined;
    }
  };
  const isStripeStore = (store?: string) => store === 'STRIPE' || store === 'RC_BILLING';

  // Present Apple's native subscription sheet INSIDE the app (RevenueCat Customer
  // Center). Returns true if shown. Apple subs can only be managed/cancelled
  // through Apple — this is the closest-to-native, in-app way to do it.
  const presentAppleManagement = async (): Promise<boolean> => {
    try {
      await RevenueCatUI.presentCustomerCenter();
      // They may have changed/cancelled while in the sheet — refresh.
      await checkPremiumStatus();
      return true;
    } catch (error) {
      console.warn('Customer Center unavailable, will fall back:', error);
      return false;
    }
  };

  // Last-resort Apple fallback if Customer Center can't present.
  const openAppleFallback = async () => {
    try {
      const ci = await revenueCatService.getCustomerInfo();
      if (ci?.managementURL) {
        await Linking.openURL(ci.managementURL);
        return;
      }
    } catch (error) {
      console.warn('Failed to read managementURL:', error);
    }
    try {
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
    } catch (error) {
      Alert.alert(t('sub_manage_subscription'), t('sub_manage_ios_settings'));
    }
  };

  // Open the Stripe Customer Portal for a web-funnel buyer (update card / change
  // plan / cancel on a short-lived Stripe-hosted page). Returns true if opened.
  const openStripePortal = async (flow?: 'change_plan'): Promise<boolean> => {
    try {
      const res = await fetch(`${WEB_BASE}/api/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_user_id: userId, email: (user as any)?.email || '', flow }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (res.ok && data?.url) {
        await Linking.openURL(data.url);
        return true;
      }
    } catch (error) {
      console.warn('Failed to open Stripe billing portal:', error);
    }
    return false;
  };

  // "Manage subscription" row. Stripe → portal. Everything else → native sheet.
  const handleManageSubscription = async () => {
    const store = await resolveStore();
    if (isStripeStore(store)) {
      if (await openStripePortal()) return;
      Alert.alert(t('sub_manage_subscription'), t('sub_manage_subscription_body'));
      return;
    }
    if (isMobile && (await presentAppleManagement())) return;
    await openAppleFallback();
  };

  // Cancel a Stripe (web-funnel) subscription via our backend — stays in-app.
  // Cancels at period end, so the member keeps access until it runs out.
  const cancelStripeSubscription = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(`${WEB_BASE}/api/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_user_id: userId, email: (user as any)?.email || '' }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (res.ok && data?.ok) {
        setLocalWillRenew(false);
        await checkPremiumStatus();
        Alert.alert(t('sub_cancel_done_title'), t('sub_cancel_done_body'));
      } else {
        console.warn('Stripe cancel returned not-ok:', res.status, data?.reason || data?.error);
        Alert.alert(t('sub_cancel_failed_title'), t('sub_cancel_failed_body'));
      }
    } catch (error) {
      console.warn('Stripe cancel failed:', error);
      Alert.alert(t('sub_cancel_failed_title'), t('sub_cancel_failed_body'));
    } finally {
      setIsCancelling(false);
    }
  };

  // "Cancel membership" button. Stripe → in-app confirm + backend cancel.
  // Apple/unknown → native in-app sheet (never show a web buyer's error to an
  // Apple buyer, and never bounce a web buyer to Apple).
  const handleCancelMembership = async () => {
    // Already set to cancel → don't re-cancel; tell them and bail.
    if (willNotRenew) {
      Alert.alert(t('sub_already_canceled_title'), t('sub_already_canceled_body'));
      return;
    }
    const store = await resolveStore();
    if (!isStripeStore(store)) {
      if (isMobile && (await presentAppleManagement())) return;
      await openAppleFallback();
      return;
    }
    Alert.alert(
      t('sub_cancel_confirm_title'),
      t('sub_cancel_confirm_body'),
      [
        { text: t('sub_cancel_keep'), style: 'cancel' },
        { text: t('sub_cancel_confirm_cta'), style: 'destructive', onPress: cancelStripeSubscription },
      ]
    );
  };

  // "Reactivate membership" — undo a scheduled cancellation. Stripe → backend
  // clears cancel_at_period_end (and restores the intro→monthly conversion).
  // Apple/unknown → native sheet (re-enable auto-renew through Apple).
  const handleReactivate = async () => {
    const store = await resolveStore();
    if (!isStripeStore(store)) {
      if (isMobile && (await presentAppleManagement())) return;
      await openAppleFallback();
      return;
    }
    try {
      setIsReactivating(true);
      const res = await fetch(`${WEB_BASE}/api/reactivate-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_user_id: userId, email: (user as any)?.email || '' }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (res.ok && data?.ok) {
        setLocalWillRenew(true);
        await checkPremiumStatus();
        Alert.alert(t('sub_reactivate_done_title'), t('sub_reactivate_done_body'));
      } else {
        console.warn('Reactivate returned not-ok:', res.status, data?.reason || data?.error);
        Alert.alert(t('sub_reactivate_failed_title'), t('sub_reactivate_failed_body'));
      }
    } catch (error) {
      console.warn('Reactivate failed:', error);
      Alert.alert(t('sub_reactivate_failed_title'), t('sub_reactivate_failed_body'));
    } finally {
      setIsReactivating(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  // Close (×): step back out of the plan picker first when a member is changing plans.
  const handleClose = () => {
    if (isPremium && showPlans) {
      setShowPlans(false);
    } else {
      handleBack();
    }
  };

  const handleHelp = () => router.push('/help-support');

  // Change plan. Apple buyers use the in-app picker (RevenueCat handles the
  // upgrade/cross-grade). Stripe/web buyers must NOT buy via Apple here (it would
  // create a second subscription) — send them to web management instead.
  // Switch a Stripe (web) subscription to a new plan at the next renewal.
  const changeStripePlan = async (plan: 'monthly' | 'quarterly') => {
    try {
      setIsChangingPlan(true);
      const res = await fetch(`${WEB_BASE}/api/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_user_id: userId, email: (user as any)?.email || '', plan }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (res.ok && data?.ok) {
        await checkPremiumStatus();
        Alert.alert(t('sub_change_plan_done_title'), t('sub_change_plan_done_body'));
      } else {
        console.warn('change-plan returned not-ok:', res.status, data?.reason || data?.error);
        Alert.alert(t('sub_change_plan_failed_title'), t('sub_change_plan_failed_body'));
      }
    } catch (error) {
      console.warn('change-plan failed:', error);
      Alert.alert(t('sub_change_plan_failed_title'), t('sub_change_plan_failed_body'));
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleChangePlan = async () => {
    const store = await resolveStore();
    // Stripe/web buyers: in-app plan picker (switch at next renewal). Must NOT go
    // through the Apple picker (that would start a second, Apple subscription).
    if (isStripeStore(store)) {
      Alert.alert(t('sub_change_plan_title'), t('sub_change_plan_body'), [
        { text: `${t('sub_plan_monthly_title')} · $24.90`, onPress: () => changeStripePlan('monthly') },
        { text: `${t('sub_plan_quarterly_title')} · $49.90`, onPress: () => changeStripePlan('quarterly') },
        { text: t('sub_keep_current'), style: 'cancel' },
      ]);
      return;
    }
    setShowPlans(true);
  };

  // Benefit rows — reuse the localized feature copy, paired with the design's orb colors.
  const benefits = useMemo(
    () => [
      { title: t('feat_community_title'), desc: t('feat_community_desc') },
      { title: t('feat_therapists_title'), desc: t('feat_therapists_desc') },
      { title: t('feat_ai_title'), desc: t('feat_ai_desc') },
      { title: t('feat_journal_title'), desc: t('feat_journal_desc') },
      { title: t('feat_coming_title'), desc: t('feat_coming_desc') },
    ].map((b, i) => ({ ...b, color: BENEFIT_COLORS[i] })),
    [t]
  );

  // Plan options — monthly always, 3-month only when the package exists.
  const plans = useMemo(() => {
    const list: {
      id: 'monthly' | 'quarterly';
      title: string;
      sub: string;
      pkg: PurchasesPackage | null;
      period: string;
      popular: boolean;
    }[] = [
      {
        id: 'monthly',
        title: t('sub_plan_monthly_title'),
        sub: t('sub_plan_monthly_sub'),
        pkg: monthlyPackage,
        period: t('sub_per_month'),
        popular: true,
      },
    ];
    if (threeMonthPackage) {
      list.push({
        id: 'quarterly',
        title: t('sub_plan_quarterly_title'),
        sub: t('sub_plan_quarterly_sub'),
        pkg: threeMonthPackage,
        period: t('sub_per_3_months'),
        popular: false,
      });
    }
    return list;
  }, [t, monthlyPackage, threeMonthPackage]);

  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const ctaDisabled =
    isPurchasing || (isLoadingProducts && Platform.OS !== 'web') || (!selectedPackage && isMobile);

  // Build the CTA label string for the active purchasable state.
  const purchaseLabel = selectedPackage?.product?.priceString
    ? `${t('sub_cta_start_trial')} · ${selectedPackage.product.priceString}`
    : t('sub_cta_start_trial');

  // Footer renewal note — only the monthly copy mentions "/month", so fall back to generic otherwise.
  const renewNote = selectedPackage?.product?.priceString && selectedPlanId === 'monthly'
    ? t('sub_auto_renew_with_price', { price: selectedPackage.product.priceString })
    : t('sub_auto_renew_generic');

  // Show the membership screen for active subscribers (unless they tapped "Change plan").
  const showSubscribed = isPremium && !showPlans;

  // Format an ISO date string for the membership rows; null when unavailable/invalid.
  // Guards against sandbox/StoreKit sentinel dates (e.g. far-future "2226" expirations)
  // so we never surface a nonsensical renewal date to the user.
  const formatDate = (iso?: string | null): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const nowYear = new Date().getFullYear();
    if (year < 2000 || year > nowYear + 5) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const activePlanName = activeIsQuarter ? t('sub_plan_quarterly_title') : t('sub_plan_monthly_title');
  const activePlanValue = activePackage?.product?.priceString
    ? `${activePlanName} · ${activePackage.product.priceString}`
    : activePlanName;
  const renewsLabel = formatDate(activeEntitlement?.expirationDate);
  const memberSinceLabel = formatDate(activeEntitlement?.originalPurchaseDate);

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
            onPress={handleBack}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('sub_header_premium')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authPromptTitle, { color: colors.text }]}>{t('sub_login_subscribe')}</Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>{t('sub_log_in_button')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Cosmic background */}
      <LinearGradient
        colors={[C.bgTop, C.bgMid, C.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft nebula glows */}
      <View pointerEvents="none" style={[styles.glow, styles.glowPurple]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBlue]} />
      {/* Starfield */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {STARS.map((s, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: s.size,
              backgroundColor: '#fff',
              opacity: s.opacity,
            }}
          />
        ))}
      </View>

      {showSubscribed ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={handleBack} style={styles.closeCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleHelp} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.restoreTop}>{t('sub_help')}</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Status hero */}
            <View style={styles.hero}>
              <LinearGradient
                colors={['#EAC7F0', '#C77BD8', '#7E54BE', '#5B3FA0']}
                start={{ x: 0.3, y: 0.2 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.heroOrbCheck}
              >
                <Ionicons name="checkmark" size={42} color="#fff" />
              </LinearGradient>
              <View style={styles.eyebrowRow}>
                <View style={styles.statusDot} />
                <Text style={[styles.eyebrow, { color: C.greenText }]}>{t('sub_membership_active')}</Text>
              </View>
              <Text style={styles.heroTitle}>
                {t('sub_all_set_1')}{' '}
                <Text style={styles.heroTitleAccent}>{t('sub_all_set_accent')}</Text>
              </Text>
              <Text style={styles.heroSubtitle}>{t('sub_subscribed_subtitle')}</Text>
            </View>

            {/* Founding member badge */}
            <View style={styles.foundingRow}>
              <View style={styles.foundingPill}>
                <Text style={styles.eyebrowStar}>✦</Text>
                <Text style={styles.foundingText}>{t('sub_founding_member')}</Text>
              </View>
            </View>

            {/* Your membership */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('sub_your_membership')}</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('sub_row_plan')}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{activePlanValue}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('sub_row_status')}</Text>
                  <View style={styles.statusValueRow}>
                    <View style={styles.statusDot} />
                    <Text style={[styles.infoValue, styles.infoValueAuto, { color: C.greenText }]} numberOfLines={1}>
                      {t('sub_status_active')}
                    </Text>
                  </View>
                </View>
                {renewsLabel ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{willNotRenew ? t('sub_row_cancels') : t('sub_row_renews')}</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>{renewsLabel}</Text>
                  </View>
                ) : null}
                {memberSinceLabel ? (
                  <View style={[styles.infoRow, styles.infoRowLast]}>
                    <Text style={styles.infoLabel}>{t('sub_row_member_since')}</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>{memberSinceLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Included in your plan */}
            <View style={[styles.section, { paddingTop: 14 }]}>
              <Text style={styles.sectionLabel}>{t('sub_included_label')}</Text>
              <View style={[styles.infoCard, { paddingVertical: 4 }]}>
                {benefits.map((b, i) => (
                  <View key={i} style={styles.accessRow}>
                    <View style={styles.accessCheck}>
                      <Ionicons name="checkmark" size={12} color={C.greenText} />
                    </View>
                    <Text style={styles.accessText}>{b.title}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Manage actions */}
            <View style={[styles.section, { paddingTop: 14 }]}>
              <View style={styles.infoCard}>
                <TouchableOpacity activeOpacity={0.7} onPress={handleChangePlan} disabled={isChangingPlan} style={styles.actionRow}>
                  <Text style={styles.actionText}>{t('sub_change_plan')}</Text>
                  {isChangingPlan ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={handleRestorePurchases} disabled={isRestoring} style={styles.actionRow}>
                  <Text style={styles.actionText}>{t('sub_restore_purchases')}</Text>
                  {isRestoring ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={handleManageSubscription} style={[styles.actionRow, styles.infoRowLast]}>
                  <Text style={styles.actionText}>{isAppleSub ? t('sub_manage_app_store') : t('sub_manage_subscription')}</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cancel / reactivate + footer */}
            <View style={[styles.section, { paddingTop: 18 }]}>
              {willNotRenew ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleReactivate}
                  disabled={isReactivating}
                  style={styles.reactivateBtn}
                >
                  {isReactivating ? (
                    <ActivityIndicator size="small" color={C.greenText} />
                  ) : (
                    <View style={styles.reactivateRow}>
                      <Ionicons name="refresh" size={16} color={C.greenText} />
                      <Text style={styles.reactivateText}>{t('sub_reactivate_membership')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCancelMembership}
                  disabled={isCancelling}
                  style={styles.cancelBtn}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.62)" />
                  ) : (
                    <Text style={styles.cancelText}>{t('sub_cancel_membership')}</Text>
                  )}
                </TouchableOpacity>
              )}
              <Text style={styles.subscribedFooter}>
                {willNotRenew ? t('sub_canceled_footer') : t('sub_subscribed_footer')}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      ) : (
       <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRestorePurchases} disabled={isRestoring} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {isRestoring ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            ) : (
              <Text style={styles.restoreTop}>{t('sub_restore_short')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={['#EAC7F0', '#C77BD8', '#7E54BE', '#5B3FA0']}
              start={{ x: 0.3, y: 0.2 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.heroOrb}
            />
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrowStar}>✦</Text>
              <Text style={styles.eyebrow}>{`${t('sub_brand_title')} ${t('sub_header_premium')}`}</Text>
            </View>
            <Text style={styles.heroTitle}>
              {t('sub_hero_title_1')}
              {'\n'}
              <Text style={styles.heroTitleAccent}>{t('sub_hero_title_accent')}</Text>
            </Text>
            <Text style={styles.heroSubtitle}>{t('sub_hero_subtitle')}</Text>
          </View>

          {/* Founding offer badge */}
          <View style={styles.foundingRow}>
            <View style={styles.foundingPill}>
              <View style={styles.foundingDot} />
              <Text style={styles.foundingText}>{t('sub_founding_offer')}</Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('sub_everything_label')}</Text>
            <View style={styles.benefitsCard}>
              {benefits.map((b, i) => (
                <View
                  key={i}
                  style={[
                    styles.benefitRow,
                    i === benefits.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View
                    style={[
                      styles.benefitOrb,
                      Platform.select({
                        ios: { shadowColor: b.color, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
                        android: {},
                      }),
                      { backgroundColor: b.color },
                    ]}
                  />
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitDesc}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Plans */}
          <View style={styles.plansWrap}>
            {plans.map((p) => {
              const isSel = selectedPlanId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPlanId(p.id)}
                  style={[
                    styles.planCard,
                    isSel && styles.planCardSelected,
                  ]}
                >
                  <View style={styles.planRadio}>
                    {isSel && <View style={styles.planRadioDot} />}
                  </View>
                  <View style={styles.planMid}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.planTitle}>{p.title}</Text>
                      {p.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>{t('sub_badge_popular')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planSub}>{p.sub}</Text>
                  </View>
                  <View style={styles.planPriceCol}>
                    <Text style={styles.planPrice}>{p.pkg?.product?.priceString ?? '...'}</Text>
                    <Text style={styles.planPeriod}>{p.period}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 18 }]} pointerEvents="box-none">
        <LinearGradient
          colors={['transparent', C.bgMid, C.bg]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePurchase}
          disabled={ctaDisabled}
          style={[styles.ctaButtonShadow, { opacity: ctaDisabled ? 0.7 : 1 }]}
        >
          <LinearGradient
            colors={['#F0A9D8', '#C9A0EE', '#A9C0F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#1a0f22" size="small" />
            ) : isLoadingProducts && isMobile ? (
              <ActivityIndicator color="#1a0f22" size="small" />
            ) : !selectedPackage && isMobile ? (
              <Text style={styles.ctaText}>{t('sub_cta_coming_soon')}</Text>
            ) : (
              <Text style={styles.ctaText}>{purchaseLabel}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.ctaFootnote}>
          {t('sub_price_first_500')} {renewNote}
        </Text>
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={handleRestorePurchases} disabled={isRestoring}>
            <Text style={styles.legalLink}>{t('sub_restore_purchases')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => router.push('/terms-of-service')}>
            <Text style={styles.legalLink}>{t('termsOfService')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
            <Text style={styles.legalLink}>{t('privacyPolicy')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowPurple: {
    width: 360,
    height: 360,
    top: -120,
    left: -90,
    backgroundColor: 'rgba(150,70,220,0.22)',
  },
  glowBlue: {
    width: 320,
    height: 320,
    top: -60,
    right: -110,
    backgroundColor: 'rgba(70,120,220,0.16)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreTop: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textDim,
    letterSpacing: 0.2,
  },
  hero: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 4,
    alignItems: 'center',
  },
  heroOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#B266E0',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.55,
        shadowRadius: 30,
      },
      android: { elevation: 12 },
    }),
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  eyebrowStar: {
    fontSize: 12,
    color: C.lavender,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2.4,
    color: C.lavender,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 33,
    lineHeight: 37,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  heroTitleAccent: {
    fontStyle: 'italic',
    color: C.lavenderLight,
  },
  heroSubtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    color: C.textDim,
    textAlign: 'center',
    maxWidth: 290,
  },
  foundingRow: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  foundingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: 'rgba(212,86,168,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(232,124,196,0.35)',
  },
  foundingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    ...Platform.select({
      ios: { shadowColor: C.accent, shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
      android: {},
    }),
  },
  foundingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EEC9E8',
  },
  section: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: C.textFaint,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  benefitsCard: {
    backgroundColor: C.cardBgSoft,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 22,
    overflow: 'hidden',
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  benefitOrb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginTop: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...Platform.select({ android: { elevation: 4 } }),
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.55)',
  },
  plansWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 18,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  planCardSelected: {
    borderColor: C.accent,
    borderWidth: 1.5,
    backgroundColor: 'rgba(232,124,196,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: C.accentDeep,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
      },
      android: { elevation: 6 },
    }),
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.accent,
    ...Platform.select({
      ios: { shadowColor: C.accent, shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
      android: {},
    }),
  },
  planMid: {
    flex: 1,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#fff',
  },
  popularBadge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(212,86,168,0.20)',
  },
  popularText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#EEC0E4',
  },
  planSub: {
    fontSize: 12.5,
    color: C.textMid,
    marginTop: 2,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  planPeriod: {
    fontSize: 11,
    color: C.textMid,
    marginTop: 1,
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 26,
  },
  ctaButtonShadow: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#C95FB0',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  ctaButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a0f22',
  },
  ctaFootnote: {
    fontSize: 11,
    lineHeight: 16,
    color: C.textFaint,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 6,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  legalLink: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  // --- Subscribed / membership-active screen ---
  heroOrbCheck: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#B266E0',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.55,
        shadowRadius: 30,
      },
      android: { elevation: 12 },
    }),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
    ...Platform.select({
      ios: { shadowColor: C.green, shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
      android: {},
    }),
  },
  infoCard: {
    backgroundColor: C.cardBgSoft,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 22,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.55)',
    flexShrink: 0,
    marginRight: 12,
  },
  infoValue: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'right',
  },
  // Status pill value sits inside its own row, so it sizes to content instead of flexing.
  infoValueAuto: {
    flex: 0,
  },
  statusValueRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  accessCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(63,216,154,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(63,216,154,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
  },
  reactivateBtn: {
    borderWidth: 1,
    borderColor: 'rgba(63,216,154,0.4)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(63,216,154,0.10)',
  },
  reactivateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactivateText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.greenText,
  },
  subscribedFooter: {
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 6,
  },
  // --- Unauthenticated prompt (kept from prior screen) ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  headerSpacer: {
    width: 40,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  authPromptTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  authButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 200,
  },
  authButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
