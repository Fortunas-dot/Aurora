import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { GlassCard, Avatar } from '../common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Comment } from '../../services/comment.service';

interface CommentCardProps {
  comment: Comment;
  onLike?: () => void;
  currentUserId?: string;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onLike,
  currentUserId,
}) => {
  const [isLiked, setIsLiked] = useState(
    currentUserId ? comment.likes.includes(currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(comment.likes.length);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.();
  };

  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: nl,
  });

  return (
    <GlassCard style={styles.container} padding="md">
      <View style={styles.header}>
        <Avatar
          uri={comment.author.avatar}
          name={comment.author.displayName || comment.author.username}
          size="sm"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>
            {comment.author.displayName || comment.author.username}
          </Text>
          <Text style={styles.timestamp}>{formattedDate}</Text>
        </View>
      </View>

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
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
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
});





