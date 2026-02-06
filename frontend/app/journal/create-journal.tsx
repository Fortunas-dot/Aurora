import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, LoadingSpinner } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, CreateJournalData } from '../../src/services/journal.service';
import { uploadService } from '../../src/services/upload.service';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function CreateJournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useSettingsStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mental health topics list
  const mentalHealthTopics = [
    { id: 'depression', label: 'Depression', icon: 'sad-outline' },
    { id: 'anxiety', label: 'Anxiety', icon: 'heart-outline' },
    { id: 'bipolar', label: 'Bipolar Disorder', icon: 'pulse-outline' },
    { id: 'ptsd', label: 'PTSD', icon: 'shield-outline' },
    { id: 'ocd', label: 'OCD', icon: 'repeat-outline' },
    { id: 'adhd', label: 'ADHD', icon: 'flash-outline' },
    { id: 'eating-disorder', label: 'Eating Disorder', icon: 'nutrition-outline' },
    { id: 'addiction', label: 'Addiction', icon: 'warning-outline' },
    { id: 'grief', label: 'Grief & Loss', icon: 'heart-dislike-outline' },
    { id: 'stress', label: 'Stress Management', icon: 'fitness-outline' },
    { id: 'self-esteem', label: 'Self-Esteem', icon: 'star-outline' },
    { id: 'relationships', label: 'Relationships', icon: 'people-outline' },
    { id: 'work-life', label: 'Work-Life Balance', icon: 'briefcase-outline' },
    { id: 'sleep', label: 'Sleep Issues', icon: 'moon-outline' },
    { id: 'anger', label: 'Anger Management', icon: 'flame-outline' },
    { id: 'trauma', label: 'Trauma', icon: 'medical-outline' },
    { id: 'general', label: 'General Wellness', icon: 'leaf-outline' },
  ];

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need access to your photos'
      );
      return false;
    }
    return true;
  };

  const handlePickCoverImage = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Could not select image'
      );
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(
        'Error',
        'Please enter a name for your journal'
      );
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert(
        'Error',
        'Name must be at least 3 characters'
      );
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      let coverImageUrl: string | undefined;

      // Upload cover image if selected
      if (coverImageUri) {
        const uploadResult = await uploadService.uploadImage(coverImageUri);
        if (uploadResult.success && uploadResult.data) {
          coverImageUrl = uploadResult.data.url;
        }
      }

      const data: CreateJournalData = {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        coverImage: coverImageUrl,
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
      };

      const response = await journalService.createJournal(data);

      if (response.success) {
        router.back();
      } else {
        Alert.alert(
          'Error',
          response.message || 'Could not create journal'
        );
      }
    } catch (error: any) {
      console.error('Error creating journal:', error);
      Alert.alert(
        'Error',
        'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            New Journal
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover Image */}
          <GlassCard style={styles.coverCard} padding="lg">
            <Text style={styles.label}>
              Cover Image (optional)
            </Text>
            {coverImageUri ? (
              <View style={styles.coverImageContainer}>
                <Pressable
                  style={styles.coverImage}
                  onPress={handlePickCoverImage}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="image" size={48} color={COLORS.white} />
                </Pressable>
                <Pressable
                  style={styles.removeCoverButton}
                  onPress={() => setCoverImageUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.addCoverButton} onPress={handlePickCoverImage}>
                <Ionicons name="image-outline" size={32} color={COLORS.primary} />
                <Text style={styles.addCoverText}>
                  Add cover
                </Text>
              </Pressable>
            )}
          </GlassCard>

          {/* Name Input */}
          <GlassCard style={styles.nameCard} padding="lg">
            <Text style={styles.label}>
              Name *
            </Text>
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder="My Journal"
              style={styles.nameInput}
              maxLength={100}
            />
          </GlassCard>

          {/* Description Input */}
          <GlassCard style={styles.descriptionCard} padding="lg">
            <Text style={styles.label}>
              Description (optional)
            </Text>
            <GlassInput
              value={description}
              onChangeText={setDescription}
              placeholder={
                'Describe your journal...'
              }
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
              inputStyle={styles.descriptionInputText}
              maxLength={500}
            />
          </GlassCard>

          {/* Mental Health Topics Selection */}
          <GlassCard style={styles.topicsCard} padding="lg">
            <Text style={styles.label}>
              Mental Health Topics (optional)
            </Text>
            <Text style={styles.topicsSubtitle}>
              Select the topics this journal focuses on
            </Text>
            <View style={styles.topicsGrid}>
              {mentalHealthTopics.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <Pressable
                    key={topic.id}
                    style={[
                      styles.topicChip,
                      isSelected && styles.topicChipSelected,
                    ]}
                    onPress={() => toggleTopic(topic.id)}
                  >
                    <Ionicons
                      name={topic.icon as any}
                      size={16}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.topicChipText,
                        isSelected && styles.topicChipTextSelected,
                      ]}
                    >
                      {topic.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={COLORS.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          {/* Privacy Selection */}
          <GlassCard style={styles.privacyCard} padding="lg">
            <Text style={styles.label}>
              Privacy *
            </Text>
            <Text style={styles.privacySubtitle}>
              Choose if your journal is private or public
            </Text>

            <View style={styles.privacyOptions}>
              <Pressable
                style={[
                  styles.privacyOption,
                  !isPublic && styles.privacyOptionActive,
                ]}
                onPress={() => setIsPublic(false)}
              >
                <View style={styles.privacyOptionContent}>
                  <Ionicons
                    name={!isPublic ? 'lock-closed' : 'lock-closed-outline'}
                    size={24}
                    color={!isPublic ? COLORS.primary : COLORS.textMuted}
                  />
                  <View style={styles.privacyOptionText}>
                    <Text
                      style={[
                        styles.privacyOptionTitle,
                        !isPublic && styles.privacyOptionTitleActive,
                      ]}
                    >
                      Private
                    </Text>
                    <Text style={styles.privacyOptionDescription}>
                      Only you can see your entries
                    </Text>
                  </View>
                </View>
                {!isPublic && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.privacyOption,
                  isPublic && styles.privacyOptionActive,
                ]}
                onPress={() => setIsPublic(true)}
              >
                <View style={styles.privacyOptionContent}>
                  <Ionicons
                    name={isPublic ? 'globe' : 'globe-outline'}
                    size={24}
                    color={isPublic ? COLORS.primary : COLORS.textMuted}
                  />
                  <View style={styles.privacyOptionText}>
                    <Text
                      style={[
                        styles.privacyOptionTitle,
                        isPublic && styles.privacyOptionTitleActive,
                      ]}
                    >
                      Public
                    </Text>
                    <Text style={styles.privacyOptionDescription}>
                      Others can follow your journey
                    </Text>
                  </View>
                </View>
                {isPublic && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </Pressable>
            </View>
          </GlassCard>

          {/* Submit Button */}
          <GlassButton
            title={isSubmitting || isUploading ? 'Creating...' : 'Create Journal'}
            onPress={handleSubmit}
            disabled={isSubmitting || isUploading || !name.trim()}
            style={styles.submitButton}
            size="lg"
          />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  coverCard: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  coverImageContainer: {
    position: 'relative',
    marginTop: SPACING.sm,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeCoverButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  addCoverButton: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  addCoverText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  nameCard: {
    marginBottom: SPACING.md,
  },
  nameInput: {
    marginTop: SPACING.xs,
  },
  descriptionCard: {
    marginBottom: SPACING.md,
  },
  descriptionInput: {
    minHeight: 100,
    marginTop: SPACING.xs,
  },
  descriptionInputText: {
    minHeight: 100,
    textAlignVertical: 'top',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  privacyCard: {
    marginBottom: SPACING.xl,
  },
  privacySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  privacyOptions: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  privacyOptionActive: {
    backgroundColor: COLORS.glass.background,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  privacyOptionText: {
    flex: 1,
  },
  privacyOptionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs / 2,
  },
  privacyOptionTitleActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  privacyOptionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  topicsCard: {
    marginBottom: SPACING.md,
  },
  topicsSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  topicChipSelected: {
    backgroundColor: COLORS.glass.background,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  topicChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  topicChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});
