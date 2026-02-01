import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, LoadingSpinner } from '../src/components/common';
import { NotificationCard } from '../src/components/notification/NotificationCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useNotificationStore } from '../src/store/notificationStore';
import { useAuthStore } from '../src/store/authStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    page,
    hasMore,
    loadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadNotifications(1, false);
      }
    }, [isAuthenticated, loadNotifications])
  );

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadNotifications(1, false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, loadNotifications]);

  const handleRefresh = useCallback(async () => {
    await refreshNotifications();
  }, [refreshNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadNotifications(page + 1, true);
    }
  }, [isLoading, hasMore, page, loadNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleNotificationPress = useCallback(
    (notificationId: string) => {
      if (!notifications.find((n) => n._id === notificationId)?.read) {
        markAsRead(notificationId);
      }
    },
    [notifications, markAsRead]
  );

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Notificaties</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Log in om notificaties te zien</Text>
          <GlassButton
            title="Inloggen"
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginButton}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificaties</Text>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Alles gelezen</Text>
          </Pressable>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onMarkAsRead={markAsRead}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          unreadCount > 0 ? (
            <View style={styles.unreadHeader}>
              <Text style={styles.unreadHeaderText}>
                {unreadCount} {unreadCount === 1 ? 'ongelezen notificatie' : 'ongelezen notificaties'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && notifications.length > 0 ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="md" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="lg" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Geen notificaties</Text>
              <Text style={styles.emptySubtext}>
                Je krijgt hier meldingen wanneer iemand je post leuk vindt, reageert of je volgt.
              </Text>
            </View>
          )
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  markAllButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  markAllText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  unreadHeader: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  unreadHeaderText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingFooter: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
    maxWidth: 300,
  },
  loginButton: {
    marginTop: SPACING.lg,
  },
});

