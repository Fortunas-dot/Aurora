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
import { GlassCard, LoadingSpinner, Avatar, Badge } from '../../src/components/common';
import { PostCard } from '../../src/components/post/PostCard';
import { FeedTabs, FeedTab, CategoryFilter, SortDropdown, SortOption, SearchBar } from '../../src/components/feed';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { postService, Post, PostType } from '../../src/services/post.service';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount, updateUnreadCount } = useNotificationStore();
  
  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter state
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  // Search state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Get postType based on active tab
  const getPostTypeFromTab = (tab: FeedTab): PostType | undefined => {
    switch (tab) {
      case 'questions':
        return 'question';
      case 'stories':
        return 'story';
      default:
        return undefined;
    }
  };

  // Load posts based on current filters
  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let response;
      const postType = getPostTypeFromTab(activeTab);
      const tag = selectedCategory !== 'all' ? selectedCategory : undefined;

      // Handle search mode
      if (isSearching && searchQuery.trim().length >= 2) {
        response = await postService.searchPosts(searchQuery, {
          page: pageNum,
          limit: 20,
          postType,
        });
      }
      // Handle different tabs
      else if (activeTab === 'trending') {
        response = await postService.getTrendingPosts({
          page: pageNum,
          limit: 20,
          tag,
          postType,
        });
      } else if (activeTab === 'following') {
        response = await postService.getFollowingPosts({
          page: pageNum,
          limit: 20,
          tag,
          postType,
        });
      } else if (activeTab === 'saved') {
        response = await postService.getSavedPosts(pageNum, 20);
      } else {
        // All, Questions, Stories tabs
        response = await postService.getPosts({
          page: pageNum,
          limit: 20,
          tag,
          postType,
          sortBy: sortOption,
        });
      }
      
      if (response.success && response.data) {
        if (append) {
          setPosts((prev) => [...prev, ...response.data!]);
        } else {
          setPosts(response.data);
        }
        
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }
      } else {
        console.error('Error loading posts:', response.message);
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
  }, [isLoading, activeTab, selectedCategory, sortOption, isSearching, searchQuery]);

  // Reload posts when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPosts(1, false);
  }, [activeTab, selectedCategory, sortOption, isSearching]);

  // Update unread count on mount and focus
  useEffect(() => {
    if (isAuthenticated) {
      updateUnreadCount();
      // Poll for unread count every 30 seconds
      const interval = setInterval(() => {
        updateUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, updateUnreadCount]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadPosts(1, false);
    setIsRefreshing(false);
  }, [loadPosts]);

  const handleTabChange = (tab: FeedTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setPage(1);
    setHasMore(true);
    loadPosts(1, false);
  };

  const handleSearchExpandChange = (expanded: boolean) => {
    setIsSearchExpanded(expanded);
    if (!expanded) {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleLike = async (postId: string) => {
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

  const getEmptyStateText = () => {
    if (isSearching && searchQuery) {
      return {
        title: 'Geen resultaten',
        subtitle: `Geen posts gevonden voor "${searchQuery}"`,
      };
    }
    switch (activeTab) {
      case 'following':
        return {
          title: 'Nog geen posts',
          subtitle: 'Volg andere gebruikers om hun posts hier te zien',
        };
      case 'saved':
        return {
          title: 'Geen opgeslagen posts',
          subtitle: 'Sla interessante posts op om ze hier terug te vinden',
        };
      case 'questions':
        return {
          title: 'Nog geen vragen',
          subtitle: 'Stel de eerste vraag aan de community!',
        };
      case 'stories':
        return {
          title: 'Nog geen verhalen',
          subtitle: 'Deel je eerste verhaal met de community!',
        };
      default:
        return {
          title: 'Nog geen posts',
          subtitle: 'Wees de eerste om iets te delen!',
        };
    }
  };

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
              {activeTab === 'questions' 
                ? 'Stel een vraag...' 
                : activeTab === 'stories' 
                  ? 'Deel je verhaal...' 
                  : 'Deel je gedachten...'}
            </Text>
          </Pressable>
        </View>
      </GlassCard>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        <View style={styles.sortContainer}>
          <SortDropdown
            selectedSort={sortOption}
            onSortChange={handleSortChange}
          />
        </View>
      </View>
    </View>
  );

  const emptyState = getEmptyStateText();

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        {isSearchExpanded ? (
          <SearchBar
            onSearch={handleSearch}
            placeholder="Zoeken in posts..."
            isExpanded={isSearchExpanded}
            onExpandChange={handleSearchExpandChange}
          />
        ) : (
          <>
            <Text style={styles.headerTitle}>Aurora</Text>
            <View style={styles.headerRight}>
              <SearchBar
                onSearch={handleSearch}
                isExpanded={isSearchExpanded}
                onExpandChange={handleSearchExpandChange}
              />
              <Pressable
                style={styles.headerButton}
                onPress={() => router.push('/notifications')}
              >
                <View style={styles.notificationButtonContainer}>
                  <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
                  {unreadCount > 0 && <Badge count={unreadCount} size="sm" />}
                </View>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Search Results Header */}
      {isSearching && searchQuery && (
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsText}>
            Zoekresultaten voor "{searchQuery}"
          </Text>
          <Pressable onPress={() => handleSearchExpandChange(false)}>
            <Text style={styles.clearSearchText}>Wissen</Text>
          </Pressable>
        </View>
      )}

      {/* Feed Tabs */}
      {!isSearching && (
        <FeedTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.feedContent}
        ListHeaderComponent={!isSearching ? ListHeader : undefined}
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
              <Ionicons 
                name={
                  activeTab === 'questions' 
                    ? 'help-circle-outline' 
                    : activeTab === 'stories' 
                      ? 'book-outline' 
                      : activeTab === 'saved'
                        ? 'bookmark-outline'
                        : 'chatbubbles-outline'
                } 
                size={48} 
                color={COLORS.textMuted} 
              />
              <Text style={styles.emptyText}>{emptyState.title}</Text>
              <Text style={styles.emptySubtext}>{emptyState.subtitle}</Text>
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
  notificationButtonContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.glass.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  searchResultsText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  clearSearchText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  feedContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: SPACING.md,
  },
  createPostCard: {
    marginBottom: SPACING.sm,
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
  filterBar: {
    marginTop: SPACING.xs,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
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
    textAlign: 'center',
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
