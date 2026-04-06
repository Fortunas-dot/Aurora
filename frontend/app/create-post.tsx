import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  Image,
  Modal,
  FlatList,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner, Avatar } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { postService, PostType } from '../src/services/post.service';
import { uploadService } from '../src/services/upload.service';
import { groupService, Group } from '../src/services/group.service';
import { useAuthStore } from '../src/store/authStore';
import { useTranslation } from '../src/hooks/useTranslation';

const SUGGESTED_TAGS = [
  'meditation',
  'anxiety',
  'depression',
  'therapy',
  'mindfulness',
  'stress',
  'sleep',
  'selfcare',
  'hope',
  'recovery',
];

const MAX_IMAGES_PER_POST = 2;
const MAX_VIDEOS_PER_POST = 1;

export default function CreatePostScreen() {
  const router = useRouter();
  const { groupId: initialGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('post');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  const videoRefs = useRef<{ [key: number]: any }>({});
  
  // Group selection state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  // Load groups and set initial group if provided
  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
      if (initialGroupId) {
        loadInitialGroup(initialGroupId);
      }
    }
  }, [isAuthenticated, initialGroupId]);

  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await groupService.getGroups(1, 100);
      if (response.success && response.data) {
        // Filter to show only groups where user is a member (required to post)
        const userGroups = response.data.filter((group) => group.isMember);
        setAvailableGroups(userGroups);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const loadInitialGroup = async (groupId: string) => {
    try {
      const response = await groupService.getGroup(groupId);
      if (response.success && response.data) {
        setSelectedGroup(response.data);
      }
    } catch (error) {
      console.error('Error loading initial group:', error);
    }
  };

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('post_perm_title'), t('post_perm_body'));
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const pickedImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image' as const,
        }));

        setMedia((prevMedia) => {
          const currentImageCount = prevMedia.filter((item) => item.type === 'image').length;
          const remainingSlots = MAX_IMAGES_PER_POST - currentImageCount;

          if (remainingSlots <= 0) {
            Alert.alert(t('post_alert_limit_title'), t('post_alert_photos_limit', { max: MAX_IMAGES_PER_POST }));
            return prevMedia;
          }

          const imagesToAdd = pickedImages.slice(0, remainingSlots);

          if (imagesToAdd.length < pickedImages.length) {
            Alert.alert(t('post_alert_limit_title'), t('post_alert_photos_limit', { max: MAX_IMAGES_PER_POST }));
          }

          return [...prevMedia, ...imagesToAdd];
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('error'), t('post_alert_pick_image_fail'));
    }
  };

  const handlePickVideo = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newVideo = {
          uri: result.assets[0].uri,
          type: 'video' as const,
        };

        // Replace existing video if any, otherwise add to existing media (which can include photos)
        setMedia((prevMedia) => {
          const existingVideoIndex = prevMedia.findIndex((item) => item.type === 'video');

          // Even though the schema only allows a single video URL, we keep a clear max here
          const hasVideo = existingVideoIndex !== -1;
          if (hasVideo && MAX_VIDEOS_PER_POST <= 0) {
            Alert.alert(t('post_alert_limit_title'), t('post_alert_video_limit'));
            return prevMedia;
          }

          if (existingVideoIndex !== -1) {
            const newMediaArray = [...prevMedia];
            newMediaArray[existingVideoIndex] = newVideo;
            return newMediaArray;
          }

          if (MAX_VIDEOS_PER_POST <= 0) {
            Alert.alert(t('post_alert_limit_title'), t('post_alert_video_limit'));
            return prevMedia;
          }

          return [...prevMedia, newVideo];
        });
        console.log('Video selected:', newVideo.uri);
      } else {
        console.log('Video selection canceled or no assets');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert(t('error'), t('post_alert_pick_video_fail'));
    }
  };

  const handleRemoveMedia = (index: number) => {
    // Stop video if it's playing
    if (playingVideoIndex === index) {
      const videoRef = videoRefs.current[index];
      if (videoRef) {
        videoRef.pauseAsync();
        videoRef.unloadAsync();
      }
      setPlayingVideoIndex(null);
    }
    // Remove video ref
    delete videoRefs.current[index];
    // Remove media
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 5) {
      setTags([...tags, normalizedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSuggestedTagPress = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('error'), t('post_err_title_required'));
      return;
    }

    if (title.trim().length < 3) {
      Alert.alert(t('error'), t('post_err_title_short'));
      return;
    }

    if (!content.trim()) {
      Alert.alert(t('error'), t('post_err_content_required'));
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert(t('error'), t('post_err_content_short'));
      return;
    }

    setIsSubmitting(true);
    setUploadingMedia(true);
    
    try {
      // Upload images and video
      const imageUrls: string[] = [];
      let videoUrl: string | undefined = undefined;
      
      for (const item of media) {
        if (item.type === 'image') {
          const uploadResult = await uploadService.uploadImage(item.uri);
          if (uploadResult.success && uploadResult.data) {
            imageUrls.push(uploadResult.data.url);
          }
        } else if (item.type === 'video') {
          console.log('Starting video upload:', item.uri);
          const uploadResult = await uploadService.uploadVideo(item.uri);
          if (uploadResult.success && uploadResult.data) {
            videoUrl = uploadResult.data.url;
            console.log('Video uploaded successfully:', videoUrl);
          } else {
            console.error('Video upload failed:', uploadResult.message);
            Alert.alert(
              t('post_video_fail_title'),
              uploadResult.message || t('post_video_fail_body')
            );
            setIsSubmitting(false);
            setUploadingMedia(false);
            return;
          }
        }
      }

      console.log('Creating post with video:', videoUrl);
      const response = await postService.createPost(
        content.trim(),
        tags,
        selectedGroup?._id,
        imageUrls.length > 0 ? imageUrls : undefined,
        postType,
        title.trim(),
        videoUrl
      );
      
      if (response.success) {
        console.log('Post created successfully:', response.data);
      } else {
        console.error('Post creation failed:', response.message);
      }
      
      if (response.success) {
        router.back();
      } else {
        Alert.alert(t('error'), response.message || t('post_err_create_failed'));
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert(t('error'), t('post_err_create_generic'));
    } finally {
      setIsSubmitting(false);
      setUploadingMedia(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('post_header_new')}</Text>
          <Pressable
            style={[styles.headerIconButton, (!title.trim() || !content.trim() || isSubmitting) && styles.headerIconButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || uploadingMedia || !title.trim() || !content.trim()}
          >
            {(isSubmitting || uploadingMedia) ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Ionicons name="checkmark" size={24} color={COLORS.primary} />
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          decelerationRate="normal"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {/* Post Type Selection */}
          <GlassCard style={styles.postTypeCard} padding="lg">
            <Text style={styles.label}>{t('post_type_label')}</Text>
            <View style={styles.postTypeContainer}>
              <Pressable
                style={[styles.postTypeButton, postType === 'post' && styles.postTypeButtonActive]}
                onPress={() => setPostType('post')}
              >
                <Ionicons 
                  name="document-text-outline" 
                  size={20} 
                  color={postType === 'post' ? COLORS.primary : COLORS.textMuted} 
                />
                <Text style={[styles.postTypeText, postType === 'post' && styles.postTypeTextActive]}>
                  {t('post_type_post')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.postTypeButton, postType === 'question' && styles.postTypeButtonActive]}
                onPress={() => setPostType('question')}
              >
                <Ionicons 
                  name="help-circle-outline" 
                  size={20} 
                  color={postType === 'question' ? COLORS.primary : COLORS.textMuted} 
                />
                <Text style={[styles.postTypeText, postType === 'question' && styles.postTypeTextActive]}>
                  {t('post_type_question')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.postTypeButton, postType === 'story' && styles.postTypeButtonActive]}
                onPress={() => setPostType('story')}
              >
                <Ionicons 
                  name="book-outline" 
                  size={20} 
                  color={postType === 'story' ? COLORS.primary : COLORS.textMuted} 
                />
                <Text style={[styles.postTypeText, postType === 'story' && styles.postTypeTextActive]}>
                  {t('post_type_story')}
                </Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Title Input */}
          <GlassCard style={styles.titleCard} padding="md">
            <Text style={styles.label}>{t('post_field_title')}</Text>
            <GlassInput
              value={title}
              onChangeText={setTitle}
              placeholder={
                postType === 'question'
                  ? t('post_title_ph_question')
                  : postType === 'story'
                    ? t('post_title_ph_story')
                    : t('post_title_ph_post')
              }
              style={styles.titleInput}
              maxLength={200}
              // Prevent iOS password/email AutoFill styling from affecting this field
              textContentType="none"
              autoComplete="off"
            />
          </GlassCard>

          {/* Content Input */}
          <GlassCard style={styles.contentCard} padding="md">
            <Text style={styles.label}>Content *</Text>
            <GlassInput
              value={content}
              onChangeText={setContent}
              placeholder={
                postType === 'question'
                  ? "Ask your question here... Be specific so others can help you."
                  : postType === 'story'
                  ? "Share your story... What happened? How did it make you feel?"
                  : "Share your thoughts, experiences, or ask a question..."
              }
              multiline
              numberOfLines={8}
              style={styles.contentInput}
              inputStyle={styles.contentInputText}
              maxLength={2000}
              // Prevent any AutoFill association; this is plain content
              textContentType="none"
              autoComplete="off"
            />
            
            {/* Media Preview */}
            {media.length > 0 && (
              <View style={styles.mediaPreview}>
                {media.map((item, index) => (
                  <View key={`${item.type}-${index}-${item.uri}`} style={styles.mediaItem}>
                    {item.type === 'image' ? (
                      <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                    ) : (
                      <View style={styles.mediaVideoContainer}>
                        <Video
                          ref={(ref) => {
                            if (ref) {
                              videoRefs.current[index] = ref;
                            }
                          }}
                          source={{ uri: item.uri }}
                          style={styles.mediaVideo}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={playingVideoIndex === index}
                          useNativeControls={playingVideoIndex === index}
                          isLooping={false}
                          onPlaybackStatusUpdate={(status) => {
                            if (status.isLoaded && status.didJustFinish) {
                              setPlayingVideoIndex(null);
                            }
                          }}
                        />
                        {playingVideoIndex !== index && (
                          <Pressable
                            style={styles.mediaVideoOverlay}
                            onPress={async () => {
                              setPlayingVideoIndex(index);
                              const videoRef = videoRefs.current[index];
                              if (videoRef) {
                                try {
                                  await videoRef.playAsync();
                                } catch (error) {
                                  console.error('Error playing video:', error);
                                  setPlayingVideoIndex(null);
                                }
                              }
                            }}
                          >
                            <Ionicons name="play-circle" size={40} color={COLORS.white} />
                          </Pressable>
                        )}
                      </View>
                    )}
                    <Pressable
                      style={styles.removeMediaButton}
                      onPress={() => handleRemoveMedia(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Media Actions */}
            <View style={styles.mediaActions}>
              <Pressable style={styles.mediaButton} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                <Text style={styles.mediaButtonText}>{t('post_media_photo')}</Text>
              </Pressable>
              <Pressable style={styles.mediaButton} onPress={handlePickVideo}>
                <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
                <Text style={styles.mediaButtonText}>{t('post_media_video')}</Text>
              </Pressable>
              <View style={styles.mediaSpacer} />
              <Text style={styles.charCount}>
                {content.length} / 2000
              </Text>
            </View>
          </GlassCard>

          {/* Community/Group Selection */}
          <GlassCard style={styles.groupCard} padding="lg">
            <Text style={styles.sectionTitle}>{t('post_community_title')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('post_community_sub')}
            </Text>

            {selectedGroup ? (
              <View style={styles.selectedGroupContainer}>
                <View style={styles.selectedGroupInfo}>
                  <View style={styles.selectedGroupIcon}>
                    <Ionicons name="people" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.selectedGroupDetails}>
                    <Text style={styles.selectedGroupName}>{selectedGroup.name}</Text>
                    {selectedGroup.description && (
                      <Text style={styles.selectedGroupDescription} numberOfLines={1}>
                        {selectedGroup.description}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  style={styles.removeGroupButton}
                  onPress={() => setSelectedGroup(null)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.selectGroupButton}
                onPress={() => setShowGroupModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.selectGroupButtonText}>{t('post_select_community')}</Text>
              </Pressable>
            )}
          </GlassCard>

          {/* Tags Section */}
          <GlassCard style={styles.tagsCard} padding="lg">
            <Text style={styles.sectionTitle}>{t('post_tags_title')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('post_tags_sub')}
            </Text>

            {/* Current Tags */}
            {tags.length > 0 && (
              <View style={styles.currentTags}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tagWrapper}>
                    <TagChip label={tag} size="sm" />
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={COLORS.textMuted}
                      style={styles.removeTagIcon}
                      onPress={() => handleRemoveTag(tag)}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Tag Input */}
            {tags.length < 5 && (
              <View style={styles.tagInputContainer}>
                <GlassInput
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder={t('post_tag_placeholder')}
                  style={styles.tagInput}
                  onSubmitEditing={() => handleAddTag(tagInput)}
                  returnKeyType="done"
                />
                <Pressable
                  style={[styles.addTagIconButton, !tagInput.trim() && styles.addTagIconButtonDisabled]}
                  onPress={() => handleAddTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={tagInput.trim() ? COLORS.primary : COLORS.textMuted}
                  />
                </Pressable>
              </View>
            )}

            {/* Suggested Tags */}
            <View style={styles.suggestedTags}>
              <Text style={styles.suggestedTagsTitle}>{t('post_tags_suggestions')}</Text>
              <View style={styles.suggestedTagsList}>
                {SUGGESTED_TAGS.filter((tag) => !tags.includes(tag)).map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.suggestedTag}
                    onPress={() => handleSuggestedTagPress(tag)}
                  >
                    <Text style={styles.suggestedTagText}>#{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Group Selection Modal */}
      <Modal
        visible={showGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + SPACING.md }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('post_modal_title')}</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowGroupModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            {/* Groups List */}
            {isLoadingGroups ? (
              <View style={styles.modalLoadingContainer}>
                <LoadingSpinner size="lg" />
              </View>
            ) : (
              <FlatList
                data={availableGroups}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.groupItem}
                    onPress={() => {
                      setSelectedGroup(item);
                      setShowGroupModal(false);
                    }}
                  >
                    <View style={styles.groupItemIcon}>
                      <Ionicons name="people" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.groupItemInfo}>
                      <View style={styles.groupItemHeader}>
                        <Text style={styles.groupItemName}>{item.name}</Text>
                        {item.isPrivate && (
                          <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
                        )}
                      </View>
                      {item.description && (
                        <Text style={styles.groupItemDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      <View style={styles.groupItemMeta}>
                        <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.groupItemMetaText}>
                          {item.memberCount}{' '}
                          {item.memberCount === 1 ? t('feed_member') : t('feed_members')}
                        </Text>
                      </View>
                    </View>
                    {selectedGroup?._id === item._id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </Pressable>
                )}
                contentContainerStyle={styles.modalListContent}
                ListEmptyComponent={
                  <View style={styles.modalEmptyContainer}>
                    <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.modalEmptyText}>{t('post_modal_empty')}</Text>
                    <Text style={styles.modalEmptySubtext}>
                      {t('post_modal_empty_sub')}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  postTypeCard: {
    marginBottom: SPACING.md,
  },
  postTypeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  postTypeButtonActive: {
    backgroundColor: COLORS.glass.background,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  postTypeText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
  },
  postTypeTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  titleCard: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
    marginLeft: 0,
  },
  titleInput: {
    marginTop: 0,
  },
  contentCard: {
    marginBottom: SPACING.md,
  },
  contentInput: {
    minHeight: 150,
  },
  contentInputText: {
    minHeight: 150,
    textAlignVertical: 'top',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  mediaPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  mediaItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaVideoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
  },
  mediaVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  mediaButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  mediaSpacer: {
    flex: 1,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  groupCard: {
    marginBottom: SPACING.md,
  },
  selectedGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginTop: SPACING.sm,
  },
  selectedGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedGroupIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  selectedGroupDetails: {
    flex: 1,
  },
  selectedGroupName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  selectedGroupDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  removeGroupButton: {
    marginLeft: SPACING.sm,
  },
  selectGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderStyle: 'solid',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  selectGroupButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for better contrast
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background, // Solid background for better readability
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    opacity: 1, // Ensure full opacity
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListContent: {
    padding: SPACING.md,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.sm,
  },
  groupItemIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  groupItemInfo: {
    flex: 1,
  },
  groupItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs / 2,
  },
  groupItemName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  groupItemDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs / 2,
  },
  groupItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  groupItemMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  modalEmptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  modalEmptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
    width: '100%',
  },
  modalEmptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    width: '100%',
  },
  tagsCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  currentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  removeTagIcon: {
    marginLeft: SPACING.xs,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tagInput: {
    flex: 1,
  },
  addTagIconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagIconButtonDisabled: {
    opacity: 0.5,
  },
  suggestedTags: {
    marginTop: SPACING.sm,
  },
  suggestedTagsTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  suggestedTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestedTag: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  suggestedTagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
});

