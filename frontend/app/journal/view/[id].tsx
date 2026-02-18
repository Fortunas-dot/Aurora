import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, Avatar, LoadingSpinner } from '../../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/constants/theme';
import { journalService, Journal, JournalEntry } from '../../../src/services/journal.service';
import { useAuthStore } from '../../../src/store/authStore';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Mood emoji mapping
const getMoodEmoji = (mood: number): string => {
  if (mood <= 2) return '😢';
  if (mood <= 4) return '😔';
  if (mood <= 6) return '😐';
  if (mood <= 8) return '🙂';
  return '😊';
};

// Mood color mapping
const getMoodColor = (mood: number): string => {
  if (mood <= 2) return '#F87171';
  if (mood <= 4) return '#FB923C';
  if (mood <= 6) return '#FBBF24';
  if (mood <= 8) return '#A3E635';
  return '#34D399';
};

export default function JournalViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();

  const [journal, setJournal] = useState<Journal | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadJournal = useCallback(async () => {
    if (!id) return;

    try {
      const response = await journalService.getJournal(id);
      if (response.success && response.data) {
        setJournal(response.data);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error loading journal:', error);
      router.back();
    }
  }, [id, router]);

  const loadEntries = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!id) return;

    try {
      const response = await journalService.getEntries(pageNum, 20, { journalId: id });
      if (response.success && response.data) {
        if (append) {
          setEntries((prev) => [...prev, ...response.data]);
        } else {
          setEntries(response.data);
        }
        setHasMore(response.data.length === 20);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      loadJournal();
      loadEntries(1, false);
    }
  }, [id, loadJournal, loadEntries]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadJournal();
    loadEntries(1, false);
  }, [loadJournal, loadEntries]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore && !isRefreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadEntries(nextPage, true);
    }
  };

  const handleFollow = async () => {
    if (!journal) return;
    try {
      const response = await journalService.followJournal(journal._id);
      if (response.success && journal) {
        setJournal({
          ...journal,
          isFollowing: true,
          followersCount: (journal.followersCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error following journal:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!journal) return;
    try {
      const response = await journalService.unfollowJournal(journal._id);
      if (response.success && journal) {
        setJournal({
          ...journal,
          isFollowing: false,
          followersCount: Math.max(0, (journal.followersCount || 0) - 1),
        });
      }
    } catch (error) {
      console.error('Error unfollowing journal:', error);
    }
  };

  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`/journal/${entry._id}`);
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    return (
      <Pressable onPress={() => handleEntryPress(item)}>
        <GlassCard style={styles.entryCard} padding="md">
          <View style={styles.entryHeader}>
            <View style={styles.entryDateContainer}>
              <Text style={styles.entryDate}>
                {format(parseISO(item.createdAt), 'MMM d, yyyy', { locale: enUS })}
              </Text>
              <Text style={styles.entryTime}>
                {format(parseISO(item.createdAt), 'HH:mm', { locale: enUS })}
              </Text>
            </View>
            <View style={[styles.moodBadge, { backgroundColor: `${getMoodColor(item.mood)}20` }]}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood)}</Text>
              <Text style={[styles.moodText, { color: getMoodColor(item.mood) }]}>{item.mood}/10</Text>
            </View>
          </View>
          <Text style={styles.entryContent} numberOfLines={3}>
            {item.content}
          </Text>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </Pressable>
    );
  };

  if (isLoading && !journal) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  if (!journal) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Journal not found</Text>
        </View>
      </LinearGradient>
    );
  }

  const owner = typeof journal.owner === 'object' ? journal.owner : null;

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {journal.name}
        </Text>
        <View style={styles.headerRight}>
          {isAuthenticated && journal.isOwner && (
            <Pressable
              style={styles.headerButton}
              onPress={() => router.push(`/journal/settings?journalId=${journal._id}`)}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {/* Journal Info */}
            <View style={styles.journalInfoSection}>
              {journal.coverImage ? (
                <Image source={{ uri: journal.coverImage }} style={styles.coverImage} />
              ) : (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.coverImage}
                />
              )}

              <GlassCard style={styles.journalCard} padding="lg">
                <View style={styles.journalHeader}>
                  <View style={styles.journalInfo}>
                    <Text style={styles.journalName}>{journal.name}</Text>
                    {owner && (
                      <View style={styles.ownerInfo}>
                        <Avatar
                          uri={owner.avatar}
                          size={24}
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
                  {isAuthenticated && !journal.isOwner && (
                    <Pressable
                      style={styles.followButton}
                      onPress={journal.isFollowing ? handleUnfollow : handleFollow}
                    >
                      <Ionicons
                        name={journal.isFollowing ? 'heart' : 'heart-outline'}
                        size={24}
                        color={journal.isFollowing ? COLORS.error : COLORS.textMuted}
                      />
                    </Pressable>
                  )}
                </View>

                {journal.description && (
                  <Text style={styles.journalDescription}>{journal.description}</Text>
                )}

                <View style={styles.journalStats}>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.statText}>
                      {journal.followersCount || 0} followers
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="book-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.statText}>
                      {journal.entriesCount || 0} entries
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* Entries Header */}
            <View style={styles.entriesHeader}>
              <Text style={styles.entriesTitle}>Entries</Text>
            </View>
          </>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
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
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && entries.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <GlassCard style={styles.emptyCard} padding="xl">
                <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyText}>
                  {journal.isOwner
                    ? 'Start writing your first entry'
                    : 'This journal has no entries yet'}
                </Text>
              </GlassCard>
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
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  journalInfoSection: {
    marginBottom: SPACING.lg,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  journalCard: {
    marginBottom: 0,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  journalInfo: {
    flex: 1,
  },
  journalName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ownerName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  followButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  journalStats: {
    flexDirection: 'row',
    gap: SPACING.md,
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
  entriesHeader: {
    marginBottom: SPACING.md,
  },
  entriesTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  entryCard: {
    marginBottom: SPACING.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
  },
  entryTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  entryContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.glass.backgroundDark,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
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
