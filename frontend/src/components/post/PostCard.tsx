import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { GlassCard, Avatar, TagChip, LazyImage } from '../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { Post } from '../../services/post.service';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onAuthorPress?: () => void;
  onGroupPress?: () => void;
  currentUserId?: string;
  isSaved?: boolean;
  showFullContent?: boolean; // If true, show full content instead of just title
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
  onSave,
      onAuthorPress,
      onGroupPress,
      currentUserId,
      isSaved,
      showFullContent = false,
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(
    currentUserId ? post.likes.includes(currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [saved, setSaved] = useState(isSaved ?? post.isSaved ?? false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.();
  };

  const handleGroupPress = () => {
    if (post.groupId) {
      router.push(`/group/${post.groupId}`);
    }
    onGroupPress?.();
  };

  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  // Get first sentence from content
  const getFirstSentence = (text: string): string => {
    if (!text) return '';
    // Find first sentence ending (. ! ?) or take first 100 characters
    const sentenceMatch = text.match(/^[^.!?]+[.!?]/);
    if (sentenceMatch) {
      return sentenceMatch[0].trim();
    }
    // If no sentence ending found, take first 100 characters
    return text.substring(0, 100).trim() + (text.length > 100 ? '...' : '');
  };

  return (
    <GlassCard style={styles.container} onPress={onPress} padding={0}>
      {/* Group Badge (Reddit-style) */}
      {post.group && (
        <Pressable style={styles.groupBadge} onPress={handleGroupPress}>
          <Ionicons name="people" size={14} color={COLORS.primary} />
          <Text style={styles.groupName}>r/{post.group.name}</Text>
        </Pressable>
      )}

      {/* Header */}
      <Pressable style={styles.header} onPress={onAuthorPress}>
        <Avatar
          uri={post.author.avatar}
          name={post.author.displayName || post.author.username}
          size="md"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>
            {post.author.displayName || post.author.username}
          </Text>
          <Text style={styles.username}>@{post.author.username}</Text>
        </View>
        <Text style={styles.timestamp}>{formattedDate}</Text>
      </Pressable>

      {/* Title or Full Content */}
      {showFullContent ? (
        <>
          {post.title && (
            <Text style={styles.titleFull}>{post.title}</Text>
          )}
          <Text style={styles.content}>{post.content}</Text>
        </>
      ) : (
        <>
          {post.title ? (
            <Pressable style={styles.titleContainer} onPress={onPress}>
              <View style={styles.titleContentContainer}>
                <Text style={styles.title}>{post.title}</Text>
                {post.content && (
                  <Text style={styles.contentPreview} numberOfLines={2}>
                    {getFirstSentence(post.content)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.titleArrow} />
            </Pressable>
          ) : (
            <Pressable style={styles.titleContainer} onPress={onPress}>
              <Text style={styles.contentPreview} numberOfLines={2}>
                {post.content}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.titleArrow} />
            </Pressable>
          )}
        </>
      )}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
        >
          {post.images.map((imageUrl, index) => (
            <LazyImage
              key={index}
              uri={imageUrl}
              style={styles.postImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <TagChip key={index} label={tag} size="sm" />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? COLORS.error : COLORS.textSecondary}
          />
          {likesCount > 0 && (
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {likesCount}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onComment}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          {post.commentsCount > 0 && (
            <Text style={styles.actionText}>{post.commentsCount}</Text>
          )}
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onShare}>
          <Ionicons
            name="share-outline"
            size={22}
            color={COLORS.textSecondary}
          />
        </Pressable>

        {onSave && (
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              const newSavedState = !saved;
              setSaved(newSavedState);
              onSave();
            }}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? COLORS.primary : COLORS.textSecondary}
            />
          </Pressable>
        )}

        <View style={styles.actionSpacer} />

        <Pressable style={styles.actionButton}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={COLORS.textSecondary}
          />
        </Pressable>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  groupName: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  authorName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  username: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  titleContentContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  titleFull: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  titleArrow: {
    marginLeft: SPACING.xs,
  },
  contentPreview: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  imagesContainer: {
    marginBottom: SPACING.sm,
  },
  imagesContent: {
    paddingHorizontal: SPACING.md,
  },
  postImage: {
    width: Dimensions.get('window').width - SPACING.md * 4,
    height: 300,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.md,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  actionTextActive: {
    color: COLORS.error,
  },
  actionSpacer: {
    flex: 1,
  },
});

