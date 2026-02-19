import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, Avatar, LoadingSpinner } from '../../src/components/common';
import { PostCard } from '../../src/components/post/PostCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { userService, UserProfile } from '../../src/services/user.service';
import { postService, Post } from '../../src/services/post.service';
import { shareService } from '../../src/services/share.service';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { language } = useSettingsStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!id) return;

    try {
      const response = await userService.getUserProfile(id);
      if (response.success && response.data) {
        setProfile(response.data);
        setIsFollowing(response.data.isFollowing || false);
        setIsBlocked(response.data.isBlocked || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [id]);

  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!id) return;

    try {
      const response = await postService.getUserPosts(id, pageNum, 20);
      if (response.success && response.data) {
        if (append) {
          setPosts((prev) => [...prev, ...response.data!]);
        } else {
          setPosts(response.data || []);
        }

        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadProfile(), loadPosts(1, false)]);
      setIsLoading(false);
    };
    loadData();
  }, [loadProfile, loadPosts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([loadProfile(), loadPosts(1, false)]);
    setIsRefreshing(false);
  }, [loadProfile, loadPosts]);

  const handleFollow = async () => {
    if (!id || !isAuthenticated || isTogglingFollow) return;

    setIsTogglingFollow(true);
    try {
      const response = await userService.followUser(id);
      if (response.success) {
        // Update following state - response.data might be undefined, so toggle it
        if (response.data?.isFollowing !== undefined) {
          setIsFollowing(response.data.isFollowing);
        } else {
          // If response doesn't have isFollowing, toggle it
          setIsFollowing(prev => !prev);
        }
        // Reload profile to update counts
        await loadProfile();
      } else {
        console.error('Follow failed:', response.message);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleBlock = async () => {
    if (!id || !isAuthenticated || isTogglingBlock) return;

    const action = isBlocked ? 'unblock' : 'block';
    Alert.alert(
      `${action === 'block' ? 'Block' : 'Unblock'} User`,
      `Are you sure you want to ${action} this user? ${action === 'block' ? 'Their content will no longer appear in your feed.' : ''}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: action === 'block' ? 'Block' : 'Unblock',
          style: action === 'block' ? 'destructive' : 'default',
          onPress: async () => {
            setIsTogglingBlock(true);
            try {
              const response = await userService.blockUser(id);
              if (response.success && response.data) {
                setIsBlocked(response.data.isBlocked);
                // If blocking, also unfollow
                if (response.data.isBlocked && isFollowing) {
                  setIsFollowing(false);
                }
                // Reload profile to update counts
                await loadProfile();
                Alert.alert(
                  'Success',
                  response.data.isBlocked
                    ? 'User blocked successfully. Their content will no longer appear in your feed.'
                    : 'User unblocked successfully.'
                );
              } else {
                Alert.alert('Error', response.message || `Failed to ${action} user`);
              }
            } catch (error) {
              console.error(`Error ${action}ing user:`, error);
              Alert.alert('Error', `Failed to ${action} user. Please try again.`);
            } finally {
              setIsTogglingBlock(false);
            }
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    if (!id || !isAuthenticated) return;

    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: async () => {
            try {
              const response = await userService.reportUser(id, 'spam');
              if (response.success) {
                Alert.alert('Success', 'User reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report user');
              }
            } catch (error) {
              console.error('Error reporting user:', error);
              Alert.alert('Error', 'Failed to report user');
            }
          },
        },
        {
          text: 'Harassment',
          onPress: async () => {
            try {
              const response = await userService.reportUser(id, 'harassment');
              if (response.success) {
                Alert.alert('Success', 'User reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report user');
              }
            } catch (error) {
              console.error('Error reporting user:', error);
              Alert.alert('Error', 'Failed to report user');
            }
          },
        },
        {
          text: 'Inappropriate',
          onPress: async () => {
            try {
              const response = await userService.reportUser(id, 'inappropriate');
              if (response.success) {
                Alert.alert('Success', 'User reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report user');
              }
            } catch (error) {
              console.error('Error reporting user:', error);
              Alert.alert('Error', 'Failed to report user');
            }
          },
        },
        {
          text: 'Impersonation',
          onPress: async () => {
            try {
              const response = await userService.reportUser(id, 'impersonation');
              if (response.success) {
                Alert.alert('Success', 'User reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report user');
              }
            } catch (error) {
              console.error('Error reporting user:', error);
              Alert.alert('Error', 'Failed to report user');
            }
          },
        },
      ]
    );
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, true);
    }
  };

  if (isLoading && !profile) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            User not found
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const isOwnProfile = currentUser?._id === id;

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {profile.displayName || profile.username}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Card */}
        <GlassCard style={styles.profileCard} padding="lg" gradient>
          {/* More options button (top right) */}
          {!isOwnProfile && isAuthenticated && (
            <Pressable
              style={styles.moreOptionsButton}
              onPress={() => {
                Alert.alert(
                  'Options',
                  `What would you like to do with @${profile.username}?`,
                  [
                    {
                      text: isBlocked ? 'Unblock User' : 'Block User',
                      style: isBlocked ? 'default' : 'destructive',
                      onPress: handleBlock,
                    },
                    {
                      text: 'Report User',
                      style: 'destructive',
                      onPress: handleReportUser,
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textSecondary} />
            </Pressable>
          )}
          
          {/* Edit button for own profile (top right) */}
          {isOwnProfile && (
            <Pressable
              style={styles.moreOptionsButton}
              onPress={() => router.push('/edit-profile')}
            >
              <Ionicons name="pencil" size={18} color={COLORS.primary} />
            </Pressable>
          )}

          <View style={styles.profileHeader}>
            <Avatar
              uri={profile.avatar}
              name={profile.displayName || profile.username}
              userId={profile._id}
              avatarCharacter={profile.avatarCharacter}
              avatarBackgroundColor={profile.avatarBackgroundColor}
              size="xl"
            />
            <View style={styles.profileInfoContainer}>
              <View style={styles.profileInfo}>
                <Text style={styles.displayName} numberOfLines={2} ellipsizeMode="tail">
                  {profile.displayName || profile.username}
                </Text>
                <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                  @{profile.username}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Follow button - full width below profile info */}
              {!isOwnProfile && isAuthenticated && (
            <View style={styles.followButtonContainer}>
                  <GlassButton
                title={isFollowing ? 'Following' : 'Follow'}
                    onPress={handleFollow}
                    variant={isFollowing ? 'outline' : 'primary'}
                    disabled={isTogglingFollow}
                    style={styles.followButton}
                icon={isFollowing ? 'checkmark' : 'person-add-outline'}
              />
              {isBlocked && (
                <View style={styles.blockedBadge}>
                  <Ionicons name="ban" size={14} color={COLORS.error} />
                  <Text style={styles.blockedText}>Blocked</Text>
                </View>
              )}
            </View>
          )}

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Pressable style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.postCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/user/${id}/followers`)}
            >
              <Text style={styles.statNumber}>{profile.followersCount || 0}</Text>
              <Text style={styles.statLabel}>
                Followers
              </Text>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/user/${id}/following`)}
            >
              <Text style={styles.statNumber}>{profile.followingCount || 0}</Text>
              <Text style={styles.statLabel}>
                Following
              </Text>
            </Pressable>
          </View>

          {/* Engagement Stats */}
          {(profile.totalLikes !== undefined || profile.totalComments !== undefined) && (
            <View style={styles.engagementStats}>
              <View style={styles.engagementItem}>
                <Ionicons name="heart" size={16} color={COLORS.error} />
                <Text style={styles.engagementText}>
                  {profile.totalLikes || 0} likes received
                </Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="chatbubble" size={16} color={COLORS.primary} />
                <Text style={styles.engagementText}>
                  {profile.totalComments || 0} comments received
                </Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Posts */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {posts.length === 0 ? (
            <GlassCard style={styles.emptyPostsCard} padding="lg">
              <Ionicons name="document-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyPostsText}>
                No posts
              </Text>
            </GlassCard>
          ) : (
            <FlatList
              data={posts}
              renderItem={({ item }) => (
                <PostCard
                  post={item}
                  onPress={() => router.push(`/post/${item._id}`)}
                  onShare={async () => {
                    try {
                      const authorName = item.author?.displayName || item.author?.username || 'Someone';
                      const content = item.content || '';
                      await shareService.sharePost(item._id, content, authorName);
                    } catch (error) {
                      console.error('Error sharing post:', error);
                    }
                  }}
                />
              )}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                hasMore ? (
                  <View style={styles.loadingFooter}>
                    <LoadingSpinner size="sm" />
                  </View>
                ) : null
              }
            />
          )}
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
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
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
  profileCard: {
    marginBottom: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  profileInfoContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    minWidth: 0,
  },
  profileInfo: {
    marginBottom: SPACING.sm,
  },
  displayName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  username: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  moreOptionsButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  followButtonContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  followButton: {
    width: '100%',
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.error + '20',
  },
  blockedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
  bio: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  engagementStats: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  engagementText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  postsSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyPostsCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyPostsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  loadingFooter: {
    padding: SPACING.md,
    alignItems: 'center',
  },
});

