import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, GlassInput, Avatar, LoadingSpinner, TagChip } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { ideaService, Idea } from '../src/services/idea.service';
import { useAuthStore } from '../src/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'feature', label: 'Feature', icon: 'sparkles-outline' },
  { id: 'improvement', label: 'Improvement', icon: 'trending-up-outline' },
  { id: 'bug-fix', label: 'Bug Fix', icon: 'bug-outline' },
  { id: 'design', label: 'Design', icon: 'color-palette-outline' },
  { id: 'other', label: 'Other', icon: 'ellipse-outline' },
];

const STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'trending', label: 'Trending' },
];

const getCategoryLabel = (category: string) => {
  return CATEGORIES.find(c => c.id === category)?.label || category;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return COLORS.primary;
    case 'in-progress': return COLORS.warning;
    case 'completed': return COLORS.success;
    case 'rejected': return COLORS.error;
    default: return COLORS.textMuted;
  }
};

const getStatusLabel = (status: string) => {
  return STATUSES.find(s => s.id === status)?.label || status;
};

export default function IdeasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Create idea form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'feature' | 'improvement' | 'bug-fix' | 'design' | 'other'>('feature');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadIdeas = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) setIsLoading(false);
    else setIsLoading(true);

    try {
      const response = await ideaService.getIdeas({
        page: pageNum,
        limit: 20,
        sortBy,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });

      if (response.success && response.data) {
        if (append) {
          setIdeas((prev) => [...prev, ...response.data!]);
        } else {
          setIdeas(response.data);
        }

        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading ideas:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sortBy, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadIdeas(1, false);
  }, [loadIdeas]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    loadIdeas(1, false);
  }, [loadIdeas]);

  const handleCreateIdea = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please enter a title and description');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ideaService.createIdea({
        title: title.trim(),
        description: description.trim(),
        category,
      });

      if (response.success) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setCategory('feature');
        handleRefresh();
        Alert.alert('Success', 'Your idea has been submitted!');
      } else {
        Alert.alert('Error', response.message || 'Could not submit idea');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (ideaId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      const response = await ideaService.upvoteIdea(ideaId);
      if (response.success && response.data) {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea._id === ideaId
              ? {
                  ...idea,
                  hasUpvoted: response.data!.hasUpvoted,
                  hasDownvoted: response.data!.hasDownvoted,
                  voteScore: response.data!.voteScore,
                  upvotesCount: response.data!.upvotesCount,
                  downvotesCount: response.data!.downvotesCount,
                }
              : idea
          )
        );
      }
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const handleDownvote = async (ideaId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      const response = await ideaService.downvoteIdea(ideaId);
      if (response.success && response.data) {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea._id === ideaId
              ? {
                  ...idea,
                  hasUpvoted: response.data!.hasUpvoted,
                  hasDownvoted: response.data!.hasDownvoted,
                  voteScore: response.data!.voteScore,
                  upvotesCount: response.data!.upvotesCount,
                  downvotesCount: response.data!.downvotesCount,
                }
              : idea
          )
        );
      }
    } catch (error) {
      console.error('Error downvoting:', error);
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadIdeas(nextPage, true);
    }
  }, [isLoading, hasMore, page, loadIdeas]);

  const renderIdea = ({ item }: { item: Idea }) => {
    // Ensure author is an object, not a string
    const author = typeof item.author === 'object' && item.author !== null 
      ? item.author 
      : { _id: '', username: 'Unknown', displayName: 'Unknown' };
    
    return (
      <GlassCard style={styles.ideaCard} padding="md">
        <View style={styles.ideaHeader}>
          <View style={styles.ideaAuthor}>
            <Avatar
              uri={author.avatar}
              name={author.displayName || author.username}
              userId={author._id}
              avatarCharacter={(author as any).avatarCharacter}
              avatarBackgroundColor={(author as any).avatarBackgroundColor}
              size={32}
            />
            <View style={styles.ideaAuthorInfo}>
              <Text style={styles.ideaAuthorName}>
                {author.displayName || author.username}
              </Text>
              <Text style={styles.ideaDate}>
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: enUS })}
              </Text>
            </View>
          </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.ideaTitle}>{item.title}</Text>
      <Text style={styles.ideaDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.ideaFooter}>
        <View style={styles.ideaMeta}>
          <TagChip
            label={getCategoryLabel(item.category)}
            size="sm"
            style={styles.categoryTag}
          />
        </View>
        <View style={styles.voteContainer}>
          <Pressable
            style={[styles.voteButton, item.hasUpvoted && styles.voteButtonActive]}
            onPress={() => handleUpvote(item._id)}
            disabled={!isAuthenticated}
          >
            <Ionicons
              name="chevron-up"
              size={20}
              color={item.hasUpvoted ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.voteCount,
                item.hasUpvoted && styles.voteCountActive,
              ]}
            >
              {item.voteScore ?? (Array.isArray(item.upvotes) && Array.isArray(item.downvotes) 
                ? item.upvotes.length - item.downvotes.length 
                : 0)}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.voteButton, item.hasDownvoted && styles.voteButtonActiveDown]}
            onPress={() => handleDownvote(item._id)}
            disabled={!isAuthenticated}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={item.hasDownvoted ? COLORS.error : COLORS.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </GlassCard>
    );
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Ideas</Text>
        <Pressable
          style={styles.headerButton}
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/login');
            } else {
              setShowCreateModal(true);
            }
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === cat.id && styles.categoryButtonTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Pressable
            style={styles.sortButton}
            onPress={() => {
              const currentIndex = SORT_OPTIONS.findIndex((s) => s.id === sortBy);
              const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
              setSortBy(SORT_OPTIONS[nextIndex].id as any);
            }}
          >
            <Ionicons name="swap-vertical" size={16} color={COLORS.textMuted} />
            <Text style={styles.sortText}>
              {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBannerContainer}>
        <GlassCard style={styles.infoBanner} padding="md" gradient>
          <View style={styles.infoBannerContent}>
            <Ionicons name="eye" size={24} color={COLORS.primary} />
            <View style={styles.infoBannerText}>
              <Text style={styles.infoBannerTitle}>Your Voice Matters</Text>
              <Text style={styles.infoBannerDescription}>
                We watch this page 24/7 and listen to our users. You decide what we'll add next to Aurora.
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Ideas List */}
      <FlatList
        data={ideas.filter(item => item && item._id)}
        renderItem={renderIdea}
        keyExtractor={(item) => item._id || Math.random().toString()}
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
          isLoading && ideas.length > 0 ? (
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
              <Ionicons name="bulb-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No ideas yet</Text>
              {isAuthenticated && (
                <GlassButton
                  title="Submit an idea"
                  onPress={() => setShowCreateModal(true)}
                  variant="primary"
                  style={styles.emptyButton}
                />
              )}
            </View>
          )
        }
      />

      {/* Create Idea Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCreateModal(false)}
          />
          <GlassCard style={styles.modalContent} padding="lg">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit New Idea</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <GlassInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="E.g. Add dark mode"
                  style={styles.input}
                  maxLength={200}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <GlassInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your idea in detail..."
                  multiline
                  numberOfLines={6}
                  style={styles.input}
                  inputStyle={styles.descriptionInput}
                  maxLength={2000}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        category === cat.id && styles.categoryOptionActive,
                      ]}
                      onPress={() => setCategory(cat.id as any)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          category === cat.id && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <GlassButton
                title="Submit"
                onPress={handleCreateIdea}
                variant="primary"
                disabled={!title.trim() || !description.trim() || isSubmitting}
                style={styles.submitButton}
                icon={
                  isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Ionicons name="send" size={16} color={COLORS.white} />
                  )
                }
              />
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
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
  filtersContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  categoryScroll: {
    marginBottom: SPACING.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  categoryButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  categoryButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sortContainer: {
    alignItems: 'flex-end',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  sortText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  ideaCard: {
    marginBottom: SPACING.md,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  ideaAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ideaAuthorInfo: {
    marginLeft: SPACING.sm,
  },
  ideaAuthorName: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  ideaDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  ideaTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  ideaDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  ideaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    marginRight: SPACING.xs,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  voteButtonActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  voteButtonActiveDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  voteCount: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  voteCountActive: {
    color: COLORS.primary,
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
  emptyButton: {
    marginTop: SPACING.md,
  },
  infoBannerContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  infoBanner: {
    marginBottom: 0,
  },
  infoBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  infoBannerDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BORDER_RADIUS.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  input: {
    marginBottom: 0,
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  categoryOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  categoryOptionActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  categoryOptionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  categoryOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: SPACING.md,
  },
});

