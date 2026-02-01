import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
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
import { useAuthStore } from '../../src/store/authStore';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!id) return;

    try {
      const response = await userService.getUserProfile(id);
      if (response.success && response.data) {
        setProfile(response.data);
        setIsFollowing(response.data.isFollowing || false);
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
      if (response.success && response.data) {
        setIsFollowing(response.data.isFollowing);
        // Reload profile to update counts
        await loadProfile();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsTogglingFollow(false);
    }
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
          <Text style={styles.headerTitle}>Profiel</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Gebruiker niet gevonden</Text>
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
          <View style={styles.profileHeader}>
            <Avatar
              uri={profile.avatar}
              name={profile.displayName || profile.username}
              size="xl"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>
                {profile.displayName || profile.username}
              </Text>
              <Text style={styles.username}>@{profile.username}</Text>
            </View>
            {!isOwnProfile && isAuthenticated && (
              <GlassButton
                title={isFollowing ? 'Ontvolgen' : 'Volgen'}
                onPress={handleFollow}
                variant={isFollowing ? 'outline' : 'primary'}
                disabled={isTogglingFollow}
                style={styles.followButton}
              />
            )}
            {isOwnProfile && (
              <Pressable
                style={styles.editButton}
                onPress={() => router.push('/edit-profile')}
              >
                <Ionicons name="pencil" size={18} color={COLORS.primary} />
              </Pressable>
            )}
          </View>

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
              <Text style={styles.statLabel}>Volgers</Text>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/user/${id}/following`)}
            >
              <Text style={styles.statNumber}>{profile.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Volgend</Text>
            </Pressable>
          </View>

          {/* Engagement Stats */}
          {(profile.totalLikes !== undefined || profile.totalComments !== undefined) && (
            <View style={styles.engagementStats}>
              <View style={styles.engagementItem}>
                <Ionicons name="heart" size={16} color={COLORS.error} />
                <Text style={styles.engagementText}>
                  {profile.totalLikes || 0} likes ontvangen
                </Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="chatbubble" size={16} color={COLORS.primary} />
                <Text style={styles.engagementText}>
                  {profile.totalComments || 0} reacties ontvangen
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
              <Text style={styles.emptyPostsText}>Geen posts</Text>
            </GlassCard>
          ) : (
            <FlatList
              data={posts}
              renderItem={({ item }) => <PostCard post={item} />}
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
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
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
  followButton: {
    minWidth: 100,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
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

