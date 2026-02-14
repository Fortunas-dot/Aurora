import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, LoadingSpinner, Avatar } from '../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore, NotificationPreferences } from '../src/store/settingsStore';
import { useAuthStore } from '../src/store/authStore';
import { userService, UserProfile } from '../src/services/user.service';
import { i18n, Language } from '../src/utils/i18n';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
}) => {
  const { colors } = useTheme();
  return (
    <Pressable style={[styles.menuItem, { borderBottomColor: colors.glass.border }]} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: colors.glass.backgroundLight }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.menuRight}>{rightComponent}</View>}
      {showArrow && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );
};

interface SwitchItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SwitchItem: React.FC<SwitchItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.menuItem, { borderBottomColor: colors.glass.border }]}>
      <View style={[styles.menuIconContainer, { backgroundColor: colors.glass.backgroundLight }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.glass.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const {
    fontFamily,
    auroraStyle,
    notificationPreferences,
    isLoading,
    setFontFamily,
    setAuroraStyle,
    setNotificationPreference,
    loadSettings,
  } = useSettingsStore();

  const [t, setT] = useState(() => i18n.getTranslations());
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
      loadBlockedUsers();
    }
  }, [isAuthenticated, loadSettings]);

  const loadBlockedUsers = async () => {
    setIsLoadingBlocked(true);
    try {
      const response = await userService.getBlockedUsers();
      if (response.success && response.data) {
        setBlockedUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          style: 'default',
          onPress: async () => {
            try {
              const response = await userService.blockUser(userId);
              if (response.success) {
                // Remove from list
                setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
                Alert.alert('Success', 'User unblocked successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to unblock user');
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Initialize translations (app is always in English)
  useEffect(() => {
    setT(i18n.getTranslations());
  }, []);

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
          <Pressable style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="settings-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authPromptTitle, { color: colors.text }]}>Log in to access settings</Text>
          <GlassButton
            title={t.back}
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            style={styles.authButton}
          />
        </View>
      </LinearGradient>
    );
  }

  if (isLoading) {
    return (
      <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.loading}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
        <Pressable style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Settings */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t.appSettings}</Text>
          <GlassCard padding={0}>
            <MenuItem
              icon="text-outline"
              title="Font"
              subtitle={fontFamily === 'system' ? 'System Default' : fontFamily.charAt(0).toUpperCase() + fontFamily.slice(1)}
              onPress={() => router.push('/font-settings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="sparkles-outline"
              title="Aurora Style"
              subtitle={
                auroraStyle === 'organic' ? 'Organic & Alive' :
                auroraStyle === 'classic' ? 'Classic Sphere' :
                'Organic Blobs'
              }
              onPress={() => router.push('/aurora-style')}
            />
          </GlassCard>
        </View>

        {/* Privacy Settings */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t.privacySettings}</Text>
          
          {/* Account Data & Privacy */}
          <GlassCard padding={0} style={styles.menuCard}>
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>{t.accountData}</Text>
            <MenuItem
              icon="trash-outline"
              title="Delete account and all data"
              subtitle={t.deleteAccountDesc}
              onPress={() => {
                Alert.alert(
                  t.deleteAccount,
                  'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, posts, comments, and messages.',
                  [
                    { text: t.cancel, style: 'cancel' },
                    {
                      text: t.deleteAccount,
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert(
                          'Confirm Deletion',
                          'This will permanently delete your account. Type DELETE to confirm.',
                          [
                            { text: t.cancel, style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  const response = await userService.deleteAccount();
                                  
                                  if (response.success) {
                                    Alert.alert(
                                      'Account Deleted',
                                      'Your account and all associated data have been permanently deleted.',
                                      [
                                        {
                                          text: 'OK',
                                          onPress: () => {
                                            useAuthStore.getState().logout();
                                            router.replace('/(auth)/login');
                                          },
                                        },
                                      ]
                                    );
                                  } else {
                                    Alert.alert('Error', response.message || 'Failed to delete account');
                                  }
                                } catch (error: any) {
                                  Alert.alert('Error', error.message || 'Failed to delete account');
                                }
                              },
                            },
                          ]
                        );
                      },
                    },
                  ]
                );
              }}
            />
          </GlassCard>

          {/* Privacy Policy & Terms */}
          <GlassCard padding={0} style={styles.menuCard}>
            <MenuItem
              icon="document-text-outline"
              title={t.privacyPolicy}
              subtitle="Read our privacy policy"
              onPress={() => router.push('/privacy-policy')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-outline"
              title={t.termsOfService}
              subtitle="Read our terms of service"
              onPress={() => router.push('/terms-of-service')}
            />
          </GlassCard>
        </View>

        {/* Notification Preferences */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t.notificationSettings}</Text>
          <GlassCard padding={0}>
            <SwitchItem
              icon="notifications-outline"
              title={t.pushNotifications}
              subtitle={t.pushNotificationsDesc}
              value={notificationPreferences.pushEnabled}
              onValueChange={(value) =>
                setNotificationPreference('pushEnabled', value)
              }
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="mail-outline"
              title={t.emailNotifications}
              subtitle={t.emailNotificationsDesc}
              value={notificationPreferences.emailEnabled}
              onValueChange={(value) =>
                setNotificationPreference('emailEnabled', value)
              }
            />
          </GlassCard>
        </View>

        {/* Blocked Users */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Blocked Users</Text>
          <GlassCard padding={0}>
            {isLoadingBlocked ? (
              <View style={styles.blockedLoadingContainer}>
                <LoadingSpinner size="sm" />
              </View>
            ) : blockedUsers.length === 0 ? (
              <View style={styles.blockedEmptyContainer}>
                <Ionicons name="ban-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.blockedEmptyText, { color: colors.textMuted }]}>
                  No blocked users
                </Text>
              </View>
            ) : (
              blockedUsers.map((blockedUser, index) => (
                <React.Fragment key={blockedUser._id}>
                  <Pressable
                    style={styles.blockedUserItem}
                    onPress={() => router.push(`/user/${blockedUser._id}`)}
                  >
                    <Avatar
                      uri={blockedUser.avatar}
                      name={blockedUser.displayName || blockedUser.username}
                      userId={blockedUser._id}
                      avatarCharacter={blockedUser.avatarCharacter}
                      avatarBackgroundColor={blockedUser.avatarBackgroundColor}
                      size="md"
                    />
                    <View style={styles.blockedUserInfo}>
                      <Text style={[styles.blockedUserName, { color: colors.text }]}>
                        {blockedUser.displayName || blockedUser.username}
                      </Text>
                      <Text style={[styles.blockedUserUsername, { color: colors.textMuted }]}>
                        @{blockedUser.username}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.unblockButton, { backgroundColor: colors.glass.backgroundLight, borderColor: colors.glass.border }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleUnblock(blockedUser._id, blockedUser.displayName || blockedUser.username);
                      }}
                    >
                      <Ionicons name="ban" size={16} color={colors.error} />
                      <Text style={[styles.unblockButtonText, { color: colors.error }]}>
                        Unblock
                      </Text>
                    </Pressable>
                  </Pressable>
                  {index < blockedUsers.length - 1 && (
                    <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
                  )}
                </React.Fragment>
              ))
            )}
          </GlassCard>
        </View>
      </ScrollView>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuSectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodyMedium,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  menuRight: {
    marginLeft: SPACING.sm,
  },
  menuDivider: {
    height: 1,
    marginLeft: SPACING.md + 40 + SPACING.md,
  },
  subsectionTitle: {
    ...TYPOGRAPHY.captionMedium,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
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
    minWidth: 200,
  },
  menuCard: {
    marginTop: SPACING.md,
  },
  blockedLoadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  blockedEmptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  blockedEmptyText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
  },
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  blockedUserInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  blockedUserName: {
    ...TYPOGRAPHY.bodyMedium,
  },
  blockedUserUsername: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  unblockButtonText: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
  },
});

