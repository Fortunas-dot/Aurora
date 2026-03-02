import React, { useEffect, useRef, useCallback } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useTheme } from '../src/hooks/useTheme';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { pushNotificationService } from '../src/services/pushNotification.service';
import { notificationWebSocketService } from '../src/services/notificationWebSocket.service';
import { posthogService, POSTHOG_EVENTS } from '../src/services/posthog.service';
import { useConsentStore } from '../src/store/consentStore';
import { ResponsiveWrapper } from '../src/components/common/ResponsiveWrapper';
import { revenueCatService } from '../src/services/revenuecat.service';
import { usePremiumStore } from '../src/store/premiumStore';
import { trackingTransparencyService } from '../src/services/trackingTransparency.service';
import { initializeFacebookSDK, facebookAnalytics } from '../src/services/facebookAnalytics.service';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PostHogProvider, PostHog, usePostHog } from 'posthog-react-native';
import * as Updates from 'expo-updates';

function LoadingScreen({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      style={styles.loadingContainer}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  );
}

// Read PostHog configuration similar to PawBuddies guide
// Fallback to the provided Aurora PostHog API key if env/extra are not set
const posthogApiKey =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_POSTHOG_API_KEY) ||
  (typeof Constants !== 'undefined' &&
    (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_POSTHOG_API_KEY) ||
  (typeof Constants !== 'undefined' && Constants.expoConfig?.extra?.POSTHOG_API_KEY) ||
  'phc_6BMEJjnxrz3BAfLj8Y1N0lOizGAhnk1d9XNp3Tl2HRB';

const posthogHost =
  (typeof Constants !== 'undefined' && Constants.expoConfig?.extra?.POSTHOG_HOST) ||
  'https://eu.i.posthog.com';

// Create a single global PostHog client if we have a valid API key
const posthogClient = posthogApiKey
  ? new PostHog(posthogApiKey, {
      host: posthogHost,
      enableSessionReplay: true,
      autocapture: true,
      captureScreenViews: true,
      debug: __DEV__,
    })
  : null;

function PostHogInitializer() {
  const postHog = usePostHog();

  useEffect(() => {
    if (postHog) {
      posthogService.initialize(postHog);
      console.log('✅ PostHog initialized via PostHogProvider');
    }
  }, [postHog]);

  return null;
}

function PostHogScreenTracker() {
  const pathname = usePathname();
  const postHog = usePostHog();
  const lastTrackedPath = useRef<string | null>(null);

  // Track screen views
  useEffect(() => {
    if (!postHog || !pathname || !posthogService.isInitialized()) return;

    const screenName = pathname.replace(/^\//, '') || 'home';

    posthogService.trackScreenView(screenName, {
      pathname,
      timestamp: new Date().toISOString(),
    });

    lastTrackedPath.current = pathname;
  }, [pathname, postHog]);

  // Track daily app opens (once per day per device)
  useEffect(() => {
    if (!postHog || !posthogService.isInitialized()) return;

    const trackDailyAppOpen = async () => {
      try {
        const lastAppOpenDate = await AsyncStorage.getItem('lastPostHogAppOpen');
        const today = new Date().toDateString();

        if (lastAppOpenDate !== today) {
          posthogService.trackEvent(POSTHOG_EVENTS.APP_OPENED_DAILY, {
            date: today,
            timestamp: new Date().toISOString(),
          });

          await AsyncStorage.setItem('lastPostHogAppOpen', today);
        }
      } catch (error) {
        console.warn('PostHog daily app open tracking failed:', error);
      }
    };

    trackDailyAppOpen();
  }, [postHog]);

  return null;
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { checkAuth, isLoading, isAuthenticated, user } = useAuthStore();
  const { updateUnreadCount, loadNotifications } = useNotificationStore();
  const { loadSettings } = useSettingsStore();
  const { colors, isDark } = useTheme();
  const { aiConsentStatus, loadConsent, resetConsent } = useConsentStore();
  const { checkPremiumStatus } = usePremiumStore();

  // Load Unbounded Regular font for headers
  // Note: Make sure Unbounded-Regular.ttf is in frontend/assets/fonts/
  const [fontsLoaded, fontError] = useFonts({
    'Unbounded-Regular': require('../assets/fonts/Unbounded-Regular.ttf'),
  });

  // Log font loading status
  useEffect(() => {
    if (fontError) {
      console.warn('⚠️ Font loading error:', fontError);
    } else if (fontsLoaded) {
      console.log('✅ Unbounded-Regular font loaded successfully');
    }
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        // Force English locale for native components (ImagePicker, etc.)
        // Note: Locale is forced via app.config.js (CFBundleDevelopmentRegion for iOS, plugin for Android)
        // This requires a new build to take effect
        
        // First check authentication status (this is critical for app state)
        await checkAuth();
        
        if (!isMounted) return;
        
        // Then load settings + consent
        await loadSettings();
        await loadConsent();
        
        if (!isMounted) return;
        
        // Check for OTA updates (only in production builds, not in development)
        if (!__DEV__ && Updates.isEnabled) {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              console.log('📦 OTA update available, downloading...');
              await Updates.fetchUpdateAsync();
              // Reload the app to apply the update
              await Updates.reloadAsync();
            }
          } catch (error) {
            console.warn('⚠️ Error checking for OTA updates:', error);
            // Don't block app initialization if update check fails
          }
        }
        
        if (!isMounted) return;
        
        // Request App Tracking Transparency permission (iOS only, required before analytics)
        // This should be done before initializing analytics services like PostHog / Facebook
        // Wrap in try-catch to handle any module loading errors gracefully
        try {
          // Use a setTimeout to defer the call and avoid bundling issues
          // This allows the app to start even if the module has issues
          const trackingAllowed = await Promise.race([
            trackingTransparencyService.requestPermission(),
            new Promise<boolean>((resolve) => {
              // Timeout after 1 second - if module loading takes too long, assume it's not available
              setTimeout(() => resolve(true), 1000);
            }),
          ]);
          
          if (trackingAllowed) {
            console.log('✅ Tracking permission granted, initializing analytics');
          } else {
            console.log('⚠️ Tracking permission denied, analytics will be limited');
          }
        } catch (error: any) {
          // Handle any errors gracefully - module may not be available in dev/web
          if (
            error?.message?.includes('native module') ||
            error?.message?.includes('Cannot find') ||
            error?.message?.includes('ExpoTrackingTransparency') ||
            error?.code === 'MODULE_NOT_FOUND'
          ) {
            console.log('⚠️ Tracking transparency not available (expected in dev/web)');
          } else {
            console.warn('⚠️ Error requesting tracking permission:', error);
          }
        }
        
        // Initialize analytics / monetization SDKs (non-blocking)
        // PostHog is initialized via PostHogProvider + PostHogInitializer
        // Initialize Facebook SDK so Meta can recognize the SDK is installed
        initializeFacebookSDK().catch((error) => {
          console.warn('Facebook SDK initialization failed:', error);
        });

        // Initialize RevenueCat (non-blocking)
        revenueCatService.initialize().catch((error) => {
          console.warn('RevenueCat initialization failed:', error);
        });
      } catch (error) {
        console.error('Initialization error:', error);
        // Ensure loading state is cleared even on error
        if (isMounted) {
          useAuthStore.setState({ isLoading: false });
        }
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Initialize push notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      // Register for push notifications
      pushNotificationService.registerForPushNotifications().catch(console.error);

      // Setup notification listeners (async)
      let cleanup: (() => void) | null = null;
      pushNotificationService.setupNotificationListeners(
        (notification) => {
          console.log('Notification received:', notification);
          // Update unread count when notification is received
          updateUnreadCount();
        },
        (response) => {
          console.log('Notification tapped:', response);
          const data = response.notification.request.content.data as {
            type?: string;
            relatedUserId?: string;
            relatedPostId?: string;
            relatedGroupId?: string;
            relatedJournalId?: string;
            relatedEntryId?: string;
            notificationId?: string;
          };
          
          // Handle navigation based on notification type
          if (data) {
            switch (data.type) {
              case 'like':
              case 'comment':
                if (data.relatedPostId) {
                  router.push(`/post/${data.relatedPostId}`);
                }
                break;
              case 'follow':
                if (data.relatedUserId) {
                  router.push(`/user/${data.relatedUserId}`);
                }
                break;
              case 'message':
                if (data.relatedUserId) {
                  router.push(`/conversation/${data.relatedUserId}`);
                }
                break;
              case 'group_invite':
              case 'group_join':
                if (data.relatedGroupId) {
                  router.push(`/group/${data.relatedGroupId}`);
                }
                break;
              case 'journal_entry':
                if (data.relatedEntryId) {
                  router.push(`/journal/${data.relatedEntryId}`);
                } else if (data.relatedJournalId) {
                  router.push(`/journal/view/${data.relatedJournalId}`);
                } else {
                  router.push('/notifications');
                }
                break;
              case 'journal_streak':
                // Take user straight to their journal insights
                router.push('/journal/insights');
                break;
              default:
                // Default: go to notifications screen
                router.push('/notifications');
            }
          }
        }
      ).then((cleanupFn) => {
        cleanup = cleanupFn;
      }).catch(console.error);

      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }
  }, [isAuthenticated, user, updateUnreadCount]);

  // Identify user in PostHog and RevenueCat when authenticated (for app restarts)
  useEffect(() => {
    if (isAuthenticated && user) {
      posthogService.identify(user._id, {
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        last_seen: new Date().toISOString(),
      });
      
      // Track app opened event when user is already authenticated (app restart)
      posthogService.trackEvent(POSTHOG_EVENTS.APP_OPENED, {
        timestamp: new Date().toISOString(),
      });

      // Identify user in RevenueCat
      revenueCatService.identifyUser(user._id).catch((error) => {
        console.warn('RevenueCat identify user failed:', error);
      });

      // Check premium status
      checkPremiumStatus().catch((error) => {
        console.warn('Failed to check premium status:', error);
      });
    } else if (!isAuthenticated) {
      // Reset RevenueCat user on logout
      revenueCatService.resetUser().catch((error) => {
        console.warn('RevenueCat reset user failed:', error);
      });
      
      // Reset AI consent state on logout (each user must provide their own consent)
      resetConsent().catch((error) => {
        console.warn('Failed to reset AI consent:', error);
      });
      
      // Don't reset PostHog here - let logout handle it
      // posthogService.reset();
    }
  }, [isAuthenticated, user, checkPremiumStatus, resetConsent]);

  // Track screen views in Facebook (PostHog screen tracking is handled by PostHogScreenTracker)
  useEffect(() => {
    if (!pathname) return;
    const screenName = pathname.replace(/^\//, '') || 'home';
    facebookAnalytics.logScreenView(screenName);
  }, [pathname]);

  // Setup WebSocket connection for real-time notifications
  // Use refs to store stable callbacks that don't cause re-renders
  const wsCallbacksRef = useRef({
    onNotification: (notification: any) => {
      console.log('WebSocket notification received:', notification);
      // Add notification to store
      useNotificationStore.getState().loadNotifications(1, false);
      useNotificationStore.getState().updateUnreadCount();
    },
    onUnreadCount: (count: number) => {
      console.log('WebSocket unread count:', count);
      // Update store with new count
      useNotificationStore.setState({ unreadCount: count });
    },
    onConnected: () => {
      console.log('✅ Notification WebSocket connected');
    },
    onDisconnected: () => {
      console.log('❌ Notification WebSocket disconnected');
    },
    onError: (error: Error) => {
      // Only log WebSocket errors in development mode
      // These are expected during network issues and shouldn't spam production logs
      if (__DEV__) {
        console.warn('Notification WebSocket error:', error.message);
      }
    },
  });

  // Update callbacks ref when store actions might change (though they shouldn't)
  useEffect(() => {
    wsCallbacksRef.current.onNotification = (notification: any) => {
      console.log('WebSocket notification received:', notification);
      useNotificationStore.getState().loadNotifications(1, false);
      useNotificationStore.getState().updateUnreadCount();
    };
  }, []); // Empty deps - these are stable Zustand actions

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      // Only connect if not already connected to prevent duplicate connections
      if (!notificationWebSocketService.isConnected()) {
        notificationWebSocketService.connect(wsCallbacksRef.current);
      }

      return () => {
        // Only disconnect on unmount or when auth/user changes
        notificationWebSocketService.disconnect();
      };
    } else {
      // Disconnect if not authenticated
      notificationWebSocketService.disconnect();
    }
  }, [isAuthenticated, user?._id]); // Only depend on auth state and user ID

  // Show loading screen while app is initializing
  // Don't block on font loading - fonts will load in background and apply when ready
  const content = isLoading ? (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ResponsiveWrapper>
        <LoadingScreen colors={colors} />
      </ResponsiveWrapper>
    </SafeAreaProvider>
  ) : (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ResponsiveWrapper>
        <PostHogInitializer />
        <PostHogScreenTracker />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="email-verified" />
          <Stack.Screen
            name="voice"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="text-chat"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </ResponsiveWrapper>
    </SafeAreaProvider>
  );

  if (posthogClient) {
    return <PostHogProvider client={posthogClient}>{content}</PostHogProvider>;
  }

  return content;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
