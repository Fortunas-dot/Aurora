import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, GlassInput, Avatar, TagChip, LoadingSpinner } from '../../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { groupService, Group } from '../../src/services/group.service';
import { userService, UserProfile } from '../../src/services/user.service';
import { useAuthStore } from '../../src/store/authStore';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingOverlay } from '../../src/components/onboarding/OnboardingOverlay';
import { COUNTRIES, getCountryName } from '../../src/constants/countries';

// Health conditions list (same as in create-group.tsx)
const HEALTH_CONDITIONS = [
  'Depression',
  'Anxiety Disorder',
  'PTSD',
  'ADHD',
  'Autism',
  'Eating Disorder',
  'Addiction',
  'Borderline',
  'OCD',
  'Burnout',
  'Stress',
  'Sleep Problems',
  'Chronic Pain',
  'Fibromyalgia',
  'Rheumatism',
  'Diabetes',
  'Heart Problems',
  'Asthma',
  'Migraine',
  'Epilepsy',
  'MS',
  'Other',
];

type TabType = 'groups' | 'buddies';

const { width, height } = Dimensions.get('window');

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
        styles.star,
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
        styles.fallingStarContainer,
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
          styles.fallingStarTrail,
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
      <View style={styles.fallingStar} />
    </Animated.View>
  );
};

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, user: currentUser } = useAuthStore();
  const { isActive: isOnboardingActive, currentStep, nextStep } = useOnboardingStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'joined'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // null = all, country code = specific country
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [showCountrySearch, setShowCountrySearch] = useState(false);
  const [selectedHealthCondition, setSelectedHealthCondition] = useState<string | null>(null);
  const [healthConditionSearchQuery, setHealthConditionSearchQuery] = useState('');
  const [showHealthConditionSearch, setShowHealthConditionSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false); // Combined filter modal
  
  // Buddies state
  const [buddies, setBuddies] = useState<UserProfile[]>([]);
  const [buddySearchQuery, setBuddySearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Falling star state
  const [fallingStars, setFallingStars] = useState<Array<{ id: number; key: number }>>([]);
  const fallingStarIdRef = useRef(0);

  // Load groups
  const loadGroups = useCallback(async (pageNum: number = 1, append: boolean = false, search?: string, country?: string | null) => {
    setIsLoading(true);
    try {
      const response = await groupService.getGroups(pageNum, 20, search || undefined, undefined, country || undefined);
      
      if (response.success) {
        const groupsData = response.data || [];
        
        if (append) {
          setGroups((prev) => [...prev, ...groupsData]);
        } else {
          setGroups(groupsData);
        }
        
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        } else {
          setHasMore(false);
        }
      } else {
        if (!append) {
          setGroups([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      if (!append) {
        setGroups([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load buddies (following users)
  const loadBuddies = useCallback(async () => {
    if (!isAuthenticated || !currentUser?._id) return;
    
    setIsLoading(true);
    try {
      const response = await userService.getFollowing(currentUser._id, 1, 100);
      
      if (response.success && response.data) {
        setBuddies(response.data);
      }
    } catch (error) {
      console.error('Error loading buddies:', error);
      setBuddies([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser?._id]);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await userService.searchUsers(query, 1, 20);
      
      if (response.success && response.data) {
        // Filter out current user
        const filtered = response.data.filter(user => user._id !== currentUser?._id);
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    if (activeTab === 'groups') {
      loadGroups(1, false, groupSearchQuery, selectedCountry, selectedHealthCondition);
    } else if (activeTab === 'buddies') {
      loadBuddies();
    }
  }, [activeTab, selectedCountry, selectedHealthCondition, loadGroups, loadBuddies, groupSearchQuery]);

  // Refresh groups when screen comes into focus (e.g., after creating a group)
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'groups') {
        loadGroups(1, false, groupSearchQuery, selectedCountry, selectedHealthCondition);
      } else if (activeTab === 'buddies') {
        loadBuddies();
      }
    }, [activeTab, loadGroups, loadBuddies, groupSearchQuery, selectedCountry, selectedHealthCondition])
  );

  // Search effect for groups
  useEffect(() => {
    if (activeTab === 'groups') {
      const timeoutId = setTimeout(() => {
        loadGroups(1, false, groupSearchQuery, selectedCountry, selectedHealthCondition);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [groupSearchQuery, selectedCountry, selectedHealthCondition, activeTab, loadGroups]);

  // Search effect for buddies
  useEffect(() => {
    if (activeTab === 'buddies') {
      const timeoutId = setTimeout(() => {
        searchUsers(buddySearchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [buddySearchQuery, activeTab, searchUsers]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    
    if (activeTab === 'groups') {
      await loadGroups(1, false, groupSearchQuery, selectedCountry, selectedHealthCondition);
    } else {
      await loadBuddies();
    }
    
    setIsRefreshing(false);
  }, [activeTab, loadGroups, loadBuddies, groupSearchQuery, selectedCountry, selectedHealthCondition]);

  const handleJoinGroup = useCallback(async (groupId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      const group = groups.find((g) => g._id === groupId);
      if (!group) return;

      if (group.isMember) {
        const response = await groupService.leaveGroup(groupId);
        if (response.success) {
          setGroups((prev) =>
            prev.map((g) =>
              g._id === groupId
                ? { ...g, isMember: false, memberCount: response.data!.memberCount }
                : g
            )
          );
        }
      } else {
        const response = await groupService.joinGroup(groupId);
        if (response.success) {
          setGroups((prev) =>
            prev.map((g) =>
              g._id === groupId
                ? { ...g, isMember: true, memberCount: response.data!.memberCount }
                : g
            )
          );
        }
      }
    } catch (error) {
      console.error('Error joining/leaving group:', error);
    }
  }, [isAuthenticated, groups, router]);

  const handleFollowUser = useCallback(async (userId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      const response = await userService.followUser(userId);
      if (response.success) {
        // Determine new following state
        const newFollowingState = response.data?.isFollowing !== undefined 
          ? response.data.isFollowing 
          : !searchResults.find(u => u._id === userId)?.isFollowing;
        
        // Update search results
        setSearchResults((prev) =>
          prev.map((user) =>
            user._id === userId
              ? { ...user, isFollowing: newFollowingState }
              : user
          )
        );
        
        // Update buddies list if user is in it
        setBuddies((prev) =>
          prev.map((user) =>
            user._id === userId
              ? { ...user, isFollowing: newFollowingState }
              : user
          )
        );
        
        // Reload buddies if now following (to add to list)
        if (newFollowingState) {
          loadBuddies();
          // Navigate to conversation after following
          router.push(`/conversation/${userId}`);
        }
      } else {
        console.error('Follow failed:', response.message);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  }, [isAuthenticated, searchResults, loadBuddies, router]);

  const handleMessageUser = useCallback((userId: string) => {
    router.push(`/conversation/${userId}`);
  }, [router]);

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

  const loadMore = useCallback(() => {
    if (activeTab === 'groups' && !isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadGroups(nextPage, true, groupSearchQuery, selectedCountry, selectedHealthCondition);
    }
  }, [activeTab, isLoading, hasMore, page, groupSearchQuery, selectedCountry, selectedHealthCondition, loadGroups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesFilter = selectedFilter === 'all' || group.isMember;
      return matchesFilter;
    });
  }, [groups, selectedFilter]);

  const displayBuddies = useMemo(() => {
    return buddySearchQuery.trim() ? searchResults : buddies;
  }, [buddySearchQuery, searchResults, buddies]);

  // Render Group Card - Memoized component
  const GroupCard = React.memo<{ item: Group; onJoin: (id: string) => void; onPress: (id: string) => void }>(
    ({ item, onJoin, onPress }) => {
      const { colors } = useTheme();
      
      return (
        <GlassCard style={styles.groupCard} padding={0} onPress={() => onPress(item._id)}>
          <View style={styles.groupHeader}>
            <View style={styles.groupAvatar}>
              {item.avatar ? (
                <Image 
                  source={{ uri: item.avatar }} 
                  style={styles.groupAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.groupAvatarGradient}
                >
                  <Ionicons name="people" size={24} color={colors.primary} />
                </LinearGradient>
              )}
            </View>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.groupMeta}>
                <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.groupMetaText, { color: colors.textMuted }]}>{item.memberCount} members</Text>
                {item.country && (
                  <>
                    <Ionicons name="globe-outline" size={14} color={colors.textMuted} style={{ marginLeft: SPACING.sm }} />
                    <Text style={[styles.groupMetaText, { color: colors.textMuted }]}>{getCountryName(item.country)}</Text>
                  </>
                )}
                {item.isPrivate && (
                  <>
                    <Ionicons name="lock-closed" size={14} color={colors.textMuted} style={{ marginLeft: SPACING.sm }} />
                    <Text style={[styles.groupMetaText, { color: colors.textMuted }]}>Private</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <Text style={[styles.groupDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.groupTags}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <TagChip key={`${item._id}-tag-${index}`} label={tag} size="sm" />
            ))}
          </View>

          <View style={styles.groupFooter}>
            {/* Member Avatars Stack */}
            {item.members && item.members.length > 0 && (
              <View style={styles.memberAvatarsContainer}>
                {item.members.slice(0, 4).map((member, index) => (
                  <View
                    key={member._id || index}
                    style={[
                      styles.memberAvatarWrapper,
                      { marginLeft: index > 0 ? -8 : 0 },
                    ]}
                  >
                    <Avatar
                      uri={member.avatar}
                      name={member.displayName || member.username}
                      userId={member._id}
                      avatarCharacter={member.avatarCharacter}
                      avatarBackgroundColor={member.avatarBackgroundColor}
                      size="sm"
                      showBorder={true}
                    />
                  </View>
                ))}
                {item.memberCount > 4 && (
                  <View
                    style={[
                      styles.memberAvatarWrapper,
                      styles.memberAvatarMore,
                      { marginLeft: -8 },
                    ]}
                  >
                    <View style={[styles.memberAvatarMoreContainer, { backgroundColor: colors.glass.backgroundDark, borderColor: colors.glass.border }]}>
                      <Text style={[styles.memberAvatarMoreText, { color: colors.text }]}>
                        +{item.memberCount - 4}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
            <View style={styles.groupFooterSpacer} />
            <GlassButton
              title={item.isMember ? 'Joined' : 'Join'}
              onPress={() => onJoin(item._id)}
              variant={item.isMember ? 'default' : 'primary'}
              size="sm"
              icon={
                <Ionicons
                  name={item.isMember ? 'checkmark' : 'add'}
                  size={16}
                  color={item.isMember ? colors.text : COLORS.white}
                  style={{ marginRight: SPACING.xs }}
                />
              }
            />
          </View>
        </GlassCard>
      );
    },
    (prevProps, nextProps) => {
      // Only re-render if these specific properties change
      return (
        prevProps.item._id === nextProps.item._id &&
        prevProps.item.isMember === nextProps.item.isMember &&
        prevProps.item.memberCount === nextProps.item.memberCount &&
        prevProps.item.name === nextProps.item.name &&
        prevProps.item.description === nextProps.item.description &&
        prevProps.item.avatar === nextProps.item.avatar
      );
    }
  );

  const handleGroupPress = useCallback((id: string) => {
    router.push(`/group/${id}`);
  }, [router]);

  const renderGroup = useCallback(({ item }: { item: Group }) => (
    <GroupCard 
      item={item} 
      onJoin={handleJoinGroup}
      onPress={handleGroupPress}
    />
  ), [handleJoinGroup, handleGroupPress]);

  // Render Buddy Card - Memoized component
  const BuddyCard = React.memo<{ 
    item: UserProfile; 
    isInBuddiesList: boolean;
    onFollow: (id: string) => void; 
    onMessage: (id: string) => void;
    onPress: (id: string) => void;
  }>(
    ({ item, isInBuddiesList, onFollow, onMessage, onPress }) => {
      const { colors } = useTheme();
      const isFollowing = item.isFollowing ?? false;
      
      return (
        <GlassCard style={styles.buddyCard} padding="md">
          <View style={styles.buddyHeader}>
            <Pressable onPress={() => onPress(item._id)}>
              <Avatar
                uri={item.avatar}
                name={item.displayName || item.username}
                userId={item._id}
                avatarCharacter={item.avatarCharacter}
                avatarBackgroundColor={item.avatarBackgroundColor}
                size={48}
              />
            </Pressable>
            <View style={styles.buddyInfo}>
              <Pressable 
                onPress={() => onPress(item._id)}
                style={styles.buddyInfoText}
              >
                <Text style={[styles.buddyName, { color: colors.text }]} numberOfLines={1}>
                  {item.displayName || item.username}
                </Text>
                {item.bio && (
                  <Text style={[styles.buddyBio, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.bio}
                  </Text>
                )}
              </Pressable>
              <View style={styles.buddyActions}>
                {isInBuddiesList && (
                  <Pressable
                    style={styles.messageButton}
                    onPress={() => onMessage(item._id)}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                  </Pressable>
                )}
                {!isInBuddiesList && (
                  <>
                    {isFollowing && (
                      <Pressable
                        style={styles.messageButton}
                        onPress={() => onMessage(item._id)}
                      >
                        <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                      </Pressable>
                    )}
                    <GlassButton
                      title={isFollowing ? 'Following' : 'Follow'}
                      onPress={() => onFollow(item._id)}
                      variant={isFollowing ? 'default' : 'primary'}
                      size="sm"
                      style={styles.followButton}
                    />
                  </>
                )}
              </View>
            </View>
          </View>
        </GlassCard>
      );
    },
    (prevProps, nextProps) => {
      // Only re-render if these specific properties change
      return (
        prevProps.item._id === nextProps.item._id &&
        prevProps.item.isFollowing === nextProps.item.isFollowing &&
        prevProps.item.displayName === nextProps.item.displayName &&
        prevProps.item.username === nextProps.item.username &&
        prevProps.item.bio === nextProps.item.bio &&
        prevProps.item.avatar === nextProps.item.avatar &&
        prevProps.isInBuddiesList === nextProps.isInBuddiesList
      );
    }
  );

  const handleUserPress = useCallback((id: string) => {
    router.push(`/user/${id}`);
  }, [router]);

  const renderBuddy = useCallback(({ item }: { item: UserProfile }) => {
    const isInBuddiesList = buddies.some(b => b._id === item._id);
    
    return (
      <BuddyCard
        item={item}
        isInBuddiesList={isInBuddiesList}
        onFollow={handleFollowUser}
        onMessage={handleMessageUser}
        onPress={handleUserPress}
      />
    );
  }, [buddies, handleFollowUser, handleMessageUser, handleUserPress]);

  return (
    <LinearGradient
      colors={colors.backgroundGradient as readonly [string, string, string]}
      style={styles.container}
    >
      {/* Star field effect */}
      <View style={styles.starField}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Groups / Buddies</Text>
        {activeTab === 'groups' && (
          <Pressable
            style={[styles.headerButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
            onPress={() => {
              if (!isAuthenticated) {
                router.push('/(auth)/login');
              } else {
                router.push('/create-group');
              }
            }}
          >
            <Ionicons name="add" size={24} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* Tabs - More prominent with better spacing */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'groups' && [styles.tabActive, { backgroundColor: colors.glass.backgroundDark, borderColor: colors.glass.border }]]}
          onPress={() => setActiveTab('groups')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'groups' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, { color: activeTab === 'groups' ? colors.primary : colors.textMuted }]}>
            Groups
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'buddies' && [styles.tabActive, { backgroundColor: colors.glass.backgroundDark, borderColor: colors.glass.border }]]}
          onPress={() => setActiveTab('buddies')}
        >
          <Ionicons
            name="person"
            size={20}
            color={activeTab === 'buddies' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, { color: activeTab === 'buddies' ? colors.primary : colors.textMuted }]}>
            Buddies
          </Text>
        </Pressable>
      </View>

      {/* Search Bar - More prominent with better spacing */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={activeTab === 'groups' ? groupSearchQuery : buddySearchQuery}
          onChangeText={activeTab === 'groups' ? setGroupSearchQuery : setBuddySearchQuery}
          placeholder={activeTab === 'groups' ? 'Search groups...' : 'Search users...'}
          style={styles.searchInput}
          icon="search"
        />
      </View>

      {/* Groups Tab Content */}
      {activeTab === 'groups' && (
        <>
          {/* Filters Row - Compact with filter button */}
          <View style={styles.filtersRow}>
            <View style={styles.filterChipsContainer}>
              <Pressable
                style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                  All Groups
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, selectedFilter === 'joined' && styles.filterChipActive]}
                onPress={() => setSelectedFilter('joined')}
              >
                <Text style={[styles.filterChipText, selectedFilter === 'joined' && styles.filterChipTextActive]}>
                  My Groups
                </Text>
              </Pressable>
              {selectedCountry && (
                <Pressable
                  style={[styles.filterChip, styles.filterChipCountry]}
                  onPress={() => {
                    setShowFilterModal(true);
                  }}
                >
                  <Ionicons name="location" size={14} color={colors.primary} />
                  <Text style={[styles.filterChipText, { color: colors.primary }]}>
                    {getCountryName(selectedCountry)}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedCountry(null);
                    }}
                    style={styles.filterChipClose}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </Pressable>
                </Pressable>
              )}
              {selectedHealthCondition && (
                <Pressable
                  style={[styles.filterChip, styles.filterChipCountry]}
                  onPress={() => {
                    setShowFilterModal(true);
                  }}
                >
                  <Ionicons name="medical" size={14} color={colors.primary} />
                  <Text style={[styles.filterChipText, { color: colors.primary }]}>
                    {selectedHealthCondition}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedHealthCondition(null);
                    }}
                    style={styles.filterChipClose}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </Pressable>
                </Pressable>
              )}
            </View>
            <Pressable
              style={[styles.filterButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Inline Filter Section - Appears between filter chips and groups list */}
          {showFilterModal && (
            <View style={[styles.inlineFilterContainer, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}>
              <View style={styles.inlineFilterHeader}>
                <Text style={[styles.inlineFilterTitle, { color: colors.text }]}>Filters</Text>
                <Pressable
                  onPress={() => {
                    setShowFilterModal(false);
                    setCountrySearchQuery('');
                    setHealthConditionSearchQuery('');
                  }}
                  style={styles.inlineFilterClose}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.inlineFilterScroll} showsVerticalScrollIndicator={false}>
                  {/* Country Filter Section */}
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionTitleContainer}>
                      <Ionicons name="location" size={18} color={colors.primary} />
                      <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                        Filter by Country
                      </Text>
                    </View>
                    <View style={styles.filterSearchContainer}>
                      <GlassInput
                        value={countrySearchQuery}
                        onChangeText={setCountrySearchQuery}
                        placeholder="Search for a country..."
                        icon="search"
                        style={styles.filterSearchInput}
                      />
                    </View>
                    <View style={[styles.filterResultsContainer, { backgroundColor: colors.glass.backgroundDark, borderColor: colors.glass.border }]}>
                      {COUNTRIES.filter((country) => {
                        if (country.code === 'global') return false;
                        if (!countrySearchQuery.trim()) return true;
                        const query = countrySearchQuery.toLowerCase();
                        return (
                          country.name.toLowerCase().includes(query) ||
                          country.code.toLowerCase().includes(query)
                        );
                      }).length > 0 ? (
                        COUNTRIES.filter((country) => {
                          if (country.code === 'global') return false;
                          if (!countrySearchQuery.trim()) return true;
                          const query = countrySearchQuery.toLowerCase();
                          return (
                            country.name.toLowerCase().includes(query) ||
                            country.code.toLowerCase().includes(query)
                          );
                        }).map((item) => (
                          <Pressable
                            key={item.code}
                            style={[
                              styles.filterResultItem,
                              { borderBottomColor: colors.glass.border },
                              selectedCountry === item.code && [styles.filterResultItemActive, { backgroundColor: 'rgba(96, 165, 250, 0.1)' }],
                            ]}
                            onPress={() => {
                              setSelectedCountry(item.code);
                              setCountrySearchQuery('');
                            }}
                          >
                            <Text
                              style={[
                                styles.filterResultText,
                                { color: colors.text },
                                selectedCountry === item.code && { color: colors.primary, fontWeight: '600' },
                              ]}
                            >
                              {item.name}
                            </Text>
                            {selectedCountry === item.code && (
                              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                            )}
                          </Pressable>
                        ))
                      ) : (
                        <View style={styles.filterResultsEmpty}>
                          <Text style={[styles.filterResultsEmptyText, { color: colors.textMuted }]}>
                            {countrySearchQuery.trim() ? 'No countries found' : 'Select a country'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Health Condition Filter Section */}
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionTitleContainer}>
                      <Ionicons name="medical" size={18} color={colors.primary} />
                      <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                        Filter by Health Condition
                      </Text>
                    </View>
                    <View style={styles.filterSearchContainer}>
                      <GlassInput
                        value={healthConditionSearchQuery}
                        onChangeText={setHealthConditionSearchQuery}
                        placeholder="Search for a health condition..."
                        icon="search"
                        style={styles.filterSearchInput}
                      />
                    </View>
                    <View style={[styles.filterResultsContainer, { backgroundColor: colors.glass.backgroundDark, borderColor: colors.glass.border }]}>
                      {HEALTH_CONDITIONS.filter((condition) => {
                        if (!healthConditionSearchQuery.trim()) return true;
                        const query = healthConditionSearchQuery.toLowerCase();
                        return condition.toLowerCase().includes(query);
                      }).length > 0 ? (
                        HEALTH_CONDITIONS.filter((condition) => {
                          if (!healthConditionSearchQuery.trim()) return true;
                          const query = healthConditionSearchQuery.toLowerCase();
                          return condition.toLowerCase().includes(query);
                        }).map((item) => (
                          <Pressable
                            key={item}
                            style={[
                              styles.filterResultItem,
                              { borderBottomColor: colors.glass.border },
                              selectedHealthCondition === item && [styles.filterResultItemActive, { backgroundColor: 'rgba(96, 165, 250, 0.1)' }],
                            ]}
                            onPress={() => {
                              setSelectedHealthCondition(item);
                              setHealthConditionSearchQuery('');
                            }}
                          >
                            <Text
                              style={[
                                styles.filterResultText,
                                { color: colors.text },
                                selectedHealthCondition === item && { color: colors.primary, fontWeight: '600' },
                              ]}
                            >
                              {item}
                            </Text>
                            {selectedHealthCondition === item && (
                              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                            )}
                          </Pressable>
                        ))
                      ) : (
                        <View style={styles.filterResultsEmpty}>
                          <Text style={[styles.filterResultsEmptyText, { color: colors.textMuted }]}>
                            {healthConditionSearchQuery.trim() ? 'No health conditions found' : 'Select a health condition'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
              </ScrollView>
            </View>
          )}

          {/* Divider line between filters and groups */}
          {showFilterModal && (
            <View style={[styles.filterDivider, { borderBottomColor: colors.glass.border }]} />
          )}

          {/* Groups List */}
          <FlatList
            data={filteredGroups}
            renderItem={renderGroup}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            scrollEventThrottle={16}
            decelerationRate="normal"
            getItemLayout={undefined}
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
              isLoading && groups.length > 0 ? (
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
                  <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No groups found</Text>
                  {isAuthenticated && (
                    <Pressable
                      style={styles.createGroupButton}
                      onPress={() => router.push('/create-group')}
                    >
                      <Text style={styles.createGroupButtonText}>Create a group</Text>
                    </Pressable>
                  )}
                </View>
              )
            }
          />
        </>
      )}

      {/* Buddies Tab Content */}
      {activeTab === 'buddies' && (
        <FlatList
          data={displayBuddies}
          renderItem={renderBuddy}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
          scrollEventThrottle={16}
          decelerationRate="normal"
          getItemLayout={undefined}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            isSearching ? (
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
                <Ionicons name="person-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {buddySearchQuery.trim()
                    ? 'No users found'
                    : isAuthenticated
                    ? 'You are not following anyone yet. Search for users to follow!'
                    : 'Log in to see buddies'}
                </Text>
                {!isAuthenticated && (
                  <Pressable
                    style={[styles.createGroupButton, { backgroundColor: colors.glass.backgroundLight, borderColor: colors.glass.border }]}
                    onPress={() => router.push('/(auth)/login')}
                  >
                    <Text style={[styles.createGroupButtonText, { color: colors.primary }]}>Log in</Text>
                  </Pressable>
                )}
              </View>
            )
          }
        />
      )}

      {/* Onboarding Overlay for Connect */}
      {isOnboardingActive && currentStep === 5 && (
        <OnboardingOverlay
          visible={true}
          title="Connect"
          description="Join communities and find like-minded people. Connect with others who understand your experiences and build meaningful relationships."
          onNext={() => {
            nextStep();
            // Navigate to Chats tab after a short delay to ensure state is updated
            setTimeout(() => {
              router.push('/(tabs)/chat');
            }, 100);
          }}
          showSkip={false}
        />
      )}
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
    color: COLORS.text,
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
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  tabActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  tabText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterChipsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  filterChipCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  filterChipClose: {
    marginLeft: SPACING.xs,
  },
  filterChipText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  countryFilterContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    maxHeight: 400,
  },
  countryFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  countryFilterTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  countryFilterClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countrySearchContainer: {
    marginBottom: SPACING.md,
  },
  countrySearchInput: {
    marginBottom: 0,
  },
  countryResultsContainer: {
    maxHeight: 250,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  countryResultsList: {
    maxHeight: 300,
  },
  countryResultsListContent: {
    paddingVertical: SPACING.xs,
  },
  countryResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  countryResultItemActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  countryResultText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  countryResultTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  countryResultsEmpty: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  countryResultsEmptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  countryFilterChipSearchActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  countryFilterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  countryFilterChip: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  countryFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  countryFilterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  countryFilterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  countryFilterChipSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: COLORS.primary,
  },
  inlineFilterContainer: {
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    maxHeight: 400,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inlineFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  inlineFilterTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  inlineFilterClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineFilterScroll: {
    maxHeight: 350,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  filterDivider: {
    borderBottomWidth: 1,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  filterSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterSectionTitle: {
    ...TYPOGRAPHY.h3,
  },
  filterSearchContainer: {
    marginBottom: SPACING.md,
  },
  filterSearchInput: {
    marginBottom: 0,
  },
  filterResultsContainer: {
    maxHeight: 200,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  filterResultItemActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  filterResultText: {
    ...TYPOGRAPHY.body,
  },
  filterResultsEmpty: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  filterResultsEmptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  starField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 0,
    pointerEvents: 'none',
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
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
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
  modalSearchInput: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalList: {
    flex: 1,
  },
  modalCountryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalCountryItemActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  modalCountryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  modalCountryTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterTab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  filterTabActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  filterTabText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
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
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  groupAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarImage: {
    width: '100%',
    height: '100%',
  },
  groupInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  groupName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  groupMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  groupDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
  },
  groupFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  memberAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  memberAvatarWrapper: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.glass.background,
    backgroundColor: COLORS.glass.background,
  },
  memberAvatarMore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarMoreContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  memberAvatarMoreText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  groupFooterSpacer: {
    flex: 1,
  },
  buddyCard: {
    marginBottom: SPACING.md,
  },
  buddyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buddyInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 0,
  },
  buddyInfoText: {
    flex: 1,
    minWidth: 0,
    marginRight: SPACING.sm,
  },
  buddyName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '500',
  },
  buddyBio: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  buddyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 0,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    minWidth: 80,
    flexShrink: 0,
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
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  createGroupButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  createGroupButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  starField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 0,
    pointerEvents: 'none',
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
