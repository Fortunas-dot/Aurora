import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, GlassInput, Avatar, TagChip, LoadingSpinner } from '../../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { groupService, Group } from '../../src/services/group.service';
import { userService, UserProfile } from '../../src/services/user.service';
import { useAuthStore } from '../../src/store/authStore';
import { COUNTRIES, getCountryName } from '../../src/constants/countries';

type TabType = 'groups' | 'buddies';

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, user: currentUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'joined'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // null = all, country code = specific country
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [showCountrySearch, setShowCountrySearch] = useState(false);
  
  // Buddies state
  const [buddies, setBuddies] = useState<UserProfile[]>([]);
  const [buddySearchQuery, setBuddySearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
      loadGroups(1, false, groupSearchQuery, selectedCountry);
    } else if (activeTab === 'buddies') {
      loadBuddies();
    }
  }, [activeTab, selectedCountry, loadGroups, loadBuddies, groupSearchQuery]);

  // Search effect for groups
  useEffect(() => {
    if (activeTab === 'groups') {
      const timeoutId = setTimeout(() => {
        loadGroups(1, false, groupSearchQuery, selectedCountry);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [groupSearchQuery, selectedCountry, activeTab, loadGroups]);

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
      await loadGroups(1, false, groupSearchQuery, selectedCountry);
    } else {
      await loadBuddies();
    }
    
    setIsRefreshing(false);
  }, [activeTab, loadGroups, loadBuddies, groupSearchQuery, selectedCountry]);

  const handleJoinGroup = async (groupId: string) => {
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
  };

  const handleFollowUser = async (userId: string) => {
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
  };

  const handleMessageUser = (userId: string) => {
    router.push(`/conversation/${userId}`);
  };

  const loadMore = useCallback(() => {
    if (activeTab === 'groups' && !isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadGroups(nextPage, true, groupSearchQuery, selectedCountry);
    }
  }, [activeTab, isLoading, hasMore, page, groupSearchQuery, selectedCountry, loadGroups]);

  const filteredGroups = groups.filter((group) => {
    const matchesFilter = selectedFilter === 'all' || group.isMember;
    return matchesFilter;
  });

  const displayBuddies = buddySearchQuery.trim() ? searchResults : buddies;

  // Render Group Card
  const renderGroup = useCallback(({ item }: { item: Group }) => (
    <GlassCard style={styles.groupCard} padding={0} onPress={() => router.push(`/group/${item._id}`)}>
      <View style={styles.groupHeader}>
        <View style={styles.groupAvatar}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.groupAvatarImage} />
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
          <TagChip key={index} label={tag} size="sm" />
        ))}
      </View>

      <View style={styles.groupFooter}>
        <GlassButton
          title={item.isMember ? 'Joined' : 'Join'}
          onPress={() => handleJoinGroup(item._id)}
          variant={item.isMember ? 'default' : 'primary'}
          size="sm"
          icon={
            <Ionicons
              name={item.isMember ? 'checkmark' : 'add'}
              size={16}
              color={item.isMember ? colors.text : colors.primary}
              style={{ marginRight: SPACING.xs }}
            />
          }
        />
      </View>
    </GlassCard>
  ), [router, handleJoinGroup, colors]);

  // Render Buddy Card
  const renderBuddy = useCallback(({ item }: { item: UserProfile }) => {
    const isFollowing = item.isFollowing ?? false;
    const isInBuddiesList = buddies.some(b => b._id === item._id);
    
    return (
      <GlassCard style={styles.buddyCard} padding="md">
        <View style={styles.buddyHeader}>
          <Pressable onPress={() => router.push(`/user/${item._id}`)}>
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
              onPress={() => router.push(`/user/${item._id}`)}
              style={styles.buddyInfoText}
            >
              <Text style={[styles.buddyName, { color: colors.text }]} numberOfLines={1}>{item.displayName || item.username}</Text>
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
                  onPress={() => handleMessageUser(item._id)}
                >
                  <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                </Pressable>
              )}
              {!isInBuddiesList && (
                <>
                  {isFollowing && (
                    <Pressable
                      style={styles.messageButton}
                      onPress={() => handleMessageUser(item._id)}
                    >
                      <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                    </Pressable>
                  )}
                  <GlassButton
                    title={isFollowing ? 'Following' : 'Follow'}
                    onPress={() => handleFollowUser(item._id)}
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
  }, [router, buddies, handleFollowUser, handleMessageUser, colors]);

  return (
    <LinearGradient
      colors={colors.backgroundGradient as readonly [string, string, string]}
      style={styles.container}
    >
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

      {/* Tabs */}
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

      {/* Search */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={activeTab === 'groups' ? groupSearchQuery : buddySearchQuery}
          onChangeText={activeTab === 'groups' ? setGroupSearchQuery : setBuddySearchQuery}
          placeholder={activeTab === 'groups' ? 'Search groups...' : 'Search users...'}
          style={styles.searchInput}
        />
      </View>

      {/* Groups Tab Content */}
      {activeTab === 'groups' && (
        <>
          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <Pressable
              style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
                All Groups
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, selectedFilter === 'joined' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('joined')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'joined' && styles.filterTabTextActive]}>
                My Groups
              </Text>
            </Pressable>
          </View>

          {/* Country Filter */}
          <View style={styles.countryFilterContainer}>
            <View style={styles.countryFilterHeader}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.countryFilterScroll}
                removeClippedSubviews={true}
                scrollEventThrottle={16}
                decelerationRate="fast"
              >
                <Pressable
                  style={[styles.countryFilterChip, selectedCountry === null && styles.countryFilterChipActive]}
                  onPress={() => {
                    setSelectedCountry(null);
                    setCountrySearchQuery('');
                    setShowCountrySearch(false);
                  }}
                >
                  <Text style={[styles.countryFilterText, selectedCountry === null && styles.countryFilterTextActive]}>
                    All Countries
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.countryFilterChip, styles.countryFilterChipSearch, showCountrySearch && styles.countryFilterChipSearchActive]}
                  onPress={() => {
                    setShowCountrySearch(!showCountrySearch);
                    if (!showCountrySearch) {
                      setCountrySearchQuery('');
                    }
                  }}
                >
                  <Ionicons name="search" size={16} color={showCountrySearch ? colors.white : colors.primary} />
                  <Text style={[styles.countryFilterText, { color: showCountrySearch ? colors.white : colors.primary, marginLeft: SPACING.xs, fontWeight: '600' }]}>
                    Search Country
                  </Text>
                </Pressable>
                {!showCountrySearch && COUNTRIES.filter(c => c.code !== 'global').slice(0, 5).map((country) => (
                  <Pressable
                    key={country.code}
                    style={[styles.countryFilterChip, selectedCountry === country.code && styles.countryFilterChipActive]}
                    onPress={() => setSelectedCountry(country.code)}
                  >
                    <Text style={[styles.countryFilterText, selectedCountry === country.code && styles.countryFilterTextActive]}>
                      {country.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Country Search Input and Results */}
            {showCountrySearch && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={insets.top + 100}
              >
                <View style={styles.countrySearchContainer}>
                  <GlassInput
                    value={countrySearchQuery}
                    onChangeText={setCountrySearchQuery}
                    placeholder="Search for a country..."
                    icon="search"
                    style={styles.countrySearchInput}
                    autoFocus={true}
                  />
                  
                  {countrySearchQuery.trim() && (
                    <View style={[styles.countryResultsContainer, { backgroundColor: colors.glass.backgroundDark, borderColor: colors.glass.border }]}>
                      <FlatList
                        data={COUNTRIES.filter((country) => {
                          if (country.code === 'global') return false;
                          const query = countrySearchQuery.toLowerCase();
                          return (
                            country.name.toLowerCase().includes(query) ||
                            country.code.toLowerCase().includes(query)
                          );
                        })}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                          <Pressable
                            style={[
                              styles.countryResultItem,
                              { borderBottomColor: colors.glass.border },
                              selectedCountry === item.code && [styles.countryResultItemActive, { backgroundColor: 'rgba(96, 165, 250, 0.1)' }],
                            ]}
                            onPress={() => {
                              setSelectedCountry(item.code);
                              setCountrySearchQuery('');
                              setShowCountrySearch(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.countryResultText,
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
                        )}
                        style={styles.countryResultsList}
                        contentContainerStyle={styles.countryResultsListContent}
                        keyboardShouldPersistTaps="handled"
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={20}
                        windowSize={10}
                        initialNumToRender={20}
                        updateCellsBatchingPeriod={50}
                        scrollEventThrottle={16}
                        ListEmptyComponent={
                          <View style={styles.countryResultsEmpty}>
                            <Text style={[styles.countryResultsEmptyText, { color: colors.textMuted }]}>No countries found</Text>
                          </View>
                        }
                      />
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            )}
          </View>

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
    paddingVertical: SPACING.sm,
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
  },
  searchInput: {
    marginBottom: 0,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  countryFilterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  countryFilterHeader: {
    paddingVertical: SPACING.sm,
  },
  countrySearchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  countrySearchInput: {
    marginBottom: SPACING.sm,
  },
  countryResultsContainer: {
    maxHeight: 300,
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    padding: SPACING.md,
    alignItems: 'flex-start',
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
});
