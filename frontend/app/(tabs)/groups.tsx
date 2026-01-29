import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, GlassInput, Avatar, TagChip, LoadingSpinner } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { groupService, Group } from '../../src/services/group.service';
import { useAuthStore } from '../../src/store/authStore';

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'joined'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadGroups = useCallback(async (pageNum: number = 1, append: boolean = false, search?: string) => {
    setIsLoading(true);
    try {
      const response = await groupService.getGroups(pageNum, 20, search || undefined);
      
      console.log('Groups API Response:', response);
      
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
        console.error('Groups API Error:', response.message);
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

  useEffect(() => {
    loadGroups(1, false);
  }, []);

  // Search effect - debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadGroups(1, false, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadGroups(1, false, searchQuery);
    setIsRefreshing(false);
  }, [loadGroups, searchQuery]);

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

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadGroups(nextPage, true);
    }
  }, [isLoading, hasMore, page, loadGroups]);

  const filteredGroups = groups.filter((group) => {
    const matchesFilter = selectedFilter === 'all' || group.isMember;
    return matchesFilter;
  });

  const renderGroup = ({ item }: { item: Group }) => (
    <GlassCard style={styles.groupCard} padding={0} onPress={() => router.push(`/group/${item._id}`)}>
      <View style={styles.groupHeader}>
        <View style={styles.groupAvatar}>
          <LinearGradient
            colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
            style={styles.groupAvatarGradient}
          >
            <Ionicons name="people" size={24} color={COLORS.primary} />
          </LinearGradient>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.groupMeta}>
            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.groupMetaText}>{item.memberCount} leden</Text>
            {item.isPrivate && (
              <>
                <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} style={{ marginLeft: SPACING.sm }} />
                <Text style={styles.groupMetaText}>Privé</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.groupDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.groupTags}>
        {item.tags.slice(0, 3).map((tag, index) => (
          <TagChip key={index} label={tag} size="sm" />
        ))}
      </View>

      <View style={styles.groupFooter}>
        <GlassButton
          title={item.isMember ? 'Lid' : 'Word lid'}
          onPress={() => handleJoinGroup(item._id)}
          variant={item.isMember ? 'default' : 'primary'}
          size="sm"
          icon={
            <Ionicons
              name={item.isMember ? 'checkmark' : 'add'}
              size={16}
              color={item.isMember ? COLORS.text : COLORS.primary}
              style={{ marginRight: SPACING.xs }}
            />
          }
        />
      </View>
    </GlassCard>
  );

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.headerTitle}>Groepen</Text>
        <Pressable
          style={styles.headerButton}
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/login');
            } else {
              router.push('/create-group');
            }
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Zoek groepen..."
          style={styles.searchInput}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
            Alle groepen
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'joined' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('joined')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'joined' && styles.filterTabTextActive]}>
            Mijn groepen
          </Text>
        </Pressable>
      </View>

      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroup}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
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
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Geen groepen gevonden</Text>
              {isAuthenticated && (
                <Pressable
                  style={styles.createGroupButton}
                  onPress={() => router.push('/create-group')}
                >
                  <Text style={styles.createGroupButtonText}>Maak een groep</Text>
                </Pressable>
              )}
            </View>
          )
        }
      />
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
  searchContainer: {
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
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

