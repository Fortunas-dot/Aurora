import React, { useState, useEffect } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { AuroraCore } from '../../src/components/voice/AuroraCore';
import { Badge } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { messageService } from '../../src/services/message.service';
import { chatWebSocketService } from '../../src/services/chatWebSocket.service';
import { useCallback } from 'react';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  
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
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);
  
  // Reload unread count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadUnreadCount();
      }
    }, [isAuthenticated, loadUnreadCount])
  );
  
  // Setup WebSocket to update unread count in real-time
  useEffect(() => {
    if (!isAuthenticated) return;
    
    chatWebSocketService.connect({
      onNewMessage: () => {
        // Reload unread count when new message arrives
        loadUnreadCount();
      },
      onMessageSent: () => {
        // Reload unread count when message is sent (might affect unread count)
        loadUnreadCount();
      },
      onConversationUpdated: () => {
        // Reload unread count when conversation is updated
        loadUnreadCount();
      },
      onConnected: () => {
        // Reload unread count when connected
        loadUnreadCount();
      },
      onError: () => {},
      onDisconnected: () => {},
    });
    
    return () => {
      // Don't disconnect here as other screens might be using it
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
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
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
                <AuroraCore state="idle" audioLevel={0} size={56} />
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
            <Ionicons name="person" size={size} color={color} />
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
});
