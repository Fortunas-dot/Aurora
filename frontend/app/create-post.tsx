import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { postService } from '../src/services/post.service';
import { uploadService } from '../src/services/upload.service';
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
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Toestemming nodig', 'We hebben toegang nodig tot je foto\'s en video\'s');
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
      Alert.alert('Fout', 'Kon afbeelding niet selecteren');
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
      Alert.alert('Fout', 'Kon video niet selecteren');
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
    if (!content.trim()) {
      Alert.alert('Fout', 'Voeg wat inhoud toe aan je post');
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert('Fout', 'Je post moet minimaal 10 karakters bevatten');
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
        groupId,
        imageUrls.length > 0 ? imageUrls : undefined
      );
      
      if (response.success) {
        router.back();
      } else {
        Alert.alert('Fout', response.message || 'Kon post niet aanmaken');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Fout', 'Er ging iets mis bij het aanmaken van je post');
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
          <Text style={styles.headerTitle}>Nieuwe post</Text>
          <Pressable
            style={[styles.headerIconButton, (!content.trim() || isSubmitting) && styles.headerIconButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || uploadingMedia || !content.trim()}
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
          {/* Content Input */}
          <GlassCard style={styles.contentCard} padding="lg">
            <GlassInput
              value={content}
              onChangeText={setContent}
              placeholder="Deel je gedachten, ervaringen of vraag..."
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
                <Text style={styles.mediaButtonText}>Foto</Text>
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

          {/* Tags Section */}
          <GlassCard style={styles.tagsCard} padding="lg">
            <Text style={styles.sectionTitle}>Tags (optioneel)</Text>
            <Text style={styles.sectionSubtitle}>
              Voeg tags toe om je post beter vindbaar te maken
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
                  placeholder="Voeg een tag toe..."
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

