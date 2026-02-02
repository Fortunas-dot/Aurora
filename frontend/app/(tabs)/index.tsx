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
import { FeedTabs, FeedTab, CommunityFilter, SortDropdown, SortOption, SearchBar } from '../../src/components/feed';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { postService, Post } from '../../src/services/post.service';
import { therapistService } from '../../src/services/therapist.service';
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
  const [activeTab, setActiveTab] = useState<FeedTab>(isAuthenticated ? 'home' : 'all');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  // Search state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Online therapists state
  const [onlineTherapistsCount, setOnlineTherapistsCount] = useState<number | null>(null);
  const [onlineTherapistsMessage, setOnlineTherapistsMessage] = useState<string>('');

  // Load posts based on current filters
  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let response;
      const groupId = selectedCommunity || undefined;

      // Handle search mode
      if (isSearching && searchQuery.trim().length >= 2) {
        response = await postService.searchPosts(searchQuery, {
          page: pageNum,
          limit: 20,
        });
      }
      // Handle different tabs (Reddit-style)
      else if (activeTab === 'home') {
        // Home: Posts from joined groups
        response = await postService.getJoinedGroupsPosts({
          page: pageNum,
          limit: 20,
          groupId,
          sortBy: sortOption,
        });
      } else if (activeTab === 'popular') {
        // Popular: Trending posts
        response = await postService.getTrendingPosts({
          page: pageNum,
          limit: 20,
          groupId,
        });
      } else if (activeTab === 'saved') {
        response = await postService.getSavedPosts(pageNum, 20);
      } else {
        // All: All posts
        response = await postService.getPosts({
          page: pageNum,
          limit: 20,
          groupId,
          sortBy: sortOption,
        });
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:94',message:'loadPosts - API response received',data:{success:response.success,dataCount:response.data?.length||0,activeTab,selectedCommunity,sortOption,responsePostIds:response.data?.map((p:Post)=>p._id).slice(0,5)||[],pagination:response.pagination},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      if (response.success && response.data) {
        // Filter out posts with invalid IDs
        const validPosts = response.data.filter((post: Post) => {
          if (!post || !post._id) return false;
          // Check if post ID is a valid MongoDB ObjectId format (24 hex characters)
          const postId = post._id.toString();
          return /^[0-9a-fA-F]{24}$/.test(postId);
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:101',message:'loadPosts - After frontend ID validation',data:{validPostsCount:validPosts.length,filteredOut:response.data.length-validPosts.length,validPostIds:validPosts.map((p:Post)=>p._id).slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (append) {
          setPosts((prev) => [...prev, ...validPosts]);
        } else {
          setPosts(validPosts);
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:107',message:'loadPosts - Posts set in state',data:{postsSetCount:append?'appended':validPosts.length,finalPostIds:validPosts.map((p:Post)=>p._id).slice(0,5),hasMore:response.pagination?pageNum<response.pagination.pages:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }
      } else {
        // Only log non-404 errors (404 means no posts found, which is normal)
        if (response.message && !response.message.includes('not found') && !response.message.includes('Invalid post ID format')) {
          console.error('Error loading posts:', response.message);
        }
        if (!append) {
          setPosts([]);
        }
      }
    } catch (error: any) {
      // Only log if it's not a 404 or invalid ID format error
      if (error.message && !error.message.includes('not found') && !error.message.includes('Invalid post ID format')) {
        console.error('Error loading posts:', error);
      }
      if (!append) {
        setPosts([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeTab, selectedCommunity, sortOption, isSearching, searchQuery, isAuthenticated]);

  // Reload posts when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPosts(1, false);
  }, [activeTab, selectedCommunity, sortOption, isSearching]);

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

  // Load online therapists count
  useEffect(() => {
    const loadOnlineTherapists = async () => {
      try {
        const response = await therapistService.getOnlineCount();
        if (response.success && response.data) {
          setOnlineTherapistsCount(response.data.count);
          setOnlineTherapistsMessage(response.data.message);
        }
      } catch (error) {
        console.error('Error loading online therapists count:', error);
      }
    };
    
    loadOnlineTherapists();
    // Refresh every hour to get updated count
    const interval = setInterval(loadOnlineTherapists, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleCommunityChange = (communityId: string | null) => {
    setSelectedCommunity(communityId);
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

  const handleShare = async (post: Post) => {
    // Share functionality - can be implemented later with expo-sharing or native share
    console.log('Share post:', post._id);
  };

  const handleSavePost = async (postId: string) => {
    try {
      const response = await postService.savePost(postId);
      if (response.success && response.data) {
        // Update post in list
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, isSaved: response.data!.isSaved } : p
          )
        );
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => router.push(`/post/${item._id}`)}
      onLike={() => handleLike(item._id)}
      onComment={() => router.push(`/post/${item._id}`)}
      onShare={() => handleShare(item)}
      onSave={() => handleSavePost(item._id)}
      onAuthorPress={() => router.push(`/user/${item.author._id}`)}
      onGroupPress={() => item.groupId && router.push(`/group/${item.groupId}`)}
      currentUserId={user?._id}
      isSaved={item.isSaved}
    />
  );

  const getEmptyStateText = () => {
    if (isSearching && searchQuery) {
      return {
        title: 'No results',
        subtitle: `No posts found for "${searchQuery}"`,
      };
    }
    switch (activeTab) {
      case 'home':
        return {
          title: 'No posts yet',
          subtitle: 'Join communities to see posts in your Home feed',
        };
      case 'popular':
        return {
          title: 'No trending posts',
          subtitle: 'There are no popular posts yet',
        };
      case 'saved':
        return {
          title: 'No saved posts',
          subtitle: 'Save interesting posts to find them here',
        };
      default:
        return {
          title: 'No posts yet',
          subtitle: 'Be the first to share something!',
        };
    }
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Online Therapists Banner */}
      {onlineTherapistsCount !== null && onlineTherapistsCount > 0 && (
        <GlassCard style={styles.therapistsBanner} padding="md">
          <View style={styles.therapistsBannerContent}>
            <View style={styles.therapistsBannerLeft}>
              <View style={styles.onlineIndicator} />
              <Text style={styles.therapistsBannerText}>
                {onlineTherapistsMessage}
              </Text>
            </View>
            <Ionicons name="medical-outline" size={20} color={COLORS.primary} />
          </View>
        </GlassCard>
      )}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <CommunityFilter
          selectedCommunity={selectedCommunity}
          onCommunityChange={handleCommunityChange}
          isAuthenticated={isAuthenticated}
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
            placeholder="Search posts..."
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
            Search results for "{searchQuery}"
          </Text>
          <Pressable onPress={() => handleSearchExpandChange(false)}>
            <Text style={styles.clearSearchText}>Clear</Text>
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
                  activeTab === 'home'
                    ? 'home-outline'
                    : activeTab === 'popular'
                      ? 'trending-up-outline'
                      : activeTab === 'saved'
                        ? 'bookmark-outline'
                        : 'chatbubbles-outline'
                } 
                size={48} 
                color={COLORS.textMuted} 
              />
              <Text style={styles.emptyText}>{emptyState.title}</Text>
              <Text style={styles.emptySubtext}>{emptyState.subtitle}</Text>
              {activeTab === 'home' && isAuthenticated && (
                <Pressable
                  style={styles.browseGroupsButton}
                  onPress={() => router.push('/(tabs)/groups')}
                >
                  <Text style={styles.browseGroupsButtonText}>Browse communities</Text>
                </Pressable>
              )}
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
  therapistsBanner: {
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  therapistsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  therapistsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  therapistsBannerText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    flex: 1,
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
  browseGroupsButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  browseGroupsButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
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
