import React, { useState, useEffect } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { AuroraCore as BlobsAuroraCore } from '../../src/components/voice/AuroraCore.blobs';
import { Badge } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { messageService } from '../../src/services/message.service';
import { chatWebSocketService } from '../../src/services/chatWebSocket.service';
import { useCallback } from 'react';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { isActive: isOnboardingActive, finishOnboarding } = useOnboardingStore();
  const { unreadByType, loadNotifications } = useNotificationStore();
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  
  // Auto-finish onboarding if user is logged in and navigates to tabs
  // This prevents users from getting stuck with hidden tab bar after login
  // If a logged-in user reaches the tabs, they shouldn't be in onboarding mode
  useEffect(() => {
    if (isAuthenticated && isOnboardingActive) {
      // User is logged in and in tabs, but onboarding is still active
      // This can happen if onboarding was started but not finished
      // Auto-finish to prevent stuck state
      finishOnboarding();
    }
  }, [isAuthenticated, isOnboardingActive, finishOnboarding]);
  
  // Load total unread messages count
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setTotalUnreadMessages(0);
      return;
    }
    
    try {
      const response = await messageService.getConversations();
      if (response.success && response.data) {
        const total = response.data.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
        setTotalUnreadMessages(total);
      }
    } catch (error) {
      console.error('Error loading unread messages count:', error);
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    loadUnreadCount();
    
    // Also load notifications to get unreadByType
    if (isAuthenticated) {
      loadNotifications(1, false);
    }
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
      if (isAuthenticated) {
        loadNotifications(1, false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount, isAuthenticated, loadNotifications]);
  
  // Reload unread count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadUnreadCount();
      }
    }, [isAuthenticated, loadUnreadCount])
  );
  
  // Setup WebSocket to update unread count in real-time
  // _layout.tsx is the main connection owner - it establishes and maintains the connection
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Establish the WebSocket connection (this is the primary connect point)
    chatWebSocketService.connect();

    // Subscribe to events for unread badge updates
    const unsubNewMessage = chatWebSocketService.on('new_message', () => {
        loadUnreadCount();
    });
    const unsubMessageSent = chatWebSocketService.on('message_sent', () => {
        loadUnreadCount();
    });
    const unsubConversationUpdated = chatWebSocketService.on('conversation_updated', () => {
        loadUnreadCount();
    });
    const unsubConnected = chatWebSocketService.on('connected', () => {
        loadUnreadCount();
    });
    
    return () => {
      unsubNewMessage();
      unsubMessageSent();
      unsubConversationUpdated();
      unsubConnected();
      // Disconnect when tabs layout unmounts (user logged out or app closed)
      chatWebSocketService.disconnect();
    };
  }, [isAuthenticated, loadUnreadCount]);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            display: isOnboardingActive ? 'none' : 'flex', // Hide tab bar during onboarding
          },
        ],
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
          )
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
            <Ionicons name="home" size={size} color={color} />
              {unreadByType.feed > 0 && (
                <Badge count={unreadByType.feed} size="sm" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
            <Ionicons name="people" size={size} color={color} />
              {unreadByType.groups > 0 && (
                <Badge count={unreadByType.groups} size="sm" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="aurora"
        options={{
          title: 'Aurora',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.auroraIconContainer}>
              <View style={styles.auroraCoreWrapper}>
                <BlobsAuroraCore state="idle" audioLevel={0} size={56} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.chatIconContainer}>
              <Ionicons name="chatbubbles" size={size} color={color} />
              {totalUnreadMessages > 0 && (
                <Badge count={totalUnreadMessages} size="sm" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
            <Ionicons name="person" size={size} color={color} />
              {unreadByType.profile > 0 && (
                <Badge count={unreadByType.profile} size="sm" />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    elevation: 0,
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    // backgroundColor and borderTopColor will be set inline with colors
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tabBarIcon: {
    marginTop: 4,
  },
  auroraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    overflow: 'visible',
  },
  auroraCoreWrapper: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  chatIconContainer: {
    position: 'relative',
  },
  tabIconContainer: {
    position: 'relative',
  },
});
