import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { GlassCard, Avatar, TagChip, LazyImage } from '../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { Post } from '../../services/post.service';
import { postService } from '../../services/post.service';
import { useTheme } from '../../hooks/useTheme';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onAuthorPress?: () => void;
  onGroupPress?: () => void;
  onDelete?: () => void; // Callback when post is deleted
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
  onDelete,
  currentUserId,
  isSaved,
  showFullContent = false,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLiked, setIsLiked] = useState(
    currentUserId ? post.likes.includes(currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [saved, setSaved] = useState(isSaved ?? post.isSaved ?? false);
  const [showMenu, setShowMenu] = useState(false);
  
  const isOwnPost = currentUserId === post.author._id;

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

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowMenu(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await postService.deletePost(post._id);
              if (response.success) {
                setShowMenu(false);
                onDelete?.();
                Alert.alert('Success', 'Post deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete post');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleReportPost = () => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowMenu(false),
        },
        {
          text: 'Spam',
          onPress: async () => {
            try {
              await postService.reportPost(post._id, 'spam');
              setShowMenu(false);
              Alert.alert('Success', 'Post reported');
            } catch (error) {
              console.error('Error reporting post:', error);
              Alert.alert('Error', 'Failed to report post');
            }
          },
        },
        {
          text: 'Inappropriate',
          onPress: async () => {
            try {
              await postService.reportPost(post._id, 'inappropriate');
              setShowMenu(false);
              Alert.alert('Success', 'Post reported');
            } catch (error) {
              console.error('Error reporting post:', error);
              Alert.alert('Error', 'Failed to report post');
            }
          },
        },
        {
          text: 'Other',
          onPress: async () => {
            try {
              await postService.reportPost(post._id, 'other');
              setShowMenu(false);
              Alert.alert('Success', 'Post reported');
            } catch (error) {
              console.error('Error reporting post:', error);
              Alert.alert('Error', 'Failed to report post');
            }
          },
        },
      ]
    );
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
          userId={post.author._id}
          avatarCharacter={post.author.avatarCharacter}
          avatarBackgroundColor={post.author.avatarBackgroundColor}
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

        <Pressable style={styles.actionButton} onPress={() => setShowMenu(true)}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={COLORS.textSecondary}
          />
        </Pressable>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable 
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContent, { backgroundColor: colors.surface, borderColor: colors.glass.border }]}>
            {isOwnPost ? (
              <>
                <Pressable
                  style={styles.menuItem}
                  onPress={handleDeletePost}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Post</Text>
                </Pressable>
                <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push(`/edit-post/${post._id}`);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Post</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={styles.menuItem}
                onPress={handleReportPost}
              >
                <Ionicons name="flag-outline" size={20} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>Report Post</Text>
              </Pressable>
            )}
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <Pressable
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  menuContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItemText: {
    ...TYPOGRAPHY.bodyMedium,
    marginLeft: SPACING.md,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.glass.border,
    marginVertical: SPACING.xs,
  },
});

