import React, { useState } from 'react';
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

interface Group {
  _id: string;
  name: string;
  description: string;
  tags: string[];
  memberCount: number;
  isPrivate: boolean;
  isMember: boolean;
  avatar?: string;
}

// Mock data
const MOCK_GROUPS: Group[] = [
  {
    _id: '1',
    name: 'Angst & Paniek Support',
    description: 'Een veilige plek voor iedereen die te maken heeft met angst of paniekaanvallen.',
    tags: ['angst', 'paniek', 'support'],
    memberCount: 234,
    isPrivate: false,
    isMember: true,
  },
  {
    _id: '2',
    name: 'Mindfulness Beginners',
    description: 'Leer samen de basis van mindfulness en meditatie.',
    tags: ['mindfulness', 'meditatie', 'beginners'],
    memberCount: 156,
    isPrivate: false,
    isMember: false,
  },
  {
    _id: '3',
    name: 'Depressie Herstelgroep',
    description: 'Steun elkaar op de weg naar herstel. Je bent niet alleen.',
    tags: ['depressie', 'herstel', 'community'],
    memberCount: 312,
    isPrivate: false,
    isMember: true,
  },
  {
    _id: '4',
    name: 'Slaapproblemen',
    description: 'Tips en steun voor iedereen met slaapproblemen.',
    tags: ['slaap', 'insomnia'],
    memberCount: 89,
    isPrivate: false,
    isMember: false,
  },
];

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'joined'>('all');

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || group.isMember;
    return matchesSearch && matchesFilter;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In production: fetch groups from API
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleJoinGroup = (groupId: string) => {
    setGroups(groups.map((g) =>
      g._id === groupId
        ? { ...g, isMember: !g.isMember, memberCount: g.isMember ? g.memberCount - 1 : g.memberCount + 1 }
        : g
    ));
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <GlassCard style={styles.groupCard} padding={0} onPress={() => {}}>
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
        <Pressable style={styles.headerButton}>
          <Ionicons name="add" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Zoek groepen..."
          icon="search"
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Geen groepen gevonden</Text>
          </View>
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
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});

