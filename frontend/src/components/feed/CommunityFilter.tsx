import React, { useState, useEffect, useCallback, useRef } from 'react';
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

export const CommunityFilter: React.FC<CommunityFilterProps> = React.memo(({
  selectedCommunity,
  onCommunityChange,
  isAuthenticated,
  showAllPublicPosts = false,
  onShowAllPublicPostsChange,
}) => {
  const [communities, setCommunities] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [shouldShowEmptyState, setShouldShowEmptyState] = useState(false);
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(true);
  const loadAttemptedRef = useRef(false);
  // Track if we've ever had communities - once we have communities, never show empty state again
  const hasEverHadCommunitiesRef = useRef(false);

  const loadCommunities = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current || !mountedRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    loadAttemptedRef.current = true;
    
    try {
      const response = await groupService.getGroups(1, 100);
      if (!mountedRef.current) return;
      
      if (response.success && response.data) {
        // Filter to show only groups where user is a member
        const userCommunities = response.data.filter((group) => group.isMember);
        setCommunities(userCommunities);
        // Track if we've ever had communities
        if (userCommunities.length > 0) {
          hasEverHadCommunitiesRef.current = true;
          // Hide empty state if we now have communities
          if (mountedRef.current) {
            setShouldShowEmptyState(false);
          }
        } else if (mountedRef.current && !hasEverHadCommunitiesRef.current) {
          // Show empty state only if we've never had communities
          setShouldShowEmptyState(true);
        }
      } else {
        setCommunities([]);
        // Show empty state only if we've never had communities
        if (mountedRef.current && !hasEverHadCommunitiesRef.current) {
          setShouldShowEmptyState(true);
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error loading communities:', error);
      setCommunities([]);
      // Show empty state only if we've never had communities
      if (!hasEverHadCommunitiesRef.current) {
        setShouldShowEmptyState(true);
      }
    } finally {
      if (mountedRef.current) {
        isLoadingRef.current = false;
        setIsLoading(false);
        hasLoadedRef.current = true;
        setHasLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Only load if authenticated and not already loaded/attempted
    if (isAuthenticated && !loadAttemptedRef.current) {
      loadCommunities();
    } else if (!isAuthenticated) {
      // Reset only if we were authenticated before
      if (hasLoadedRef.current) {
        setCommunities([]);
        hasLoadedRef.current = false;
        setHasLoaded(false);
        loadAttemptedRef.current = false;
        hasEverHadCommunitiesRef.current = false;
        setShouldShowEmptyState(false);
      }
    }
    
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
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

        {/* Loading State for Communities */}
        {isLoading && (
          <View style={styles.loadingChip}>
            <LoadingSpinner size="sm" />
          </View>
        )}

        {/* Community Chips */}
        {!isLoading && communities.map((community) => {
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

        {/* Empty State - Only show when explicitly set and not loading */}
        {shouldShowEmptyState && !isLoading && (
          <View style={styles.emptyContainer} key="empty-state">
            <Text style={styles.emptyText}>No communities yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change (ignore function references as they're usually stable)
  return (
    prevProps.selectedCommunity === nextProps.selectedCommunity &&
    prevProps.isAuthenticated === nextProps.isAuthenticated &&
    prevProps.showAllPublicPosts === nextProps.showAllPublicPosts
  );
});

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
  loadingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.xs,
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


