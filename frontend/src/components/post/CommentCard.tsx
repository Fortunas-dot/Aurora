import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { GlassCard, Avatar, GlassInput, GlassButton } from '../common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Comment, commentService } from '../../services/comment.service';

interface CommentCardProps {
  comment: Comment;
  onLike?: () => void;
  onReplyAdded?: (reply: Comment) => void;
  currentUserId?: string;
  isAuthenticated?: boolean;
  postId: string;
  isReply?: boolean;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onLike,
  onReplyAdded,
  currentUserId,
  isAuthenticated = false,
  postId,
  isReply = false,
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(
    currentUserId ? comment.likes.includes(currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(comment.likes.length);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [showReplies, setShowReplies] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.();
  };

  const handleReply = async () => {
    if (!replyText.trim() || !isAuthenticated) return;

    setIsSubmittingReply(true);
    try {
      const response = await commentService.replyToComment(comment._id, replyText.trim(), postId);
      if (response.success && response.data) {
        setReplies((prev) => [response.data!, ...prev]);
        setReplyText('');
        setShowReplyInput(false);
        onReplyAdded?.(response.data);
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: nl,
  });

  const repliesCount = comment.repliesCount || replies.length;

  return (
    <View style={[styles.wrapper, isReply && styles.replyWrapper]}>
      <GlassCard style={styles.container} padding="md">
        <Pressable 
          style={styles.header}
          onPress={() => router.push(`/user/${comment.author._id}`)}
        >
          <Avatar
            uri={comment.author.avatar}
            name={comment.author.displayName || comment.author.username}
            userId={comment.author._id}
            avatarCharacter={comment.author.avatarCharacter}
            avatarBackgroundColor={comment.author.avatarBackgroundColor}
            size="sm"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.authorName}>
              {comment.author.displayName || comment.author.username}
            </Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </Pressable>

        <Text style={styles.content}>{comment.content}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? COLORS.error : COLORS.textSecondary}
            />
            {likesCount > 0 && (
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {likesCount}
              </Text>
            )}
          </Pressable>
          
          {!isReply && (
            <>
              <Pressable 
                style={styles.actionButton} 
                onPress={() => {
                  if (isAuthenticated) {
                    setShowReplyInput(!showReplyInput);
                  } else {
                    router.push('/(auth)/login');
                  }
                }}
              >
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
                {repliesCount > 0 && (
                  <Text style={styles.actionText}>{repliesCount}</Text>
                )}
              </Pressable>
              
              {repliesCount > 0 && (
                <Pressable 
                  style={styles.viewRepliesButton}
                  onPress={() => setShowReplies(!showReplies)}
                >
                  <Text style={styles.viewRepliesText}>
                    {showReplies ? 'Hide' : 'View'} {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Reply Input */}
        {showReplyInput && !isReply && (
          <View style={styles.replyInputContainer}>
            <GlassInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Reply to ${comment.author.displayName || comment.author.username}...`}
              multiline
              style={styles.replyInput}
            />
            <View style={styles.replyActions}>
              <Pressable onPress={() => setShowReplyInput(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </Pressable>
              <GlassButton
                title="Reply"
                onPress={handleReply}
                variant="primary"
                size="sm"
                disabled={!replyText.trim() || isSubmittingReply}
                isLoading={isSubmittingReply}
              />
            </View>
          </View>
        )}

        {/* Replies */}
        {showReplies && replies.length > 0 && !isReply && (
          <View style={styles.repliesContainer}>
            {replies.map((reply) => (
              <CommentCard
                key={reply._id}
                comment={reply}
                onLike={onLike}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                postId={postId}
                isReply={true}
              />
            ))}
          </View>
        )}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
  },
  replyWrapper: {
    marginLeft: SPACING.xl,
    marginTop: SPACING.xs,
  },
  container: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  authorName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  content: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  actionTextActive: {
    color: COLORS.error,
  },
  viewRepliesButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  viewRepliesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  replyInputContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  replyInput: {
    marginBottom: SPACING.sm,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cancelButton: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    padding: SPACING.sm,
  },
  repliesContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
});







