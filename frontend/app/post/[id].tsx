import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, GlassButton, LoadingSpinner } from '../../src/components/common';
import { PostCard } from '../../src/components/post/PostCard';
import { CommentCard } from '../../src/components/post/CommentCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { postService, Post } from '../../src/services/post.service';
import { commentService, Comment } from '../../src/services/comment.service';
import { useAuthStore } from '../../src/store/authStore';

export default function PostDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  const loadPost = useCallback(async () => {
    if (!id) return;

    try {
      const response = await postService.getPost(id);
      if (response.success && response.data) {
        setPost(response.data);
      } else {
        console.error('Error loading post:', response.message);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
  }, [id]);

  const loadComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!id) return;

    try {
      const response = await commentService.getCommentsForPost(id, pageNum, 20);
      
      if (response.success && response.data) {
        if (append) {
          setComments((prev) => [...prev, ...response.data!]);
        } else {
          setComments(response.data);
        }
        
        if (response.pagination) {
          setHasMoreComments(pageNum < response.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadPost(), loadComments(1, false)]);
    setIsLoading(false);
  }, [loadPost, loadComments]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMoreComments(true);
    await Promise.all([loadPost(), loadComments(1, false)]);
    setIsRefreshing(false);
  }, [loadPost, loadComments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLikePost = async () => {
    if (!isAuthenticated || !post) {
      router.push('/(auth)/login');
      return;
    }

    try {
      const response = await postService.likePost(post._id);
      if (response.success) {
        const isLiked = post.likes.includes(user!._id);
        setPost({
          ...post,
          likes: isLiked
            ? post.likes.filter((id) => id !== user!._id)
            : [...post.likes, user!._id],
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      const response = await commentService.likeComment(commentId);
      if (response.success) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id === commentId) {
              const isLiked = comment.likes.includes(user!._id);
              return {
                ...comment,
                likes: isLiked
                  ? comment.likes.filter((id) => id !== user!._id)
                  : [...comment.likes, user!._id],
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    if (!commentText.trim() || !post) return;

    setIsSubmittingComment(true);
    try {
      const response = await commentService.createComment(post._id, commentText.trim());
      
      if (response.success && response.data) {
        setComments((prev) => [response.data!, ...prev]);
        setPost({
          ...post,
          commentsCount: post.commentsCount + 1,
        });
        setCommentText('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const loadMoreComments = useCallback(() => {
    if (!isLoading && hasMoreComments) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadComments(nextPage, true);
    }
  }, [isLoading, hasMoreComments, page, loadComments]);

  if (isLoading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  if (!post) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Post not found</Text>
          <GlassButton
            title="Back"
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <GlassButton
            title="Back"
            onPress={() => router.back()}
            variant="text"
            size="small"
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          data={comments}
          renderItem={({ item }) => (
            <CommentCard
              comment={item}
              onLike={() => handleLikeComment(item._id)}
              currentUserId={user?._id}
            />
          )}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <>
              <PostCard
                post={post}
                onLike={handleLikePost}
                onComment={() => {}}
                currentUserId={user?._id}
                showFullContent={true}
              />
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>
                  {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                </Text>
              </View>
            </>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMoreComments ? (
              <View style={styles.loadingFooter}>
                <LoadingSpinner size="md" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>
                Be the first to comment!
              </Text>
            </View>
          }
        />

        {/* Comment Input */}
        {isAuthenticated && (
          <View style={styles.commentInputContainer}>
            <GlassInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              multiline
              style={styles.commentInput}
              inputStyle={styles.commentInputText}
            />
            <GlassButton
              title="Post"
              onPress={handleSubmitComment}
              variant="primary"
              size="small"
              isLoading={isSubmittingComment}
              disabled={!commentText.trim() || isSubmittingComment}
              style={styles.submitCommentButton}
            />
          </View>
        )}

        {!isAuthenticated && (
          <View style={styles.authPrompt}>
            <GlassButton
              title="Log in to comment"
              onPress={() => router.push('/(auth)/login')}
              variant="outline"
              style={styles.authButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  backButton: {
    minWidth: 80,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 80,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  commentsHeader: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  commentsTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  loadingFooter: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyComments: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyCommentsText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyCommentsSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    backgroundColor: COLORS.background,
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    maxHeight: 60,
    minHeight: 44,
  },
  commentInputText: {
    maxHeight: 60,
    minHeight: 44,
    textAlignVertical: 'top',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: 14,
  },
  submitCommentButton: {
    minWidth: 80,
    height: 44,
    alignSelf: 'flex-end',
  },
  authPrompt: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    backgroundColor: COLORS.background,
  },
  authButton: {
    width: '100%',
  },
});

