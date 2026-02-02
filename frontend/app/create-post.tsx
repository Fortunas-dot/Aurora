import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner, Avatar } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { postService } from '../src/services/post.service';
import { uploadService } from '../src/services/upload.service';
import { groupService, Group } from '../src/services/group.service';
import { useAuthStore } from '../src/store/authStore';

const SUGGESTED_TAGS = [
  'meditatie',
  'angst',
  'depressie',
  'therapie',
  'mindfulness',
  'stress',
  'slaap',
  'zelfzorg',
  'hoop',
  'herstel',
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { groupId: initialGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
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
      Alert.alert('Permission needed', 'We need access to your photos and videos');
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
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image' as const,
        }));
        setMedia([...media, ...newMedia].slice(0, 5)); // Max 5 media items
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
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
        const newMedia = {
          uri: result.assets[0].uri,
          type: 'video' as const,
        };
        setMedia([...media, newMedia].slice(0, 1)); // Max 1 video
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Could not select video');
    }
  };

  const handleRemoveMedia = (index: number) => {
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
      Alert.alert('Error', 'Please add a title to your post');
      return;
    }

    if (title.trim().length < 3) {
      Alert.alert('Error', 'Title must be at least 3 characters');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please add content to your post');
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert('Error', 'Content must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setUploadingMedia(true);
    
    try {
      // Upload images first
      const imageUrls: string[] = [];
      for (const item of media) {
        if (item.type === 'image') {
          const uploadResult = await uploadService.uploadImage(item.uri);
          if (uploadResult.success && uploadResult.data) {
            imageUrls.push(uploadResult.data.url);
          }
        }
        // Videos can be added later if needed
      }

      const response = await postService.createPost(
        content.trim(),
        tags,
        selectedGroup?._id,
        imageUrls.length > 0 ? imageUrls : undefined,
        undefined,
        title.trim()
      );
      
      if (response.success) {
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Could not create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Something went wrong while creating your post');
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
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Post</Text>
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
        >
          {/* Title Input */}
          <GlassCard style={styles.titleCard} padding="lg">
            <Text style={styles.label}>Title *</Text>
            <GlassInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title for your post..."
              style={styles.titleInput}
              maxLength={200}
            />
          </GlassCard>

          {/* Content Input */}
          <GlassCard style={styles.contentCard} padding="lg">
            <Text style={styles.label}>Content *</Text>
            <GlassInput
              value={content}
              onChangeText={setContent}
              placeholder="Share your thoughts, experiences, or ask a question..."
              multiline
              numberOfLines={8}
              style={styles.contentInput}
              inputStyle={styles.contentInputText}
              maxLength={2000}
            />
            
            {/* Media Preview */}
            {media.length > 0 && (
              <View style={styles.mediaPreview}>
                {media.map((item, index) => (
                  <View key={index} style={styles.mediaItem}>
                    {item.type === 'image' ? (
                      <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                    ) : (
                      <View style={styles.mediaVideo}>
                        <Ionicons name="videocam" size={32} color={COLORS.text} />
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
                <Text style={styles.mediaButtonText}>Photo</Text>
              </Pressable>
              <Pressable style={styles.mediaButton} onPress={handlePickVideo}>
                <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
                <Text style={styles.mediaButtonText}>Video</Text>
              </Pressable>
              <View style={styles.mediaSpacer} />
              <Text style={styles.charCount}>
                {content.length} / 2000
              </Text>
            </View>
          </GlassCard>

          {/* Community/Group Selection */}
          <GlassCard style={styles.groupCard} padding="lg">
            <Text style={styles.sectionTitle}>Community (optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Post in a specific community or leave empty for general feed
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
                <Text style={styles.selectGroupButtonText}>Select a community</Text>
              </Pressable>
            )}
          </GlassCard>

          {/* Tags Section */}
          <GlassCard style={styles.tagsCard} padding="lg">
            <Text style={styles.sectionTitle}>Tags (optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Add tags to make your post more discoverable
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
                  placeholder="Add a tag..."
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
              <Text style={styles.suggestedTagsTitle}>Suggesties:</Text>
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
              <Text style={styles.modalTitle}>Select Community</Text>
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
                          {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
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
                    <Text style={styles.modalEmptyText}>No communities available</Text>
                    <Text style={styles.modalEmptySubtext}>
                      Join a community to post there
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
  titleCard: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  titleInput: {
    marginTop: SPACING.xs,
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
  mediaVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.glass.backgroundDark,
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
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  selectGroupButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
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
  },
  modalEmptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalEmptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
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

