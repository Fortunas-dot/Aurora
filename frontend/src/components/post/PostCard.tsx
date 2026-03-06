import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Video, ResizeMode } from 'expo-av';
import { GlassCard, Avatar, TagChip, LazyImage } from '../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { Post } from '../../services/post.service';
import { postService } from '../../services/post.service';
import { useTheme } from '../../hooks/useTheme';
import { getUsernameColor } from '../../utils/usernameColors';

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

export const PostCard: React.FC<PostCardProps> = React.memo(({
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
  const [videoError, setVideoError] = useState<string | null>(null);
  
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

  // Media flags and normalized URLs (must be defined at top level, not inside render branches)
  const hasVideo = !!post.video && !videoError;
  const hasImages = !!post.images && post.images.length > 0;

  const videoUrl = useMemo(() => {
    if (!post.video) return '';
    if (post.video.startsWith('http://') || post.video.startsWith('https://')) {
      return post.video;
    }
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = post.video.startsWith('/') ? post.video : `/${post.video}`;
    const normalized = `${baseUrl}${relativeUrl}`;

    // #region agent log (development only)
    if (__DEV__) {
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: 'initial',
          hypothesisId: 'H1',
          location: 'PostCard.tsx:videoUrl',
          message: 'PostCard normalized video URL',
          data: { originalVideo: post.video, normalized },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion

    return normalized;
  }, [post.video]);

  const normalizedImages = useMemo(
    () =>
      post.images?.map((imageUrl) => {
        if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          const baseUrl = 'https://aurora-production.up.railway.app';
          const relativeUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
          const normalized = `${baseUrl}${relativeUrl}`;

          // #region agent log (development only)
          if (__DEV__) {
            fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                runId: 'initial',
              hypothesisId: 'H2',
              location: 'PostCard.tsx:normalizedImages',
              message: 'PostCard normalized image URL',
              data: { originalImage: imageUrl, normalized },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          }
          // #endregion

          return normalized;
        }
        return imageUrl;
      }) || [],
    [post.images]
  );

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

  // Video indicator overlay component
  const VideoIndicator = () => (
    <View style={styles.videoIndicator}>
      <View style={styles.videoIndicatorBadge}>
        <Ionicons name="videocam" size={16} color={COLORS.white} />
        <Text style={styles.videoIndicatorText}>Video</Text>
      </View>
    </View>
  );

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
          <Text style={[styles.authorName, { color: getUsernameColor(post.author._id, post.author) }]}>
            {post.author.displayName || post.author.username}
          </Text>
          <Text style={styles.username}>@{post.author.username}</Text>
        </View>
        <Text style={styles.timestamp}>{formattedDate}</Text>
      </Pressable>

      {/* Title or Full Content */}
      {showFullContent ? (
        <>
          {(post.title || post.content) && (
            <Text style={styles.titleFull}>
              {post.title && post.title.trim().length > 0
                ? post.title
                : getFirstSentence(post.content)}
            </Text>
          )}
          <Text style={styles.content}>{post.content}</Text>
        </>
      ) : (
        <>
            <Pressable style={styles.titleContainer} onPress={onPress}>
              <View style={styles.titleContentContainer}>
              <Text style={styles.title}>
                {post.title && post.title.trim().length > 0
                  ? post.title
                  : getFirstSentence(post.content)}
              </Text>
                {post.content && (
                  <Text style={styles.contentPreview} numberOfLines={2}>
                    {getFirstSentence(post.content)}
                  </Text>
                )}
              </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.textMuted}
              style={styles.titleArrow}
            />
            </Pressable>
        </>
      )}

      {/* Media Collage (Images + Video) */}
      {(() => {
        const totalMediaCount = (hasVideo ? 1 : 0) + (hasImages ? normalizedImages.length : 0);
        
        if (totalMediaCount === 0) return null;
        
        // Create media items array (video first if exists, then images)
        const mediaItems: Array<{ type: 'video' | 'image'; url: string; index: number }> = [];
        if (hasVideo && videoUrl) {
          mediaItems.push({ type: 'video', url: videoUrl, index: 0 });
        }
        normalizedImages.forEach((url, idx) => {
          mediaItems.push({ type: 'image', url, index: hasVideo ? idx + 1 : idx });
        });
        
        const screenWidth = Dimensions.get('window').width;
        const containerWidth = screenWidth - SPACING.md * 4;
        const gap = SPACING.xs;
        
        // Render based on media count
        if (totalMediaCount === 1) {
          // Single item - full width
          const item = mediaItems[0];
          return (
            <View style={styles.mediaCollageContainer}>
              {item.type === 'video' ? (
                <Pressable
                  style={styles.mediaItemSingle}
                  onPress={(e) => {
                    e.stopPropagation();
                  }}
                  onStartShouldSetResponder={() => true}
                >
                  <Video
                    source={{ uri: item.url }}
                    style={styles.mediaVideoSingle}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    useNativeControls={true}
                    onError={(error) => {
                      const errorMessage = error?.message || error?.localizedDescription || error?.error || 'Failed to load video';
                      const errorCode = error?.code || error?.nativeEvent?.code;
                      let userMessage = 'Video could not be loaded';
                      if (errorCode === -1100 || errorMessage?.includes('NSURLErrorFileDoesNotExist') || errorMessage?.includes('-1100')) {
                        userMessage = 'Video file not found on server';
                      } else if (errorCode === -1009 || errorMessage?.includes('network')) {
                        userMessage = 'Network error loading video';
                      }
                      setVideoError(userMessage);
                    }}
                    onLoadStart={() => {
                      setVideoError(null);
                    }}
                  />
                  <VideoIndicator />
                </Pressable>
              ) : (
                <LazyImage
                  uri={item.url}
                  style={styles.mediaImageSingle}
                  resizeMode="cover"
                />
              )}
            </View>
          );
        } else if (totalMediaCount === 2) {
          // Two items - side by side
          return (
            <View style={styles.mediaCollageContainer}>
              <View style={styles.mediaRow}>
                {mediaItems.slice(0, 2).map((item, idx) => (
                  <View key={idx} style={[styles.mediaItemTwo, styles.mediaItemTwoTall, { marginRight: idx === 0 ? gap : 0 }]}>
                    {item.type === 'video' ? (
                      <Pressable
                        style={styles.mediaItemFull}
                        onPress={(e) => {
                          e.stopPropagation();
                        }}
                        onStartShouldSetResponder={() => true}
                      >
                        <Video
                          source={{ uri: item.url }}
                          style={styles.mediaVideoTwo}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls={true}
                          onError={(error) => {
                            const errorMessage = error?.message || error?.localizedDescription || error?.error || 'Failed to load video';
                            setVideoError(errorMessage || 'Video could not be loaded');
                          }}
                          onLoadStart={() => {
                            setVideoError(null);
                          }}
                        />
                        <VideoIndicator />
                      </Pressable>
                    ) : (
                      <LazyImage
                        uri={item.url}
                        style={styles.mediaImageTwo}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        } else if (totalMediaCount === 3) {
          // Three items - one large left, two small right
          return (
            <View style={styles.mediaCollageContainer}>
              <View style={styles.mediaRow}>
                <View style={[styles.mediaItemLarge, { marginRight: gap }]}>
                  {mediaItems[0].type === 'video' ? (
                    <Pressable
                      style={styles.mediaItemFull}
                      onPress={(e) => {
                        e.stopPropagation();
                      }}
                      onStartShouldSetResponder={() => true}
                    >
                      <Video
                        source={{ uri: mediaItems[0].url }}
                        style={styles.mediaVideoLarge}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        useNativeControls={true}
                        onError={(error) => {
                          setVideoError('Video could not be loaded');
                        }}
                        onLoadStart={() => {
                          setVideoError(null);
                        }}
                      />
                      <VideoIndicator />
                    </Pressable>
                  ) : (
                    <LazyImage
                      uri={mediaItems[0].url}
                      style={styles.mediaImageLarge}
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View style={styles.mediaColumn}>
                  {mediaItems.slice(1, 3).map((item, idx) => (
                    <View key={idx} style={[styles.mediaItemSmall, { marginBottom: idx === 0 ? gap : 0 }]}>
                      {item.type === 'video' ? (
                        <Pressable
                          style={styles.mediaItemFull}
                          onPress={(e) => {
                            e.stopPropagation();
                          }}
                          onStartShouldSetResponder={() => true}
                        >
                          <Video
                            source={{ uri: item.url }}
                            style={styles.mediaVideoSmall}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                            useNativeControls={true}
                            onError={(error) => {
                              setVideoError('Video could not be loaded');
                            }}
                            onLoadStart={() => {
                              setVideoError(null);
                            }}
                          />
                          <VideoIndicator />
                        </Pressable>
                      ) : (
                        <LazyImage
                          uri={item.url}
                          style={styles.mediaImageSmall}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        } else if (totalMediaCount === 4) {
          // Four items - 2x2 grid
          return (
            <View style={styles.mediaCollageContainer}>
              <View style={styles.mediaRow}>
                {mediaItems.slice(0, 2).map((item, idx) => (
                  <View key={idx} style={[styles.mediaItemTwo, styles.mediaItemTwoGrid, { marginRight: idx === 0 ? gap : 0, marginBottom: gap }]}>
                    {item.type === 'video' ? (
                      <Pressable
                        style={styles.mediaItemFull}
                        onPress={(e) => {
                          e.stopPropagation();
                        }}
                        onStartShouldSetResponder={() => true}
                      >
                        <Video
                          source={{ uri: item.url }}
                          style={styles.mediaVideoGrid}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls={true}
                          onError={(error) => {
                            setVideoError('Video could not be loaded');
                          }}
                          onLoadStart={() => {
                            setVideoError(null);
                          }}
                        />
                        <VideoIndicator />
                      </Pressable>
                    ) : (
                      <LazyImage
                        uri={item.url}
                        style={styles.mediaImageGrid}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.mediaRow}>
                {mediaItems.slice(2, 4).map((item, idx) => (
                  <View key={idx} style={[styles.mediaItemTwo, styles.mediaItemTwoGrid, { marginRight: idx === 0 ? gap : 0 }]}>
                    {item.type === 'video' ? (
                      <Pressable
                        style={styles.mediaItemFull}
                        onPress={(e) => {
                          e.stopPropagation();
                        }}
                        onStartShouldSetResponder={() => true}
                      >
                        <Video
                          source={{ uri: item.url }}
                          style={styles.mediaVideoGrid}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls={true}
                          onError={(error) => {
                            setVideoError('Video could not be loaded');
                          }}
                          onLoadStart={() => {
                            setVideoError(null);
                          }}
                        />
                        <VideoIndicator />
                      </Pressable>
                    ) : (
                      <LazyImage
                        uri={item.url}
                        style={styles.mediaImageGrid}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        } else {
          // 5+ items - 2x2 grid with overlay showing remaining count
          const remainingCount = totalMediaCount - 4;
          return (
            <View style={styles.mediaCollageContainer}>
              <View style={styles.mediaRow}>
                {mediaItems.slice(0, 2).map((item, idx) => (
                  <View key={idx} style={[styles.mediaItemTwo, styles.mediaItemTwoGrid, { marginRight: idx === 0 ? gap : 0, marginBottom: gap }]}>
                    {item.type === 'video' ? (
                      <Pressable
                        style={styles.mediaItemFull}
                        onPress={(e) => {
                          e.stopPropagation();
                        }}
                        onStartShouldSetResponder={() => true}
                      >
                        <Video
                          source={{ uri: item.url }}
                          style={styles.mediaVideoGrid}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls={true}
                          onError={(error) => {
                            setVideoError('Video could not be loaded');
                          }}
                          onLoadStart={() => {
                            setVideoError(null);
                          }}
                        />
                        <VideoIndicator />
                      </Pressable>
                    ) : (
            <LazyImage
                        uri={item.url}
                        style={styles.mediaImageGrid}
              resizeMode="cover"
            />
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.mediaRow}>
                {mediaItems.slice(2, 4).map((item, idx) => (
                  <View key={idx} style={[styles.mediaItemTwo, styles.mediaItemTwoGrid, { marginRight: idx === 0 ? gap : 0 }]}>
                    {item.type === 'video' ? (
                      <Pressable
                        style={styles.mediaItemFull}
                        onPress={(e) => {
                          e.stopPropagation();
                        }}
                        onStartShouldSetResponder={() => true}
                      >
                        <Video
                          source={{ uri: item.url }}
                          style={styles.mediaVideoGrid}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls={true}
                          onError={(error) => {
                            setVideoError('Video could not be loaded');
                          }}
                          onLoadStart={() => {
                            setVideoError(null);
                          }}
                        />
                        <VideoIndicator />
                        {idx === 1 && (
                          <View style={styles.mediaOverlay}>
                            <Text style={styles.mediaOverlayText}>+{remainingCount}</Text>
                          </View>
                        )}
                      </Pressable>
                    ) : (
                      <>
                        <LazyImage
                          uri={item.url}
                          style={styles.mediaImageGrid}
                          resizeMode="cover"
                        />
                        {idx === 1 && (
                          <View style={styles.mediaOverlay}>
                            <Text style={styles.mediaOverlayText}>+{remainingCount}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        }
      })()}

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
});

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
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    // Use Manjari Bold for post titles
    fontFamily: 'Manjari-Bold',
    fontWeight: '400',
    marginBottom: SPACING.xs / 2,
  },
  titleFull: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    // Use Manjari Bold for full post titles
    fontFamily: 'Manjari-Bold',
    fontWeight: '400',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  titleArrow: {
    marginLeft: SPACING.xs,
  },
  contentPreview: {
    ...TYPOGRAPHY.body,
    // Use Manjari for post description preview
    fontFamily: 'Manjari-Regular',
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    ...TYPOGRAPHY.body,
    // Use Manjari for full post content
    fontFamily: 'Manjari-Regular',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  // Media Collage Styles
  mediaCollageContainer: {
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  mediaRow: {
    flexDirection: 'row',
  },
  mediaColumn: {
    flexDirection: 'column',
    width: (Dimensions.get('window').width - SPACING.md * 4 - SPACING.xs) / 2,
    height: 200,
  },
  // Single item
  mediaItemSingle: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaImageSingle: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.md,
  },
  mediaVideoSingle: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.md,
  },
  // Two items (side by side) - also used for 4-item grid
  mediaItemTwo: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaItemTwoTall: {
    height: 200,
  },
  mediaImageTwo: {
    width: '100%',
    height: 200,
  },
  mediaVideoTwo: {
    width: '100%',
    height: 200,
  },
  // Large item (for 3-item layout)
  mediaItemLarge: {
    flex: 1,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaImageLarge: {
    width: '100%',
    height: 200,
  },
  mediaVideoLarge: {
    width: '100%',
    height: 200,
  },
  // Small items (for 3-item layout)
  mediaItemSmall: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaImageSmall: {
    width: '100%',
    height: 95,
  },
  mediaVideoSmall: {
    width: '100%',
    height: 95,
  },
  // Grid items (for 2x2 and 4+ layouts)
  mediaImageGrid: {
    width: '100%',
    height: 150,
  },
  mediaVideoGrid: {
    width: '100%',
    height: 150,
  },
  // For 4-item grid, ensure consistent height
  mediaItemTwoGrid: {
    height: 150,
  },
  mediaItemFull: {
    width: '100%',
    height: '100%',
  },
  // Overlay for remaining items count
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  mediaOverlayText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: '700',
  },
  // Video indicator overlay
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  videoIndicatorBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs / 2,
  },
  videoIndicatorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
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

