import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, LoadingSpinner, Avatar } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, Journal } from '../../src/services/journal.service';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function BrowseJournalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { language } = useSettingsStore();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<'popular' | 'newest' | 'most-entries'>('popular');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mental health topics list (same as in create-journal.tsx)
  const mentalHealthTopics = [
    { id: 'depression', label: 'Depression', icon: 'sad-outline' },
    { id: 'anxiety', label: 'Anxiety', icon: 'heart-outline' },
    { id: 'bipolar', label: 'Bipolar Disorder', icon: 'pulse-outline' },
    { id: 'ptsd', label: 'PTSD', icon: 'shield-outline' },
    { id: 'ocd', label: 'OCD', icon: 'repeat-outline' },
    { id: 'adhd', label: 'ADHD', icon: 'flash-outline' },
    { id: 'eating-disorder', label: 'Eating Disorder', icon: 'nutrition-outline' },
    { id: 'addiction', label: 'Addiction', icon: 'warning-outline' },
    { id: 'grief', label: 'Grief & Loss', icon: 'heart-dislike-outline' },
    { id: 'stress', label: 'Stress Management', icon: 'fitness-outline' },
    { id: 'self-esteem', label: 'Self-Esteem', icon: 'star-outline' },
    { id: 'relationships', label: 'Relationships', icon: 'people-outline' },
    { id: 'work-life', label: 'Work-Life Balance', icon: 'briefcase-outline' },
    { id: 'sleep', label: 'Sleep Issues', icon: 'moon-outline' },
    { id: 'anger', label: 'Anger Management', icon: 'flame-outline' },
    { id: 'trauma', label: 'Trauma', icon: 'medical-outline' },
    { id: 'general', label: 'General Wellness', icon: 'leaf-outline' },
  ];

  const loadJournals = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setJournals([]);
      return;
    }

    try {
      console.log('🔍 Loading journals with topic filter:', selectedTopic, 'sort:', selectedSort);
      const response = await journalService.getPublicJournals(pageNum, 20, searchQuery, selectedTopic || undefined, selectedSort);
      if (response.success && response.data) {
        if (append) {
          setJournals((prev) => [...prev, ...response.data]);
        } else {
          setJournals(response.data);
        }

        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        } else {
          setHasMore(false);
        }
      } else {
        // If response is not successful, clear journals if not appending
        if (!append) {
          setJournals([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading journals:', error);
      // Clear journals on error if not appending
      if (!append) {
        setJournals([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, searchQuery, selectedTopic, selectedSort]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadJournals(1, false);
  }, [searchQuery, selectedTopic, selectedSort, loadJournals]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadJournals(1, false);
  }, [loadJournals]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadJournals(nextPage, true);
    }
  };

  const handleFollow = async (journal: Journal) => {
    try {
      const response = await journalService.followJournal(journal._id);
      if (response.success) {
        // Update local state
        setJournals((prev) =>
          prev.map((j) =>
            j._id === journal._id
              ? { ...j, isFollowing: true, followersCount: (j.followersCount || 0) + 1 }
              : j
          )
        );
      }
    } catch (error) {
      console.error('Error following journal:', error);
    }
  };

  const handleUnfollow = async (journal: Journal) => {
    try {
      const response = await journalService.unfollowJournal(journal._id);
      if (response.success) {
        // Update local state
        setJournals((prev) =>
          prev.map((j) =>
            j._id === journal._id
              ? { ...j, isFollowing: false, followersCount: Math.max(0, (j.followersCount || 0) - 1) }
              : j
          )
        );
      }
    } catch (error) {
      console.error('Error unfollowing journal:', error);
    }
  };

  const handleJournalPress = (journal: Journal) => {
    router.push(`/journal/view/${journal._id}`);
  };

  const renderJournalCard = ({ item }: { item: Journal }) => {
    const owner = typeof item.owner === 'object' ? item.owner : null;

    return (
      <Pressable onPress={() => handleJournalPress(item)}>
        <GlassCard style={styles.journalCard} padding="lg">
          {/* Cover Image or Gradient */}
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.coverImage}
            />
          )}

          {/* Content */}
          <View style={styles.journalContent}>
            <View style={styles.journalHeader}>
              <View style={styles.journalInfo}>
                <Text style={styles.journalName}>{item.name}</Text>
                {owner && (
                  <View style={styles.ownerInfo}>
                    <Avatar
                      uri={owner.avatar}
                      size={20}
                      name={owner.displayName || owner.username}
                      userId={owner._id}
                      avatarCharacter={owner.avatarCharacter}
                      avatarBackgroundColor={owner.avatarBackgroundColor}
                    />
                    <Text style={styles.ownerName}>
                      {owner.displayName || owner.username}
                    </Text>
                  </View>
                )}
              </View>
              {item.isFollowing !== undefined && (
                <Pressable
                  style={styles.followButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (item.isFollowing) {
                      handleUnfollow(item);
                    } else {
                      handleFollow(item);
                    }
                  }}
                >
                  <Ionicons
                    name={item.isFollowing ? 'heart' : 'heart-outline'}
                    size={20}
                    color={item.isFollowing ? COLORS.error : COLORS.textMuted}
                  />
                </Pressable>
              )}
            </View>

            {item.description && (
              <Text style={styles.journalDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Topics */}
            {item.topics && item.topics.length > 0 && (
              <View style={styles.topicsContainer}>
                {item.topics.slice(0, 3).map((topic, index) => {
                  const topicInfo = mentalHealthTopics.find(t => t.id === topic);
                  if (!topicInfo) return null;
                  return (
                    <View key={index} style={styles.topicChip}>
                      <Ionicons
                        name={topicInfo.icon as any}
                        size={12}
                        color={COLORS.primary}
                      />
                      <Text style={styles.topicChipText}>{topicInfo.label}</Text>
                    </View>
                  );
                })}
                {item.topics.length > 3 && (
                  <Text style={styles.moreTopicsText}>+{item.topics.length - 3} more</Text>
                )}
              </View>
            )}

            <View style={styles.journalStats}>
              <View style={styles.stat}>
                <Ionicons name="people-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.statText}>
                  {item.followersCount || 0} followers
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="book-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.statText}>
                  {item.entriesCount || 0} entries
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Log in to view journals
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          Public Journals
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={
            'Search journals...'
          }
          style={styles.searchInput}
          icon="search"
        />
      </View>

      {/* Topic Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          <Pressable
            style={[
              styles.topicFilterChip,
              !selectedTopic && styles.topicFilterChipActive,
            ]}
            onPress={() => setSelectedTopic(null)}
          >
            <Text
              style={[
                styles.topicFilterText,
                !selectedTopic && styles.topicFilterTextActive,
              ]}
            >
              All Topics
            </Text>
          </Pressable>
          {mentalHealthTopics.map((topic) => {
            const isSelected = selectedTopic === topic.id;
            return (
              <Pressable
                key={topic.id}
                style={[
                  styles.topicFilterChip,
                  isSelected && styles.topicFilterChipActive,
                ]}
                onPress={() => setSelectedTopic(isSelected ? null : topic.id)}
              >
                <Ionicons
                  name={topic.icon as any}
                  size={16}
                  color={isSelected ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.topicFilterText,
                    isSelected && styles.topicFilterTextActive,
                  ]}
                >
                  {topic.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Filters */}
      <View style={styles.sortFiltersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortFiltersScrollContent}
        >
          <Pressable
            style={[
              styles.sortFilterChip,
              selectedSort === 'popular' && styles.sortFilterChipActive,
            ]}
            onPress={() => setSelectedSort('popular')}
          >
            <Ionicons
              name="trending-up"
              size={16}
              color={selectedSort === 'popular' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.sortFilterText,
                selectedSort === 'popular' && styles.sortFilterTextActive,
              ]}
            >
              Most Popular
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.sortFilterChip,
              selectedSort === 'newest' && styles.sortFilterChipActive,
            ]}
            onPress={() => setSelectedSort('newest')}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={selectedSort === 'newest' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.sortFilterText,
                selectedSort === 'newest' && styles.sortFilterTextActive,
              ]}
            >
              Newest
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.sortFilterChip,
              selectedSort === 'most-entries' && styles.sortFilterChipActive,
            ]}
            onPress={() => setSelectedSort('most-entries')}
          >
            <Ionicons
              name="book-outline"
              size={16}
              color={selectedSort === 'most-entries' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.sortFilterText,
                selectedSort === 'most-entries' && styles.sortFilterTextActive,
              ]}
            >
              Most Entries
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Journals List */}
      <FlatList
        data={journals}
        renderItem={renderJournalCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContent,
          journals.length === 0 && !isLoading ? styles.emptyListContent : undefined,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        removeClippedSubviews={false}
        maxToRenderPerBatch={15}
        windowSize={21}
        initialNumToRender={15}
        updateCellsBatchingPeriod={100}
        scrollEventThrottle={16}
        decelerationRate="normal"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="lg" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <GlassCard style={styles.emptyCard} padding="xl">
                <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>
                  No journals found
                </Text>
                <Text style={styles.emptyText}>
                  No public journals available yet
                </Text>
              </GlassCard>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && isLoading && journals.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
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
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 44,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersContainer: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  filtersScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  topicFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginRight: SPACING.sm,
  },
  topicFilterChipActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  topicFilterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  topicFilterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sortFiltersContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  sortFiltersScrollContent: {
    paddingRight: SPACING.lg,
  },
  sortFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginRight: SPACING.sm,
  },
  sortFilterChipActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  sortFilterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  sortFilterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  journalCard: {
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  journalContent: {
    gap: SPACING.sm,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  journalInfo: {
    flex: 1,
  },
  journalName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ownerName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  followButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  topicChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontSize: 11,
  },
  moreTopicsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  journalStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    width: '100%',
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
});
