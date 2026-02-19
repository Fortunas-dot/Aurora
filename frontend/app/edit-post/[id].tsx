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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { postService, Post } from '../../src/services/post.service';
import { useAuthStore } from '../../src/store/authStore';

export default function EditPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    loadPost();
  }, [isAuthenticated, id]);

  const loadPost = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await postService.getPost(id);
      if (response.success && response.data) {
        const postData = response.data;
        
        // Check if user owns this post
        if (postData.author._id !== user?._id) {
          Alert.alert('Error', 'You can only edit your own posts');
          router.back();
          return;
        }

        setPost(postData);
        setTitle(postData.title || '');
        setContent(postData.content);
        setTags(postData.tags || []);
      } else {
        Alert.alert('Error', 'Post not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Could not load post');
      router.back();
    } finally {
      setIsLoading(false);
    }
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

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Content cannot be empty');
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert('Error', 'Content must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postService.updatePost(id!, {
        title: title.trim() || undefined,
        content: content.trim(),
        tags,
      });

      if (response.success) {
        Alert.alert('Success', 'Post updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Could not update post');
      }
    } catch (error: any) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Something went wrong while updating your post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
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
          <Pressable style={styles.headerIconButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Post</Text>
          <Pressable
            style={[
              styles.headerIconButton,
              (!content.trim() || isSubmitting) && styles.headerIconButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? (
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
          <GlassCard style={styles.card} padding="md">
            <Text style={styles.label}>Title</Text>
            <GlassInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title for your post..."
              style={styles.input}
              maxLength={200}
            />
          </GlassCard>

          {/* Content Input */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.label}>Content *</Text>
            <GlassInput
              value={content}
              onChangeText={setContent}
              placeholder="Share your thoughts..."
              multiline
              numberOfLines={8}
              style={styles.contentInput}
              inputStyle={styles.contentInputText}
              maxLength={2000}
            />
            <View style={styles.charCountContainer}>
              <Text style={styles.charCount}>{content.length} / 2000</Text>
            </View>
          </GlassCard>

          {/* Media Preview (read-only) */}
          {post?.images && post.images.length > 0 && (
            <GlassCard style={styles.card} padding="lg">
              <Text style={styles.label}>Media (cannot be edited)</Text>
              <View style={styles.mediaPreview}>
                {post.images.map((imageUrl, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri: imageUrl }} style={styles.mediaImage} />
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Tags Section */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.label}>Tags</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    marginTop: 0,
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
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  mediaPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  mediaItem: {
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
});
