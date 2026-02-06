import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, Avatar, TagChip } from '../../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { userService } from '../../src/services/user.service';
import { groupService } from '../../src/services/group.service';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}) => {
  const { colors } = useTheme();
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }, danger && styles.menuTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [stats, setStats] = useState({
    posts: 0,
    connections: 0,
    groups: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      loadStats();
    }
  }, [isAuthenticated, user?._id]);

  const loadStats = async () => {
    if (!user?._id) return;
    
    setIsLoadingStats(true);
    try {
      // Fetch user profile to get post count and followers count
      const profileResponse = await userService.getUserProfile(user._id);
      if (profileResponse.success && profileResponse.data) {
        const postCount = profileResponse.data.postCount || 0;
        const followersCount = profileResponse.data.followersCount || 0;
        
        // Fetch groups to count joined ones
        // Fetch a reasonable number of groups (100) and count those with isMember: true
        const allGroupsResponse = await groupService.getGroups(1, 100);
        if (allGroupsResponse.success && allGroupsResponse.data) {
          const joinedGroupsCount = allGroupsResponse.data.filter(g => g.isMember).length;
          
          setStats({
            posts: postCount,
            connections: followersCount,
            groups: joinedGroupsCount,
          });
        } else {
          setStats({
            posts: postCount,
            connections: followersCount,
            groups: 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default values on error
      setStats({
        posts: 0,
        connections: 0,
        groups: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (!isAuthenticated || !user) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient as readonly [string, string, string]}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>
        
        <View style={styles.authPrompt}>
          <View style={styles.guestAvatarContainer}>
            <LinearGradient
              colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
              style={[styles.guestAvatar, { borderColor: colors.glass.border }]}
            >
              <Ionicons name="person" size={48} color={colors.primary} />
            </LinearGradient>
          </View>
          <Text style={[styles.authPromptTitle, { color: colors.text }]}>Welcome, Guest</Text>
          <Text style={[styles.authPromptText, { color: colors.textMuted }]}>
            Log in or create an account to use all features
          </Text>
          
          <View style={styles.authButtons}>
            <GlassButton
              title="Log in"
              onPress={() => router.push('/(auth)/login')}
              variant="primary"
              style={styles.authButton}
            />
            <GlassButton
              title="Register"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              style={styles.authButton}
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.backgroundGradient as readonly [string, string, string]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <Pressable style={[styles.headerButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <GlassCard style={styles.profileCard} padding="lg" gradient>
            <View style={styles.profileHeader}>
              <Avatar
                uri={user.avatar}
                name={user.displayName || user.username}
                userId={user._id}
                avatarCharacter={user.avatarCharacter}
                avatarBackgroundColor={user.avatarBackgroundColor}
                size="xl"
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.displayName, { color: colors.text }]}>
                  {user.displayName || user.username}
                </Text>
                <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>
              </View>
              <Pressable 
                style={[styles.editButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
                onPress={() => router.push('/edit-profile')}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </Pressable>
            </View>

            {user.bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{user.bio}</Text>}

            {/* Health Info Tags */}
            {user.healthInfo && (
              <View style={[styles.healthInfoSection, { borderTopColor: colors.glass.border }]}>
                {(user.healthInfo.mentalHealth && user.healthInfo.mentalHealth.length > 0) && (
                  <View style={styles.healthCategory}>
                    <Text style={[styles.healthCategoryLabel, { color: colors.textMuted }]}>Mental health</Text>
                    <View style={styles.healthTags}>
                      {user.healthInfo.mentalHealth.slice(0, 3).map((item, index) => {
                        const condition = typeof item === 'string' ? item : item.condition;
                        const type = typeof item === 'string' ? undefined : item.type;
                        const severity = typeof item === 'string' ? undefined : item.severity;
                        const displayText = type ? `${condition}: ${type}` : condition;
                        return (
                          <View key={index} style={styles.healthTagContainer}>
                            <TagChip label={displayText} size="sm" />
                            {severity && (
                              <View style={[
                                styles.severityIndicator,
                                {
                                  backgroundColor: severity === 'mild' ? colors.success :
                                    severity === 'moderate' ? colors.warning : colors.error,
                                }
                              ]} />
                            )}
                          </View>
                        );
                      })}
                      {user.healthInfo.mentalHealth.length > 3 && (
                        <Text style={[styles.moreTags, { color: colors.textMuted }]}>+{user.healthInfo.mentalHealth.length - 3}</Text>
                      )}
                    </View>
                  </View>
                )}
                {(user.healthInfo.physicalHealth && user.healthInfo.physicalHealth.length > 0) && (
                  <View style={styles.healthCategory}>
                    <Text style={styles.healthCategoryLabel}>Physical health</Text>
                    <View style={styles.healthTags}>
                      {user.healthInfo.physicalHealth.slice(0, 3).map((item, index) => {
                        const condition = typeof item === 'string' ? item : item.condition;
                        const type = typeof item === 'string' ? undefined : item.type;
                        const severity = typeof item === 'string' ? undefined : item.severity;
                        const displayText = type ? `${condition}: ${type}` : condition;
                        return (
                          <View key={index} style={styles.healthTagContainer}>
                            <TagChip label={displayText} size="sm" />
                            {severity && (
                              <View style={[
                                styles.severityIndicator,
                                {
                                  backgroundColor: severity === 'mild' ? colors.success :
                                    severity === 'moderate' ? colors.warning : colors.error,
                                }
                              ]} />
                            )}
                          </View>
                        );
                      })}
                      {user.healthInfo.physicalHealth.length > 3 && (
                        <Text style={styles.moreTags}>+{user.healthInfo.physicalHealth.length - 3}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Stats */}
            <View style={[styles.statsRow, { borderTopColor: colors.glass.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {isLoadingStats ? '...' : stats.posts}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Posts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.glass.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {isLoadingStats ? '...' : stats.connections}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Connecties</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.glass.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {isLoadingStats ? '...' : stats.groups}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Groups</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>Account</Text>
          <GlassCard padding={0}>
            <MenuItem
              icon="person-outline"
              title="Edit profile"
              subtitle="Name, bio, photo"
              onPress={() => router.push('/edit-profile')}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <MenuItem
              icon="heart-outline"
              title="Health Information"
              subtitle="Mental & physical health"
              onPress={() => router.push('/health-info')}
            />
          </GlassCard>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>App</Text>
          <GlassCard padding={0}>
            <MenuItem
              icon="settings-outline"
              title="Settings"
              subtitle="App settings"
              onPress={() => router.push('/settings')}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => router.push('/help-support')}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <MenuItem
              icon="bulb-outline"
              title="Submit Ideas"
              subtitle="Share your ideas for the app"
              onPress={() => router.push('/ideas')}
            />
          </GlassCard>
        </View>

        <View style={styles.menuSection}>
          <GlassCard padding={0}>
            <MenuItem
              icon="log-out-outline"
              title="Uitloggen"
              onPress={handleLogout}
              showArrow={false}
              danger
            />
          </GlassCard>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>Aurora v1.0.0</Text>
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
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    // color will be set inline with colors
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor and borderColor will be set inline with colors
  },
  profileSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  profileCard: {},
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  displayName: {
    ...TYPOGRAPHY.h3,
    // color will be set inline with colors
  },
  username: {
    ...TYPOGRAPHY.body,
    // color will be set inline with colors
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor and borderColor will be set inline with colors
  },
  bio: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
    // color will be set inline with colors
  },
  healthInfoSection: {
    marginBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    // borderTopColor will be set inline with colors
  },
  healthCategory: {
    marginBottom: SPACING.sm,
  },
  healthCategoryLabel: {
    ...TYPOGRAPHY.captionMedium,
    marginBottom: SPACING.xs,
    // color will be set inline with colors
  },
  healthTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  healthTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreTags: {
    ...TYPOGRAPHY.caption,
    // color will be set inline with colors
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    // borderTopColor will be set inline with colors
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    // color will be set inline with colors
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    // color will be set inline with colors
  },
  statDivider: {
    width: 1,
    height: 32,
    // backgroundColor will be set inline with colors
  },
  menuSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  menuSectionTitle: {
    ...TYPOGRAPHY.captionMedium,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    // color will be set inline with colors
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDanger: {
    // backgroundColor will be set inline with colors
  },
  menuContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuTitle: {
    ...TYPOGRAPHY.body,
    // color will be set inline with colors
  },
  menuTitleDanger: {
    // color will be set inline with colors
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginLeft: 68,
    // backgroundColor will be set inline with colors
  },
  version: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginVertical: SPACING.lg,
    // color will be set inline with colors
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  guestAvatarContainer: {
    marginBottom: SPACING.lg,
  },
  guestAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    // borderColor will be set inline with colors
  },
  authPromptTitle: {
    ...TYPOGRAPHY.h2,
    // color will be set inline with colors
  },
  authPromptText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.xs,
    textAlign: 'center',
    // color will be set inline with colors
  },
  authButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  authButton: {
    minWidth: 120,
  },
});

