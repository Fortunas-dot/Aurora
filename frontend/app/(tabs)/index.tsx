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

// Mock data for demonstration
const MOCK_POSTS: Post[] = [
  {
    _id: '1',
    author: {
      _id: 'u1',
      email: 'sarah@example.com',
      username: 'sarah_wellness',
      displayName: 'Sarah',
      avatar: null,
      bio: '',
      isAnonymous: false,
      showEmail: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    content: 'Vandaag heb ik voor het eerst in maanden weer kunnen mediteren. Het voelt als een kleine overwinning. 💫 Stap voor stap vooruit.',
    tags: ['meditatie', 'vooruitgang', 'mindfulness'],
    likes: ['u2', 'u3'],
    commentsCount: 5,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: '2',
    author: {
      _id: 'u2',
      email: 'mike@example.com',
      username: 'peaceful_mike',
      displayName: 'Mike',
      avatar: null,
      bio: '',
      isAnonymous: true,
      showEmail: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    content: 'Heeft iemand tips voor het omgaan met sociale angst? Ik merk dat ik steeds meer sociale situaties ga vermijden en wil dit doorbreken.',
    tags: ['socialeangst', 'hulpgevraagd'],
    likes: ['u1'],
    commentsCount: 12,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: '3',
    author: {
      _id: 'u3',
      email: 'emma@example.com',
      username: 'emma_growth',
      displayName: 'Emma',
      avatar: null,
      bio: '',
      isAnonymous: false,
      showEmail: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    content: 'Na 6 maanden therapie durf ik eindelijk te zeggen: het wordt beter. Voor iedereen die nog aan het begin staat - geef niet op. ❤️',
    tags: ['therapie', 'hoop', 'herstel'],
    likes: ['u1', 'u2', 'u4', 'u5'],
    commentsCount: 23,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, use: const response = await postService.getPosts();
      // For now, use mock data
      setPosts(MOCK_POSTS);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  }, [loadPosts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    // In production: await postService.likePost(postId);
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    // Navigate to create post screen
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => {}}
      onLike={() => handleLike(item._id)}
      onComment={() => {}}
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

