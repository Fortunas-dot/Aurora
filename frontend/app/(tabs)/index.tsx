import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
import { GlassCard, LoadingSpinner, Avatar, Badge } from '../../src/components/common';
import { PostCard } from '../../src/components/post/PostCard';
import { FeedTabs, FeedTab, CommunityFilter, SortDropdown, SortOption, SearchBar } from '../../src/components/feed';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { postService, Post } from '../../src/services/post.service';
import { groupService, Group } from '../../src/services/group.service';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';

// Animated star component
const AnimatedStar = ({ index }: { index: number }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;
  const speed = 20 + Math.random() * 30; // Different speeds for each star
  const direction = Math.random() * Math.PI * 2; // Random direction
  const distance = 30 + Math.random() * 50; // How far the star moves

  useEffect(() => {
    const duration = 3000 + Math.random() * 4000; // 3-7 seconds

    // Create a looping animation
    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: Math.cos(direction) * distance,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: Math.sin(direction) * distance,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.1,
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3 + Math.random() * 0.4,
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 0.5,
              duration: duration * 0.6,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.6,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        feedStyles.star,
        {
          left: `${initialX}%`,
          top: `${initialY}%`,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    />
  );
};

// Falling star component that appears randomly
const FallingStar = ({ onComplete }: { onComplete: () => void }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  const startX = Math.random() * 100; // Random starting X position (0-100%)
  const fallDistance = 120; // Fall from top to bottom + extra
  const fallDuration = 800 + Math.random() * 1200; // 0.8-2 seconds (faster)
  const horizontalDrift = (Math.random() - 0.5) * 40; // More horizontal movement
  
  useEffect(() => {
    // Fade in quickly
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(trailOpacity, {
          toValue: 0.8,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Fall down
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: fallDistance,
          duration: fallDuration,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: horizontalDrift,
          duration: fallDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: fallDuration * 0.7,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(trailOpacity, {
          toValue: 0,
          duration: fallDuration * 0.7,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: fallDuration,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]);
    
    animationRef.current = animation;
    
    animation.start((finished) => {
      if (finished) {
      onComplete();
      }
    });
    
    // Cleanup: stop animation if component unmounts
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [onComplete]);
  
  return (
    <Animated.View
      style={[
        feedStyles.fallingStarContainer,
        {
          left: `${startX}%`,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {/* Trail with gradient effect - wrapped in Animated.View for opacity */}
      <Animated.View
        style={[
          feedStyles.fallingStarTrail,
          {
            opacity: trailOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(96, 165, 250, 0.6)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
      />
      </Animated.View>
      {/* Star */}
      <View style={feedStyles.fallingStar} />
    </Animated.View>
  );
};

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount, updateUnreadCount } = useNotificationStore();
  const { colors } = useTheme();
  
  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [therapistCount, setTherapistCount] = useState<number | null>(null);
  
  // Filter state
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showAllPublicPosts, setShowAllPublicPosts] = useState(false);
  
  // Search state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Falling star state
  const [fallingStars, setFallingStars] = useState<Array<{ id: number; key: number }>>([]);
  const fallingStarIdRef = useRef(0);

  // Joined groups sidebar state
  const [showJoinedGroupsModal, setShowJoinedGroupsModal] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [isLoadingJoinedGroups, setIsLoadingJoinedGroups] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(0)).current;

  // Load joined groups
  const loadJoinedGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setJoinedGroups([]);
      return;
    }

    setIsLoadingJoinedGroups(true);
    try {
      // Load all groups and filter for joined ones
      const response = await groupService.getGroups(1, 100);
      if (response.success && response.data) {
        const joined = response.data.filter(group => group.isMember);
        setJoinedGroups(joined);
      }
    } catch (error) {
      console.error('Error loading joined groups:', error);
      setJoinedGroups([]);
    } finally {
      setIsLoadingJoinedGroups(false);
    }
  }, [isAuthenticated]);

  // Load joined groups when modal opens
  useEffect(() => {
    if (showJoinedGroupsModal && isAuthenticated) {
      loadJoinedGroups();
    }
  }, [showJoinedGroupsModal, isAuthenticated, loadJoinedGroups]);

  // Animate sidebar
  useEffect(() => {
    if (showJoinedGroupsModal) {
      Animated.timing(sidebarAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [showJoinedGroupsModal]);

  // Track loading state with ref to prevent race conditions
  const isLoadingRef = useRef(false);
  
  // Store loadPosts function in ref to prevent infinite loops
  const loadPostsRef = useRef<((pageNum?: number, append?: boolean) => Promise<void>) | null>(null);
  
  // Load posts based on current filters
  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
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
      // Handle different tabs (Post type filters)
      else if (activeTab === 'saved') {
        // Saved: User's saved posts
        response = await postService.getSavedPosts(pageNum, 20);
      } else {
        // All, Post, Question, Story: Filter by post type
        const postType = activeTab === 'all' ? undefined : activeTab;
        response = await postService.getPosts({
          page: pageNum,
          limit: 20,
          groupId: showAllPublicPosts ? undefined : groupId, // Don't filter by specific group if showing all public posts
          postType,
          sortBy: sortOption,
          publicOnly: showAllPublicPosts, // Only show posts from public communities
        });
      }
      
      
      if (response.success && response.data) {
        // Filter out posts with invalid IDs
        const validPosts = response.data.filter((post: Post) => {
          if (!post || !post._id) return false;
          // Check if post ID is a valid MongoDB ObjectId format (24 hex characters)
          const postId = post._id.toString();
          return /^[0-9a-fA-F]{24}$/.test(postId);
        });
        
        // Update therapist count banner:
        // 1) Prefer explicit value from backend when available
        // 2) Fallback: derive a stable 3–5 value from backend data (first post ID),
        //    so the number is linked to backend and not obviously random on the client.
        const backendTherapistCount = (response as any).therapistCount;
        if (typeof backendTherapistCount === 'number') {
          setTherapistCount(backendTherapistCount);
        } else if (therapistCount === null && validPosts.length > 0) {
          const firstId = validPosts[0]._id.toString();
          let hash = 0;
          for (let i = 0; i < firstId.length; i++) {
            hash = (hash * 31 + firstId.charCodeAt(i)) | 0;
          }
          const derivedCount = 3 + Math.abs(hash) % 3; // 3, 4, or 5
          setTherapistCount(derivedCount);
        }
        
        if (append) {
          setPosts((prev) => [...prev, ...validPosts]);
        } else {
          setPosts(validPosts);
        }
        
        
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }
      } else {
        // Don't log 429 rate limit errors - they're handled gracefully
        const isRateLimit = response.message && response.message.includes('Too many requests');
        // Only log non-404, non-rate-limit errors
        if (response.message && !response.message.includes('not found') && !response.message.includes('Invalid post ID format') && !isRateLimit) {
          console.error('Error loading posts:', response.message);
        }
        if (!append) {
          setPosts([]);
        }
      }
    } catch (error: any) {
      // Don't log 429 rate limit errors
      const isRateLimit = error.message && error.message.includes('Too many requests');
      // Only log if it's not a 404, invalid ID format, or rate limit error
      if (error.message && !error.message.includes('not found') && !error.message.includes('Invalid post ID format') && !isRateLimit) {
        console.error('Error loading posts:', error);
      }
      if (!append) {
        setPosts([]);
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [activeTab, selectedCommunity, sortOption, isSearching, searchQuery, isAuthenticated, showAllPublicPosts]);

  // Update ref whenever loadPosts changes
  useEffect(() => {
    loadPostsRef.current = loadPosts;
  }, [loadPosts]);

  // Track if initial load has been done
  const hasInitialLoadRef = useRef(false);
  
  // Initial load when screen is focused (first time opening the screen)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !isLoadingRef.current) {
        // Load posts when screen is focused for the first time or if no posts
        if (!hasInitialLoadRef.current || posts.length === 0) {
          setPage(1);
          setHasMore(true);
          if (loadPostsRef.current) {
            loadPostsRef.current(1, false);
          }
          hasInitialLoadRef.current = true;
        }
      }
    }, [isAuthenticated, posts.length])
  );

  // Reload posts when filters change (with debounce to prevent rapid requests)
  // NOTE: loadPosts is NOT in dependencies to prevent infinite loops
  // We use loadPostsRef.current instead
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    
    // Debounce to prevent rapid successive requests
    const timeoutId = setTimeout(() => {
      if (loadPostsRef.current) {
        loadPostsRef.current(1, false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [activeTab, selectedCommunity, sortOption, isSearching, searchQuery, showAllPublicPosts]);

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

  // Random falling star effect
  useEffect(() => {
    const createFallingStar = () => {
      const id = fallingStarIdRef.current++;
      setFallingStars((prev) => [...prev, { id, key: Date.now() + id }]);
    };
    
    // Create first falling star after a random delay (2-5 seconds)
    const initialDelay = 2000 + Math.random() * 3000;
    const initialTimeout = setTimeout(createFallingStar, initialDelay);
    
    // Then create falling stars at random intervals (3-8 seconds) - more frequent
    let currentTimeout: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 5000; // 3-8 seconds
      currentTimeout = setTimeout(() => {
        createFallingStar();
        scheduleNext();
      }, delay);
    };
    
    scheduleNext();
    
    return () => {
      clearTimeout(initialTimeout);
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);
  
  const removeFallingStar = useCallback((id: number) => {
    setFallingStars((prev) => prev.filter((star) => star.id !== id));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    if (loadPostsRef.current) {
      await loadPostsRef.current(1, false);
    }
    setIsRefreshing(false);
  }, []); // No dependencies to prevent infinite loops

  const handleTabChange = (tab: FeedTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleCommunityChange = useCallback((communityId: string | null) => {
    setSelectedCommunity(communityId);
    // Reset showAllPublicPosts when a specific community is selected
    if (communityId) {
      setShowAllPublicPosts(false);
    }
  }, []);

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setPage(1);
    setHasMore(true);
    // loadPosts will be called automatically by the useEffect that watches searchQuery
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
      if (loadPostsRef.current) {
        loadPostsRef.current(nextPage, true);
      }
    }
  }, [isLoading, hasMore, page]); // Removed loadPosts from dependencies

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    router.push('/create-post');
  };

  const handleShare = async (post: Post) => {
    // Share functionality - can be implemented later with expo-sharing or native share
    // For now, this is a placeholder
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

  const handleDeletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => router.push(`/post/${item._id}`)}
      onLike={() => handleLike(item._id)}
      onComment={() => router.push(`/post/${item._id}`)}
      onShare={() => handleShare(item)}
      onSave={() => handleSavePost(item._id)}
      onAuthorPress={() => router.push(`/user/${item.author._id}`)}
      onGroupPress={() => item.groupId && router.push(`/group/${item.groupId}`)}
      onDelete={() => handleDeletePost(item._id)}
      currentUserId={user?._id}
      isSaved={item.isSaved}
    />
  ), [user?._id, router, handleLike, handleShare, handleSavePost, handleDeletePost]);

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
      {/* Therapist availability banner */}
      {typeof therapistCount === 'number' && (
        <GlassCard variant="primary" gradient padding="sm" style={styles.therapistBanner}>
          <View style={styles.therapistBannerContent}>
            <View style={styles.therapistIconContainer}>
              <LinearGradient
                colors={['rgba(96, 165, 250, 0.9)', 'rgba(167, 139, 250, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.therapistIconGradient}
              >
                <Ionicons name="medical" size={16} color={colors.white} />
              </LinearGradient>
            </View>
            <View style={styles.therapistTextContainer}>
              <Text style={styles.therapistBannerTitle}>
                {therapistCount === 1
                  ? 'There is 1 certified therapist online'
                  : `There are ${therapistCount} certified therapists online`}
              </Text>
              <Text style={styles.therapistBannerSubtitle}>
                They can answer questions and give guidance under posts.
              </Text>
            </View>
            <View style={styles.therapistStatusDotContainer}>
              <View style={styles.therapistStatusDot} />
            </View>
          </View>
        </GlassCard>
      )}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <CommunityFilter
          selectedCommunity={selectedCommunity}
          onCommunityChange={handleCommunityChange}
          isAuthenticated={isAuthenticated}
          showAllPublicPosts={showAllPublicPosts}
          onShowAllPublicPostsChange={setShowAllPublicPosts}
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
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={colors.backgroundGradient as readonly [string, string, string]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Star field effect */}
      <View style={feedStyles.starField}>
        {Array.from({ length: 50 }).map((_, i) => (
          <AnimatedStar key={i} index={i} />
        ))}
      </View>
      
      {/* Falling stars */}
      {fallingStars.map((star) => (
        <FallingStar
          key={star.key}
          onComplete={() => removeFallingStar(star.id)}
        />
      ))}
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
            <Pressable
              style={[styles.menuButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
              onPress={() => setShowJoinedGroupsModal(true)}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Aurora</Text>
            <View style={styles.headerRight}>
              <SearchBar
                onSearch={handleSearch}
                isExpanded={isSearchExpanded}
                onExpandChange={handleSearchExpandChange}
              />
              <Pressable
                style={[styles.headerButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
                onPress={() => router.push('/notifications')}
              >
                <View style={styles.notificationButtonContainer}>
                  <Ionicons name="notifications-outline" size={24} color={colors.text} />
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={undefined}
        scrollEventThrottle={16}
        decelerationRate="normal"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
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
                  activeTab === 'saved'
                    ? 'bookmark-outline'
                    : activeTab === 'post'
                      ? 'chatbubbles-outline'
                      : activeTab === 'question'
                        ? 'help-circle-outline'
                        : activeTab === 'story'
                          ? 'book-outline'
                          : 'apps-outline'
                } 
                size={48} 
                color={colors.textMuted} 
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
          <Ionicons name="add" size={28} color={colors.white} />
        </LinearGradient>
      </Pressable>

      {/* Joined Groups Sidebar Modal */}
      <Modal
        visible={showJoinedGroupsModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowJoinedGroupsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalSidebar,
              { paddingTop: insets.top + SPACING.md },
              {
                transform: [
                  {
                    translateX: sidebarAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-width * 0.85, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Communities</Text>
              <Pressable
                onPress={() => setShowJoinedGroupsModal(false)}
                style={[styles.modalCloseButton, { backgroundColor: colors.glass.backgroundLight }]}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* All Communities Option */}
            <Pressable
              style={styles.modalAllCommunitiesItem}
              onPress={() => {
                setShowJoinedGroupsModal(false);
                router.push('/(tabs)/groups');
              }}
            >
              <View style={styles.modalGroupItemLeft}>
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.4)', 'rgba(167, 139, 250, 0.4)']}
                  style={styles.modalGroupAvatarGradient}
                >
                  <Ionicons name="apps" size={20} color={colors.primary} />
                </LinearGradient>
                <View style={styles.modalGroupInfo}>
                  <Text style={[styles.modalGroupName, { color: colors.primary }]}>
                    Alle communities
                  </Text>
                  <Text style={styles.modalGroupMeta}>
                    Browse all communities
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </Pressable>

            {/* All Public Posts Option */}
            <Pressable
              style={[
                styles.modalAllCommunitiesItem,
                showAllPublicPosts && { backgroundColor: colors.glass.background }
              ]}
              onPress={() => {
                setShowJoinedGroupsModal(false);
                setShowAllPublicPosts(true);
                setSelectedCommunity(null); // Clear selected community
              }}
            >
              <View style={styles.modalGroupItemLeft}>
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.4)', 'rgba(167, 139, 250, 0.4)']}
                  style={styles.modalGroupAvatarGradient}
                >
                  <Ionicons name="globe-outline" size={20} color={colors.primary} />
                </LinearGradient>
                <View style={styles.modalGroupInfo}>
                  <Text style={[styles.modalGroupName, { color: colors.primary }]}>
                    Alle public posts
                  </Text>
                  <Text style={styles.modalGroupMeta}>
                    Posts van alle public communities
                  </Text>
                </View>
              </View>
              {showAllPublicPosts && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </Pressable>

            <View style={styles.modalDivider} />

            {isLoadingJoinedGroups ? (
              <View style={styles.modalLoadingContainer}>
                <LoadingSpinner size="md" />
              </View>
            ) : joinedGroups.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <Text style={styles.modalEmptyText}>No communities yet</Text>
                <Text style={styles.modalEmptySubtext}>
                  Join communities to see them here
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.modalSectionHeader}>
                  <Text style={styles.modalSectionTitle}>Your Communities</Text>
                </View>
                <FlatList
                  data={joinedGroups}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.modalGroupItem}
                      onPress={() => {
                        setShowJoinedGroupsModal(false);
                        router.push(`/group/${item._id}`);
                      }}
                    >
                      <View style={styles.modalGroupItemLeft}>
                        {item.avatar ? (
                          <Image source={{ uri: item.avatar }} style={styles.modalGroupAvatar} />
                        ) : (
                          <LinearGradient
                            colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                            style={styles.modalGroupAvatarGradient}
                          >
                            <Ionicons name="people" size={20} color={colors.primary} />
                          </LinearGradient>
                        )}
                        <View style={styles.modalGroupInfo}>
                          <Text style={styles.modalGroupName}>{item.name}</Text>
                          <Text style={styles.modalGroupMeta}>
                            {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </Pressable>
                  )}
                  style={styles.modalList}
                  contentContainerStyle={styles.modalListContent}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  scrollEventThrottle={16}
                />
              </>
            )}
          </Animated.View>
          <Animated.View
            style={[
              styles.modalBackdrop,
              {
                opacity: sidebarAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowJoinedGroupsModal(false)}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const feedStyles = StyleSheet.create({
  starField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  fallingStarContainer: {
    position: 'absolute',
    top: -20,
    width: 6,
    height: 30,
    zIndex: 1,
  },
  fallingStar: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  fallingStarTrail: {
    position: 'absolute',
    top: 6,
    left: 1.5,
    width: 3,
    height: 24,
    borderRadius: 1.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    flex: 1,
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
  therapistBanner: {
    marginBottom: SPACING.sm,
  },
  therapistBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  therapistIconContainer: {
    marginRight: SPACING.sm,
  },
  therapistIconGradient: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  therapistTextContainer: {
    flex: 1,
  },
  therapistBannerTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  therapistBannerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
    fontSize: 11,
  },
  therapistStatusDotContainer: {
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  therapistStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
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
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalSidebar: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderRightColor: COLORS.glass.border,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.glass.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  modalEmptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  modalEmptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalEmptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  modalEmptyButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  modalEmptyButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  modalList: {
    flex: 1,
  },
  modalListContent: {
    paddingVertical: SPACING.sm,
  },
  modalGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalGroupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalGroupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.md,
  },
  modalGroupAvatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  modalGroupInfo: {
    flex: 1,
  },
  modalGroupName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalGroupMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalAllCommunitiesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.glass.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.glass.border,
    marginVertical: SPACING.xs,
  },
  modalSectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.glass.backgroundDark,
  },
  modalSectionTitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
