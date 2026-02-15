import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
import { useTheme } from '../src/hooks/useTheme';
import { useAuthStore } from '../src/store/authStore';
import { usePremiumStore } from '../src/store/premiumStore';
import { revenueCatService, PREMIUM_ENTITLEMENT } from '../src/services/revenuecat.service';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Floating Aurora sparkle component
const FloatingSparkle = React.memo(({ delay, startX, startY, size }: { delay: number; startX: number; startY: number; size: number }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <Animated.View
      style={[
        styles.floatingSparkle,
        {
          left: startX,
          top: startY,
          opacity: opacityAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name="sparkles" size={size} color="rgba(255, 255, 255, 0.3)" />
    </Animated.View>
  );
});

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?._id || '';
  const {
    isPremium,
    isLoading,
    offerings,
    availablePackages,
    error,
    checkPremiumStatus,
    loadOfferings,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    clearError,
  } = usePremiumStore();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false); // Start as false, will be set to true when loading
  const retryAttemptRef = useRef(0);

  // Animations
  const auroraBounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(auroraBounceAnim, {
          toValue: -10,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(auroraBounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
        let timeoutId: NodeJS.Timeout | null = null;
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
            
            // Find monthly package - try multiple strategies
            if (currentPackages && currentPackages.length > 0) {
              // Strategy 1: Find by product identifier
              let monthly = currentPackages.find(
                (pkg) => pkg.product?.identifier === 'com.aurora.app.monthly'
              );
              
              if (monthly) {
                console.log('✅ Found package by product identifier:', monthly.identifier);
              } else {
                // Strategy 2: Find by package type
                monthly = currentPackages.find(
                  (pkg) => pkg.packageType === 'MONTHLY'
                );
                
                if (monthly) {
                  console.log('✅ Found package by package type MONTHLY:', monthly.identifier);
                } else {
                  // Strategy 3: Find by package identifier
                  monthly = currentPackages.find(
                    (pkg) => pkg.identifier === 'monthly' || pkg.identifier === '$rc_monthly'
                  );
                  
                  if (monthly) {
                    console.log('✅ Found package by identifier:', monthly.identifier);
                  } else {
                    // Strategy 4: Use first available package as fallback
                    monthly = currentPackages[0];
                    console.log('✅ Using first available package as fallback:', monthly.identifier, monthly.product?.identifier);
                  }
                }
              }
              
              if (monthly) {
                setMonthlyPackage(monthly);
                console.log('✅ Monthly package set successfully:', {
                  identifier: monthly.identifier,
                  packageType: monthly.packageType,
                  productId: monthly.product?.identifier,
                  productPrice: monthly.product?.priceString,
                });
              } else {
                console.warn('⚠️ No monthly package found after all strategies');
                setMonthlyPackage(null);
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
        
        // Try to find package again
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
      }
    }, 2000);
    
    return () => clearTimeout(retryTimer);
  }, [isAuthenticated, isLoadingProducts, monthlyPackage]);

  // Handlers
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to purchase a subscription.', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert('Not Available', 'In-app purchases are only available on mobile devices.');
      return;
    }

    if (!monthlyPackage) {
      // Try to reload offerings if package is not found (max 1 retry)
      if (retryAttemptRef.current === 0) {
        retryAttemptRef.current = 1;
        console.log('⚠️ Monthly package not found, attempting to reload offerings...');
        try {
          await loadOfferings();
          // Wait a bit for state to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check again after reload
          if (availablePackages.length > 0) {
            const monthly = availablePackages.find(
              (pkg) => 
                pkg.product.identifier === 'com.aurora.app.monthly' ||
                pkg.packageType === 'MONTHLY' ||
                pkg.identifier === 'monthly' ||
                pkg.identifier === '$rc_monthly'
            ) || availablePackages[0];
            
            if (monthly) {
              setMonthlyPackage(monthly);
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
        'Package Not Available', 
        'Unable to load subscription packages. Please check your internet connection and try again, or contact support.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Reset retry counter on successful package check
    retryAttemptRef.current = 0;

    if (isPremium) {
      Alert.alert('Already Premium', 'You already have an active premium subscription!');
      return;
    }

    try {
      setIsPurchasing(true);
      clearError();

      const success = await purchasePackage(monthlyPackage);

      if (success) {
        Alert.alert(
          'Welcome to Premium! 🎉',
          'Your subscription is now active. Enjoy all premium features!',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      if (error.message !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert('Not Available', 'Restore is only available on mobile devices.');
      return;
    }

    try {
      setIsRestoring(true);
      clearError();

      const success = await restorePurchases();

      if (success) {
        Alert.alert('Purchases Restored', 'Your previous purchases have been restored successfully.');
      } else {
        Alert.alert('No Purchases Found', "We couldn't find any previous purchases to restore.");
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  // Features list for Aurora
  const featuresList = [
    { icon: 'people', title: 'COMMUNITY', desc: 'Access to like-minded people' },
    { icon: 'medical', title: 'THERAPISTS', desc: '2-5 therapists available to answer questions in the feed' },
    { icon: 'sparkles', title: 'A.I. EMOTIONAL SUPPORT', desc: 'Your own free A.I. emotional companion' },
    { icon: 'book', title: 'JOURNALS & INSIGHTS', desc: 'Access to functionalities like journals, insights etc' },
    { icon: 'rocket', title: 'COMING SOON', desc: 'Voice sessions, White noises, Events' },
  ];

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Premium</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authPromptTitle, { color: colors.text }]}>Log in to subscribe</Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F5F7FA' }]}>
      {/* Header with gradient background - Fixed at top */}
      <LinearGradient
        colors={[colors.primary, colors.secondary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
          {/* Floating decorative elements */}
          <FloatingSparkle delay={0} startX={20} startY={60} size={22} />
          <FloatingSparkle delay={300} startX={SCREEN_WIDTH - 50} startY={50} size={18} />
          <FloatingSparkle delay={500} startX={SCREEN_WIDTH / 2 + 40} startY={80} size={16} />

          {/* Close button */}
          <TouchableOpacity onPress={handleBack} style={styles.closeButtonHeader}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header content */}
          <View style={styles.headerContent}>
            <Text style={styles.headerSmallTitle}>LIMITED TIME OFFER</Text>
            <Animated.View style={[styles.headerTitleRow, { opacity: fadeAnim }]}>
              <Text style={styles.headerBigTitle}>Aurora</Text>
            </Animated.View>
          </View>
        </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        decelerationRate="normal"
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Premium Plan Card */}
          <Animated.View
            style={[
              styles.planCard,
              {
                backgroundColor: '#FFFFFF',
                borderColor: isPremium ? '#27AE60' : '#9B59B6',
                borderWidth: 2,
              },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.planCardInner}>
              <View style={styles.planHeader}>
                <Text style={[styles.planLabel, { color: '#1A1F2E' }]}>premium</Text>
                {isPremium ? (
                  <View style={[styles.saveBadge, { backgroundColor: '#27AE60' }]}>
                    <Text style={styles.saveBadgeText}>ACTIVE</Text>
                  </View>
                ) : (
                  <View style={[styles.saveBadge, { backgroundColor: '#9B59B6' }]}>
                    <Text style={styles.saveBadgeText}>POPULAR</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceBig, { color: '#9B59B6' }]}>€4.99</Text>
                <Text style={[styles.priceDetail, { color: '#6C757D' }]}>per month</Text>
              </View>
              {isPremium ? (
                <Text style={[styles.planNote, { color: '#27AE60', fontWeight: '700' }]}>
                  ✓ You are already subscribed!
                </Text>
              ) : (
                <View>
                  <Text style={[styles.planNote, { color: '#9B59B6' }]}>
                    💜 7-day free trial, then €4.99/month
                  </Text>
                  <Text style={[styles.planNote, { color: '#6C757D', marginTop: 4, fontSize: 11 }]}>
                    ☕ Just 2 coffees per month
                  </Text>
                </View>
              )}
            </View>
            {isPremium && (
              <View style={[styles.selectedIndicator, { backgroundColor: '#27AE60', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }]}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </View>
            )}
          </Animated.View>

          {/* Features Section */}
          <View style={[styles.featuresSection, { backgroundColor: '#FFFFFF', borderColor: '#E8E8E8' }]}>
            {featuresList.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureRow,
                  index === featuresList.length - 1 && { borderBottomWidth: 0 },
                  { borderBottomColor: '#F5F5F5' },
                ]}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(243, 156, 18, 0.12)' }]}>
                  <Ionicons name={feature.icon as any} size={18} color="#F39C12" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: '#1A1F2E' }]}>{feature.title}</Text>
                  <Text style={[styles.featureDesc, { color: '#6C757D' }]}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              {
                backgroundColor: colors.secondary,
                opacity: isPurchasing || (isLoadingProducts && Platform.OS !== 'web') || isPremium || (!monthlyPackage && (Platform.OS === 'ios' || Platform.OS === 'android')) ? 0.7 : 1,
              },
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || (isLoadingProducts && Platform.OS !== 'web') || isPremium || (!monthlyPackage && (Platform.OS === 'ios' || Platform.OS === 'android'))}
            activeOpacity={0.9}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : isPremium ? (
              <Text style={styles.ctaButtonText}>You are already subscribed ✓</Text>
            ) : isLoadingProducts && (Platform.OS === 'ios' || Platform.OS === 'android') ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : !monthlyPackage && (Platform.OS === 'ios' || Platform.OS === 'android') && !isLoadingProducts ? (
              <Text style={styles.ctaButtonText}>Coming Soon</Text>
            ) : !monthlyPackage ? (
              <Text style={styles.ctaButtonText}>Coming Soon</Text>
            ) : (
              <Text style={styles.ctaButtonText}>Start Free Trial</Text>
            )}
          </TouchableOpacity>

          {/* Auto-renew note */}
          <Text style={[styles.autoRenewNote, { color: '#6C757D' }]}>
            Auto-renews for €4.99/month until canceled
          </Text>

          {/* Restore Purchases */}
          {(Platform.OS === 'ios' || Platform.OS === 'android') && (
            <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases} disabled={isRestoring}>
              {isRestoring ? (
                <ActivityIndicator color="#6C757D" size="small" />
              ) : (
                <Text style={[styles.restoreButtonText, { color: '#6C757D' }]}>Restore Purchases</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Terms of Service & Privacy Policy */}
          <View style={styles.legalLinksContainer}>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => router.push('/terms-of-service')}
            >
              <Text style={[styles.legalLinkText, { color: '#6C757D' }]}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={[styles.legalLinkSeparator, { color: '#6C757D' }]}>•</Text>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => router.push('/privacy-policy')}
            >
              <Text style={[styles.legalLinkText, { color: '#6C757D' }]}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: SCREEN_HEIGHT * 0.18,
    zIndex: 5,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  floatingSparkle: {
    position: 'absolute',
    zIndex: 0,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.26,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 0,
  },
  closeButtonHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    right: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
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
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 58,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerSmallTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerBigTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 5,
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
  planCard: {
    borderRadius: 12,
    marginBottom: 10,
    position: 'relative',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  planCardInner: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  saveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceBig: {
    fontSize: 32,
    fontWeight: '900',
  },
  priceDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  planNote: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  featuresSection: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  ctaButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  autoRenewNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  restoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  legalLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  legalLinkText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalLinkSeparator: {
    fontSize: 12,
    marginHorizontal: 8,
  },
});
