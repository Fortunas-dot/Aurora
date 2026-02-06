import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { groupService, Group } from '../../services/group.service';
import { LoadingSpinner } from '../common';

interface CommunityFilterProps {
  selectedCommunity: string | null;
  onCommunityChange: (communityId: string | null) => void;
  isAuthenticated: boolean;
  showAllPublicPosts?: boolean;
  onShowAllPublicPostsChange?: (show: boolean) => void;
}

export const CommunityFilter: React.FC<CommunityFilterProps> = ({
  selectedCommunity,
  onCommunityChange,
  isAuthenticated,
  showAllPublicPosts = false,
  onShowAllPublicPostsChange,
}) => {
  const [communities, setCommunities] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadCommunities();
    } else {
      setCommunities([]);
    }
  }, [isAuthenticated]);

  const loadCommunities = async () => {
    setIsLoading(true);
    try {
      const response = await groupService.getGroups(1, 100);
      if (response.success && response.data) {
        // Filter to show only groups where user is a member
        const userCommunities = response.data.filter((group) => group.isMember);
        setCommunities(userCommunities);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="sm" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Communities Option */}
        <Pressable
          style={[styles.chip, !selectedCommunity && !showAllPublicPosts && styles.selectedChip]}
          onPress={() => {
            if (onShowAllPublicPostsChange) {
              onShowAllPublicPostsChange(false);
            }
            onCommunityChange(null);
          }}
        >
          <Ionicons
            name="apps-outline"
            size={16}
            color={!selectedCommunity && !showAllPublicPosts ? COLORS.white : COLORS.textMuted}
            style={styles.chipIcon}
          />
          <Text style={[styles.chipText, !selectedCommunity && !showAllPublicPosts && styles.selectedChipText]}>
            All
          </Text>
        </Pressable>

        {/* All Public Posts Option */}
        <Pressable
          style={[styles.chip, showAllPublicPosts && styles.selectedChip]}
          onPress={() => {
            if (onShowAllPublicPostsChange) {
              onShowAllPublicPostsChange(true);
            }
            onCommunityChange(null);
          }}
        >
          <Ionicons
            name="globe-outline"
            size={16}
            color={showAllPublicPosts ? COLORS.white : COLORS.textMuted}
            style={styles.chipIcon}
          />
          <Text style={[styles.chipText, showAllPublicPosts && styles.selectedChipText]}>
            Public
          </Text>
        </Pressable>

        {/* Community Chips */}
        {communities.map((community) => {
          const isSelected = selectedCommunity === community._id;
          return (
            <Pressable
              key={community._id}
              style={[styles.chip, isSelected && styles.selectedChip]}
              onPress={() => {
                if (onShowAllPublicPostsChange) {
                  onShowAllPublicPostsChange(false);
                }
                onCommunityChange(community._id);
              }}
            >
              <Ionicons
                name="people"
                size={16}
                color={isSelected ? COLORS.white : COLORS.primary}
                style={styles.chipIcon}
              />
              <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                {community.name}
              </Text>
            </Pressable>
          );
        })}

        {/* Empty State */}
        {communities.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No communities yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  loadingContainer: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginRight: SPACING.xs,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipIcon: {
    marginRight: SPACING.xs,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  selectedChipText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});

export default CommunityFilter;


