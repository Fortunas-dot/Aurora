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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadJournals = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await journalService.getPublicJournals(pageNum, 20, searchQuery);
      if (response.success && response.data) {
        if (append) {
          setJournals((prev) => [...prev, ...response.data]);
        } else {
          setJournals(response.data);
        }

        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error loading journals:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, searchQuery]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadJournals(1, false);
  }, [searchQuery, loadJournals]);

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

            <View style={styles.journalStats}>
              <View style={styles.stat}>
                <Ionicons name="people-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.statText}>
                  {item.followersCount || 0} {language === 'nl' ? 'volgers' : 'followers'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="book-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.statText}>
                  {item.entriesCount || 0} {language === 'nl' ? 'entries' : 'entries'}
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
            {language === 'nl' ? 'Log in om dagboeken te bekijken' : 'Log in to view journals'}
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
          {language === 'nl' ? 'Openbare Dagboeken' : 'Public Journals'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={
            language === 'nl' ? 'Zoek dagboeken...' : 'Search journals...'
          }
          style={styles.searchInput}
          icon="search"
        />
      </View>

      {/* Journals List */}
      {isLoading && journals.length === 0 ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      ) : journals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <GlassCard style={styles.emptyCard} padding="xl">
            <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'nl' ? 'Geen dagboeken gevonden' : 'No journals found'}
            </Text>
            <Text style={styles.emptyText}>
              {language === 'nl'
                ? 'Er zijn nog geen openbare dagboeken beschikbaar'
                : 'No public journals available yet'}
            </Text>
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={journals}
          renderItem={renderJournalCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
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
            hasMore && isLoading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
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
  listContent: {
    paddingHorizontal: SPACING.lg,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
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
