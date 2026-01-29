import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, PostCard, Avatar, TagChip, LoadingSpinner } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { groupService, Group } from '../../src/services/group.service';
import { postService, Post } from '../../src/services/post.service';
import { useAuthStore } from '../../src/store/authStore';

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

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, true);
    }
  }, [isLoading, hasMore, page, loadPosts]);

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
          <Text style={styles.errorText}>Groep niet gevonden</Text>
          <GlassButton
            title="Terug"
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Groep</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/post/${item._id}`)}
            onLike={() => handleLikePost(item._id)}
            onComment={() => router.push(`/post/${item._id}`)}
            currentUserId={user?._id}
          />
        )}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {/* Group Info */}
            <GlassCard style={styles.groupCard} padding="lg">
              <View style={styles.groupHeader}>
                <View style={styles.groupAvatar}>
                  <Ionicons name="people" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.groupInfo}>
                  <View style={styles.groupTitleRow}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.isPrivate && (
                      <Ionicons name="lock-closed" size={18} color={COLORS.textMuted} />
                    )}
                  </View>
                  <View style={styles.groupMeta}>
                    <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.groupMetaText}>{group.memberCount} leden</Text>
                  </View>
                </View>
              </View>

              {group.description && (
                <Text style={styles.groupDescription}>{group.description}</Text>
              )}

              {group.tags.length > 0 && (
                <View style={styles.groupTags}>
                  {group.tags.map((tag, index) => (
                    <TagChip key={index} label={tag} size="sm" />
                  ))}
                </View>
              )}

              <View style={styles.groupActions}>
                <GlassButton
                  title={group.isMember ? 'Lid' : 'Word lid'}
                  onPress={handleJoinLeave}
                  variant={group.isMember ? 'outline' : 'primary'}
                  isLoading={isJoining}
                  disabled={isJoining}
                  style={styles.joinButton}
                />
                {group.isMember && (
                  <Pressable
                    style={styles.createPostButton}
                    onPress={() => router.push(`/create-post?groupId=${group._id}`)}
                  >
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    <Text style={styles.createPostButtonText}>Nieuwe post</Text>
                  </Pressable>
                )}
              </View>
            </GlassCard>

            {/* Posts Header */}
            <View style={styles.postsHeader}>
              <Text style={styles.postsTitle}>
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </Text>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
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
            <Text style={styles.emptyText}>Nog geen posts</Text>
            <Text style={styles.emptySubtext}>
              {group.isMember
                ? 'Wees de eerste om iets te delen!'
                : 'Word lid om posts te zien'}
            </Text>
          </View>
        }
      />
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
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  groupCard: {
    marginBottom: SPACING.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  groupAvatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  groupName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  groupMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  groupDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  groupActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  joinButton: {
    flex: 1,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  createPostButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  postsHeader: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  postsTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
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
});





