import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { pushNotificationService } from '../src/services/pushNotification.service';
import { notificationWebSocketService } from '../src/services/notificationWebSocket.service';
import { posthogService } from '../src/services/posthog.service';

function LoadingScreen() {
  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.loadingContainer}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
    </LinearGradient>
  );
}

export default function RootLayout() {
  const { checkAuth, isLoading, isAuthenticated, user } = useAuthStore();
  const { updateUnreadCount, loadNotifications } = useNotificationStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    checkAuth();
    loadSettings();
    // Initialize PostHog
    posthogService.initialize();
  }, []);

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

  // Identify user in PostHog when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      posthogService.identify(user._id, {
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      });
    } else if (!isAuthenticated) {
      posthogService.reset();
    }
  }, [isAuthenticated, user]);

  // Setup WebSocket connection for real-time notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      notificationWebSocketService.connect({
        onNotification: (notification) => {
          console.log('WebSocket notification received:', notification);
          // Add notification to store
          loadNotifications(1, false);
          updateUnreadCount();
        },
        onUnreadCount: (count) => {
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
        onError: (error) => {
          console.error('Notification WebSocket error:', error);
        },
      });

      return () => {
        notificationWebSocketService.disconnect();
      };
    }
  }, [isAuthenticated, user, loadNotifications, updateUnreadCount]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: COLORS.background,
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
