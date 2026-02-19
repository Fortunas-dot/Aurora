import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, Avatar, TagChip, LoadingSpinner } from '../../src/components/common';
import { PostCard } from '../../src/components/post/PostCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { groupService, Group } from '../../src/services/group.service';
import { postService, Post } from '../../src/services/post.service';
import { shareService } from '../../src/services/share.service';
import { useAuthStore } from '../../src/store/authStore';
import { getCountryName } from '../../src/constants/countries';


export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Facebook design is now the only design

  const loadGroup = useCallback(async () => {
    if (!id) return;

    try {
      const response = await groupService.getGroup(id);
      if (response.success && response.data) {
        setGroup(response.data);
      }
    } catch (error) {
      console.error('Error loading group:', error);
    }
  }, [id]);

  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!id) return;

    try {
      const response = await groupService.getGroupPosts(id, pageNum, 20);
      
      if (response.success && response.data) {
        if (append) {
          setPosts((prev) => [...prev, ...response.data!]);
        } else {
          setPosts(response.data);
        }
        
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadGroup(), loadPosts(1, false)]);
    setIsLoading(false);
  }, [loadGroup, loadPosts]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([loadGroup(), loadPosts(1, false)]);
    setIsRefreshing(false);
  }, [loadGroup, loadPosts]);

  const handleJoinLeave = async () => {
    if (!isAuthenticated || !group) {
      router.push('/(auth)/login');
      return;
    }

    setIsJoining(true);
    try {
      if (group.isMember) {
        const response = await groupService.leaveGroup(group._id);
        if (response.success) {
          setGroup({
            ...group,
            isMember: false,
            memberCount: response.data!.memberCount,
          });
        }
      } else {
        const response = await groupService.joinGroup(group._id);
        if (response.success) {
          setGroup({
            ...group,
            isMember: true,
            memberCount: response.data!.memberCount,
          });
        }
      }
    } catch (error) {
      console.error('Error joining/leaving group:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleReportGroup = () => {
    if (!group || !isAuthenticated) return;

    Alert.alert(
      'Report Group',
      'Why are you reporting this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: async () => {
            try {
              const response = await groupService.reportGroup(group._id, 'spam');
              if (response.success) {
                Alert.alert('Success', 'Group reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report group');
              }
            } catch (error) {
              console.error('Error reporting group:', error);
              Alert.alert('Error', 'Failed to report group');
            }
          },
        },
        {
          text: 'Harassment',
          onPress: async () => {
            try {
              const response = await groupService.reportGroup(group._id, 'harassment');
              if (response.success) {
                Alert.alert('Success', 'Group reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report group');
              }
            } catch (error) {
              console.error('Error reporting group:', error);
              Alert.alert('Error', 'Failed to report group');
            }
          },
        },
        {
          text: 'Inappropriate',
          onPress: async () => {
            try {
              const response = await groupService.reportGroup(group._id, 'inappropriate');
              if (response.success) {
                Alert.alert('Success', 'Group reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report group');
              }
            } catch (error) {
              console.error('Error reporting group:', error);
              Alert.alert('Error', 'Failed to report group');
            }
          },
        },
        {
          text: 'Misleading',
          onPress: async () => {
            try {
              const response = await groupService.reportGroup(group._id, 'misleading');
              if (response.success) {
                Alert.alert('Success', 'Group reported. Our team will review this report.');
              } else {
                Alert.alert('Error', response.message || 'Failed to report group');
              }
            } catch (error) {
              console.error('Error reporting group:', error);
              Alert.alert('Error', 'Failed to report group');
            }
          },
        },
      ]
    );
  };

  const handleGroupSettings = () => {
    if (!group) return;

    const options: Array<{ text: string; style?: 'default' | 'destructive' | 'cancel'; onPress: () => void }> = [];
    
    if (group.isMember) {
      options.push({
        text: 'Leave Group',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert(
            'Leave Group',
            `Are you sure you want to leave "${group.name}"?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Leave',
                style: 'destructive',
                onPress: handleJoinLeave,
              },
            ]
          );
        },
      });
    }

    if (group.isAdmin) {
      options.push({
        text: 'Group Settings',
        onPress: () => {
          router.push(`/group/${group._id}/settings`);
        },
      });
    }

    // Add report option for non-admins
    if (!group.isAdmin && isAuthenticated) {
      options.push({
        text: 'Report Group',
        style: 'destructive' as const,
        onPress: () => handleReportGroup(),
      });
    }

    if (options.length === 0) return;

    Alert.alert(
      'Group Options',
      '',
      [
        ...options,
        { text: 'Cancel', style: 'cancel' as const, onPress: () => {} },
      ]
    );
  };

  const handleLikePost = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      const response = await postService.likePost(postId);
      if (response.success) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id === postId) {
              const isLiked = post.likes.includes(user!._id);
              return {
                ...post,
                likes: isLiked
                  ? post.likes.filter((id) => id !== user!._id)
                  : [...post.likes, user!._id],
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSharePost = async (post: Post) => {
    try {
      const authorName = post.author?.displayName || post.author?.username || 'Someone';
      const content = post.content || '';
      await shareService.sharePost(post._id, content, authorName);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, true);
    }
  }, [isLoading, hasMore, page, loadPosts]);

  // Get gradient colors from cover image option
  const getGradientColors = (coverImage: string): string[] => {
    const optionId = coverImage.replace('gradient:', '');
    const gradients: { [key: string]: string[] } = {
      blue: ['rgba(24, 119, 242, 0.8)', 'rgba(66, 103, 178, 0.8)'],
      purple: ['rgba(139, 92, 246, 0.8)', 'rgba(167, 139, 250, 0.8)'],
      teal: ['rgba(20, 184, 166, 0.8)', 'rgba(94, 234, 212, 0.8)'],
      pink: ['rgba(236, 72, 153, 0.8)', 'rgba(244, 114, 182, 0.8)'],
      orange: ['rgba(249, 115, 22, 0.8)', 'rgba(251, 146, 60, 0.8)'],
      green: ['rgba(34, 197, 94, 0.8)', 'rgba(74, 222, 128, 0.8)'],
    };
    return gradients[optionId] || ['rgba(24, 119, 242, 0.4)', 'rgba(66, 103, 178, 0.4)'];
  };

  // Render Facebook-style header
  const renderGroupHeader = () => {
    if (!group) return null;
    return renderFacebookHeader();
  };

  // Early return if group is not loaded yet
  if (isLoading && !group) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  if (!group) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Group not found</Text>
          <GlassButton
            title="Back"
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </LinearGradient>
    );
  }


  const renderFacebookHeader = () => (
    <>
      <View style={styles.facebookCoverSection}>
        {group.coverImage ? (
          group.coverImage.startsWith('gradient:') ? (
            <LinearGradient
              colors={getGradientColors(group.coverImage)}
              style={styles.facebookCoverGradient}
            />
          ) : (
            <Image source={{ uri: group.coverImage }} style={styles.facebookCoverImage} />
          )
        ) : (
          <LinearGradient
            colors={['rgba(24, 119, 242, 0.4)', 'rgba(66, 103, 178, 0.4)']}
            style={styles.facebookCoverGradient}
          />
        )}
        {/* Header overlays the cover image */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Pressable>
          <View style={styles.headerSpacer} />
          {group.isMember && (
            <Pressable
              style={styles.headerSettingsButton}
              onPress={handleGroupSettings}
            >
              <Ionicons name="settings" size={22} color={COLORS.white} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.facebookHeaderCard}>
        <View style={styles.facebookProfileSection}>
          <View style={styles.facebookAvatarContainer}>
            <View style={styles.facebookAvatar}>
              {group.avatar ? (
                <Image source={{ uri: group.avatar }} style={styles.facebookAvatarImage} />
              ) : (
                <LinearGradient
                  colors={['rgba(24, 119, 242, 0.3)', 'rgba(66, 103, 178, 0.3)']}
                  style={styles.facebookAvatarGradient}
                >
                  <Ionicons name="people" size={36} color={COLORS.primary} />
                </LinearGradient>
              )}
            </View>
          </View>
          <View style={styles.facebookInfo}>
            <View style={styles.facebookTitleRow}>
              <Text style={styles.facebookGroupName}>{group.name}</Text>
              <View style={styles.facebookStatsInline}>
                <Text style={styles.facebookStatText}>{group.memberCount} members</Text>
                {group.country && (
                  <Text style={styles.facebookStatText}> • {getCountryName(group.country)}</Text>
                )}
                {group.healthCondition && (
                  <Text style={styles.facebookStatText}> • {group.healthCondition}</Text>
                )}
              </View>
              {group.isPrivate && (
                <View style={styles.privateBadge}>
                  <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} />
                </View>
              )}
              {group.isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {group.description && (
          <Text style={styles.facebookDescription}>{group.description}</Text>
        )}
      </View>
    </>
  );


  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/post/${item._id}`)}
            onLike={() => handleLikePost(item._id)}
            onComment={() => router.push(`/post/${item._id}`)}
            onShare={() => handleSharePost(item)}
            currentUserId={user?._id}
          />
        )}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {renderGroupHeader()}
            {/* Posts Header */}
            <View style={styles.postsHeader}>
              <Text style={styles.postsTitle}>
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </Text>
              {group?.isMember && (
                <Pressable
                  style={styles.sortButton}
                  onPress={() => {
                    // TODO: Add sort options
                    console.log('Sort posts');
                  }}
                >
                  <Ionicons name="swap-vertical" size={18} color={COLORS.textMuted} />
                </Pressable>
              )}
            </View>
          </>
        }
        contentContainerStyle={[styles.listContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="md" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              {group?.isMember
                ? 'Be the first to share something!'
                : 'Join to see posts'}
            </Text>
          </View>
        }
      />

      {/* FAB for Create Post */}
      {group?.isMember && (
        <Pressable 
          style={[styles.fab, { bottom: insets.bottom || SPACING.md }]} 
          onPress={() => router.push(`/create-post?groupId=${group._id}`)}
        >
          <LinearGradient
            colors={['rgba(96, 165, 250, 0.9)', 'rgba(167, 139, 250, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={COLORS.white} />
          </LinearGradient>
        </Pressable>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 0,
    paddingHorizontal: SPACING.md,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  postsTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  sortButton: {
    padding: SPACING.xs,
  },
  loadingFooter: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  // Facebook Design Styles
  facebookCoverSection: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  facebookCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  facebookCoverGradient: {
    width: '100%',
    height: '100%',
  },
  facebookHeaderCard: {
    marginTop: -20,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    zIndex: 10,
  },
  facebookProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  facebookAvatarContainer: {
    marginTop: 0,
  },
  facebookAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.background,
    overflow: 'hidden',
  },
  facebookAvatarImage: {
    width: '100%',
    height: '100%',
  },
  facebookAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facebookInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginBottom: 0,
  },
  facebookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  facebookGroupName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  facebookStatsInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.glass.backgroundDark,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    gap: 4,
  },
  adminBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  facebookStats: {
    flexDirection: 'row',
    marginTop: 2,
  },
  facebookStatText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  facebookDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
    lineHeight: 18,
    fontSize: 14,
  },
  facebookActions: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  facebookJoinButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
  facebookJoinButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  headerSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});






