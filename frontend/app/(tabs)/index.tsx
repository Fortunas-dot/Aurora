import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer, GlassCard, GlassButton, LoadingSpinner, Avatar } from '../../src/components/common';
import { PostCard } from '../../src/components/post/PostCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { postService, Post } from '../../src/services/post.service';
import { useAuthStore } from '../../src/store/authStore';


export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await postService.getPosts(pageNum, 20);
      
      if (response.success && response.data) {
        if (append) {
          setPosts((prev) => [...prev, ...response.data!]);
        } else {
          setPosts(response.data);
        }
        
        // Check if there are more pages
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }
      } else {
        console.error('Error loading posts:', response.message);
        // Fallback to empty array on error
        if (!append) {
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      if (!append) {
        setPosts([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadPosts(1, false);
    setIsRefreshing(false);
  }, [loadPosts]);

  useEffect(() => {
    loadPosts(1, false);
  }, []);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    
    try {
      const response = await postService.likePost(postId);
      if (response.success) {
        // Update local state
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

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    router.push('/create-post');
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => router.push(`/post/${item._id}`)}
      onLike={() => handleLike(item._id)}
      onComment={() => router.push(`/post/${item._id}`)}
      currentUserId={user?._id}
    />
  );

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Create Post Card */}
      <GlassCard style={styles.createPostCard} padding="md">
        <View style={styles.createPostRow}>
          <Avatar
            uri={user?.avatar}
            name={user?.displayName || user?.username || 'Gast'}
            size="md"
          />
          <Pressable
            style={styles.createPostInput}
            onPress={handleCreatePost}
          >
            <Text style={styles.createPostPlaceholder}>
              Deel je gedachten...
            </Text>
          </Pressable>
        </View>
      </GlassCard>

      {/* Quick Tags */}
      <View style={styles.quickTags}>
        {['meditatie', 'angst', 'depressie', 'therapie', 'mindfulness'].map((tag) => (
          <Pressable key={tag} style={styles.quickTag}>
            <Text style={styles.quickTagText}>#{tag}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.headerTitle}>Aurora</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </Pressable>
        </View>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.feedContent}
        ListHeaderComponent={ListHeader}
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
          isLoading && posts.length > 0 ? (
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
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Nog geen posts</Text>
              <Text style={styles.emptySubtext}>
                Wees de eerste om iets te delen!
              </Text>
            </View>
          )
        }
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={handleCreatePost}>
        <LinearGradient
          colors={['rgba(96, 165, 250, 0.9)', 'rgba(167, 139, 250, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </LinearGradient>
      </Pressable>
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
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  feedContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: SPACING.md,
  },
  createPostCard: {
    marginBottom: SPACING.md,
  },
  createPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostInput: {
    flex: 1,
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  createPostPlaceholder: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  quickTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickTag: {
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  quickTagText: {
    ...TYPOGRAPHY.caption,
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
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 100,
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

