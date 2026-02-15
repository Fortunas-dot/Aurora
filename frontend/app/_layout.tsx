import React, { useEffect, useRef, useCallback } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function RootLayout() {
  const { checkAuth, isLoading, isAuthenticated, user } = useAuthStore();
  const { updateUnreadCount, loadNotifications } = useNotificationStore();
  const { loadSettings } = useSettingsStore();
  const { colors, isDark } = useTheme();
  const { aiConsentStatus, loadConsent } = useConsentStore();
  const { checkPremiumStatus } = usePremiumStore();

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        // First check authentication status (this is critical for app state)
        await checkAuth();
        
        if (!isMounted) return;
        
        // Then load settings + consent
        await loadSettings();
        await loadConsent();
        
        if (!isMounted) return;
        
        // Initialize PostHog (non-blocking) - only for analytics, not tracking
        posthogService.initialize().catch((error) => {
          console.warn('PostHog initialization failed:', error);
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

      // Setup notification listeners
      const cleanup = pushNotificationService.setupNotificationListeners(
        (notification) => {
          console.log('Notification received:', notification);
          // Update unread count when notification is received
          updateUnreadCount();
        },
        (response) => {
          console.log('Notification tapped:', response);
          const data = response.notification.request.content.data;
          // Handle navigation based on notification data
          // This will be handled by the notification card component
        }
      );

      return () => {
        cleanup();
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
      // Don't reset PostHog here - let logout handle it
      // posthogService.reset();
    }
  }, [isAuthenticated, user, checkPremiumStatus]);

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
      console.error('Notification WebSocket error:', error);
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

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ResponsiveWrapper>
          <LoadingScreen colors={colors} />
        </ResponsiveWrapper>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ResponsiveWrapper>
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
        </Stack>
      </ResponsiveWrapper>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
