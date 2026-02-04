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
  Switch,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { groupService } from '../src/services/group.service';
import { uploadService } from '../src/services/upload.service';
import { useAuthStore } from '../src/store/authStore';
import { COUNTRIES, getCountryName, Country } from '../src/constants/countries';

const SUGGESTED_TAGS = [
  'angst',
  'depressie',
  'mindfulness',
  'therapie',
  'support',
  'herstel',
  'stress',
  'slaap',
  'meditatie',
  'community',
];

const HEALTH_CONDITIONS = [
  'Depression',
  'Anxiety Disorder',
  'PTSD',
  'ADHD',
  'Autism',
  'Eating Disorder',
  'Addiction',
  'Borderline',
  'OCD',
  'Burnout',
  'Stress',
  'Sleep Problems',
  'Chronic Pain',
  'Fibromyalgia',
  'Rheumatism',
  'Diabetes',
  'Heart Problems',
  'Asthma',
  'Migraine',
  'Epilepsy',
  'MS',
  'Other',
];

// Default cover image options (gradient colors)
const COVER_IMAGE_OPTIONS = [
  { id: 'blue', name: 'Blue', colors: ['rgba(24, 119, 242, 0.8)', 'rgba(66, 103, 178, 0.8)'] },
  { id: 'purple', name: 'Purple', colors: ['rgba(139, 92, 246, 0.8)', 'rgba(167, 139, 250, 0.8)'] },
  { id: 'teal', name: 'Teal', colors: ['rgba(20, 184, 166, 0.8)', 'rgba(94, 234, 212, 0.8)'] },
  { id: 'pink', name: 'Pink', colors: ['rgba(236, 72, 153, 0.8)', 'rgba(244, 114, 182, 0.8)'] },
  { id: 'orange', name: 'Orange', colors: ['rgba(249, 115, 22, 0.8)', 'rgba(251, 146, 60, 0.8)'] },
  { id: 'green', name: 'Green', colors: ['rgba(34, 197, 94, 0.8)', 'rgba(74, 222, 128, 0.8)'] },
];

export default function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [country, setCountry] = useState<string>('global');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [selectedCoverImageOption, setSelectedCoverImageOption] = useState<string | null>(null);
  const [showCoverImageModal, setShowCoverImageModal] = useState(false);
  const [healthCondition, setHealthCondition] = useState<string | null>(null);
  const [showHealthConditionModal, setShowHealthConditionModal] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

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

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos');
      return false;
    }
    return true;
  };

  const handlePickAvatar = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
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
        setIsUploadingCoverImage(true);
        try {
          const uploadResponse = await uploadService.uploadImage(result.assets[0].uri);
          if (uploadResponse.success && uploadResponse.data) {
            setCoverImageUri(uploadResponse.data.url);
            setSelectedCoverImageOption(null);
            setShowCoverImageModal(false);
          }
        } catch (error) {
          console.error('Error uploading cover image:', error);
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setIsUploadingCoverImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  const handleSelectCoverImageOption = (optionId: string) => {
    setSelectedCoverImageOption(optionId);
    setCoverImageUri(null);
    setShowCoverImageModal(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert('Error', 'Group name must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    setIsUploadingAvatar(true);

    try {
      let avatarUrl: string | undefined = undefined;
      let coverImageUrl: string | undefined = undefined;

      // Upload avatar if selected
      if (avatarUri && !avatarUri.startsWith('http')) {
        const uploadResult = await uploadService.uploadImage(avatarUri);
        if (uploadResult.success && uploadResult.data) {
          avatarUrl = uploadResult.data.url;
        } else {
          Alert.alert('Error', 'Could not upload avatar');
          setIsSubmitting(false);
          setIsUploadingAvatar(false);
          return;
        }
      }

      // Handle cover image - either uploaded image or selected gradient option
      if (coverImageUri && !coverImageUri.startsWith('http')) {
        // This shouldn't happen as we upload immediately, but just in case
        const uploadResult = await uploadService.uploadImage(coverImageUri);
        if (uploadResult.success && uploadResult.data) {
          coverImageUrl = uploadResult.data.url;
        }
      } else if (coverImageUri) {
        coverImageUrl = coverImageUri;
      } else if (selectedCoverImageOption) {
        // For gradient options, we'll store the option ID and generate on frontend
        // Or we could create a gradient image URL pattern
        // For now, we'll just store null and use the gradient on frontend
        coverImageUrl = `gradient:${selectedCoverImageOption}`;
      }

      const response = await groupService.createGroup(
        name.trim(),
        description.trim(),
        tags,
        isPrivate,
        country,
        avatarUrl,
        coverImageUrl,
        healthCondition || undefined
      );
      
      if (response.success && response.data) {
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Could not create group');
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Something went wrong while creating the group');
    } finally {
      setIsSubmitting(false);
      setIsUploadingAvatar(false);
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
          <Text style={styles.headerTitle}>New Group</Text>
          <Pressable
            style={[styles.headerIconButton, (!name.trim() || isSubmitting) && styles.headerIconButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || !name.trim()}
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
          {/* Cover Image Selection */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Cover Image (optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a cover image for your group
            </Text>
            <Pressable
              style={styles.coverImageSelector}
              onPress={() => setShowCoverImageModal(true)}
            >
              {coverImageUri ? (
                <Image source={{ uri: coverImageUri }} style={styles.coverImagePreview} />
              ) : selectedCoverImageOption ? (
                <LinearGradient
                  colors={COVER_IMAGE_OPTIONS.find(opt => opt.id === selectedCoverImageOption)?.colors || COVER_IMAGE_OPTIONS[0].colors}
                  style={styles.coverImagePreview}
                />
              ) : (
                <View style={styles.coverImagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={COLORS.primary} />
                  <Text style={styles.coverImagePlaceholderText}>Select cover image</Text>
                </View>
              )}
              {isUploadingCoverImage && (
                <View style={styles.coverImageUploadingOverlay}>
                  <LoadingSpinner size="sm" />
                </View>
              )}
            </Pressable>
          </GlassCard>

          {/* Avatar Upload */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Group Avatar (optional)</Text>
            <Pressable style={styles.avatarContainer} onPress={handlePickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera" size={32} color={COLORS.primary} />
                  <Text style={styles.avatarPlaceholderText}>Add photo</Text>
                </View>
              )}
            </Pressable>
          </GlassCard>

          {/* Name Input */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Group Name *</Text>
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Anxiety & Panic Support"
              style={styles.input}
              maxLength={100}
            />
          </GlassCard>

          {/* Description Input */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Description</Text>
            <GlassInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what this group does..."
              multiline
              numberOfLines={4}
              style={styles.input}
              inputStyle={styles.descriptionInput}
              maxLength={500}
            />
          </GlassCard>

          {/* Health Condition Selection */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Health Condition (optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Select a health condition this group focuses on
            </Text>
            <Pressable
              style={styles.countrySelector}
              onPress={() => setShowHealthConditionModal(true)}
            >
              <View style={styles.countrySelectorContent}>
                <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
                <Text style={styles.countrySelectorText}>
                  {healthCondition || 'None selected'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </Pressable>
          </GlassCard>

          {/* Country Selection */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Location</Text>
            <Text style={styles.sectionSubtitle}>
              Select a country or choose Global for worldwide groups
            </Text>
            <Pressable
              style={styles.countrySelector}
              onPress={() => setShowCountryModal(true)}
            >
              <View style={styles.countrySelectorContent}>
                <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
                <Text style={styles.countrySelectorText}>
                  {getCountryName(country)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </Pressable>
          </GlassCard>

          {/* Privacy Toggle */}
          <GlassCard style={styles.inputCard} padding="lg">
            <View style={styles.privacyRow}>
              <View style={styles.privacyInfo}>
                <Text style={styles.label}>Private group</Text>
                <Text style={styles.privacyDescription}>
                  Only members can see the group and view posts
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: COLORS.glass.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </GlassCard>

          {/* Tags Section */}
          <GlassCard style={styles.tagsCard} padding="lg">
            <Text style={styles.label}>Tags (optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Add tags to make your group more discoverable
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
              <Text style={styles.suggestedTagsTitle}>Suggestions:</Text>
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

      {/* Health Condition Selection Modal */}
      <Modal
        visible={showHealthConditionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHealthConditionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + SPACING.md }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Health Condition</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowHealthConditionModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            {/* Health Conditions List */}
            <FlatList
              data={['None', ...HEALTH_CONDITIONS]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.countryItem}
                  onPress={() => {
                    setHealthCondition(item === 'None' ? null : item);
                    setShowHealthConditionModal(false);
                  }}
                >
                  <View style={styles.countryItemContent}>
                    <Ionicons
                      name={item === 'None' ? 'close-circle-outline' : 'heart-outline'}
                      size={20}
                      color={item === 'None' ? COLORS.textMuted : COLORS.primary}
                    />
                    <Text style={styles.countryItemText}>{item === 'None' ? 'None' : item}</Text>
                  </View>
                  {healthCondition === item && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                  {item === 'None' && !healthCondition && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </Pressable>
              )}
              contentContainerStyle={styles.modalListContent}
            />
          </View>
        </View>
      </Modal>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + SPACING.md }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCountryModal(false);
                  setCountrySearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
              <GlassInput
                placeholder="Search countries..."
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
                style={styles.searchInput}
                icon="search"
              />
            </View>

            {/* Countries List */}
            <FlatList
              data={COUNTRIES.filter((country) =>
                country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(item.code);
                    setShowCountryModal(false);
                  }}
                >
                  <View style={styles.countryItemContent}>
                    <Ionicons
                      name={item.code === 'global' ? 'globe-outline' : 'flag-outline'}
                      size={20}
                      color={item.code === 'global' ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={styles.countryItemText}>{item.name}</Text>
                  </View>
                  {country === item.code && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </Pressable>
              )}
              contentContainerStyle={styles.modalListContent}
            />
          </View>
        </View>
      </Modal>

      {/* Cover Image Selection Modal */}
      <Modal
        visible={showCoverImageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCoverImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + SPACING.md }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Cover Image</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowCoverImageModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            {/* Upload Option */}
            <Pressable
              style={styles.coverImageOption}
              onPress={handlePickCoverImage}
            >
              <View style={styles.coverImageOptionContent}>
                <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                <Text style={styles.coverImageOptionText}>Upload from Gallery</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </Pressable>

            {/* Gradient Options */}
            <Text style={styles.coverImageSectionTitle}>Or choose a gradient</Text>
            <FlatList
              data={COVER_IMAGE_OPTIONS}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.coverImageGradientOption}
                  onPress={() => handleSelectCoverImageOption(item.id)}
                >
                  <LinearGradient
                    colors={item.colors}
                    style={styles.coverImageGradientPreview}
                  />
                  {selectedCoverImageOption === item.id && (
                    <View style={styles.coverImageGradientCheck}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                    </View>
                  )}
                  <Text style={styles.coverImageGradientName}>{item.name}</Text>
                </Pressable>
              )}
              contentContainerStyle={styles.coverImageGradientList}
            />
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
  inputCard: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    marginTop: 0,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 38,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  privacyDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  tagsCard: {
    marginBottom: SPACING.md,
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
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginTop: SPACING.sm,
  },
  countrySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  countrySelectorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
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
  modalListContent: {
    padding: SPACING.md,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.sm,
  },
  countryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  countryItemText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: SPACING.sm,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  coverImageSelector: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    position: 'relative',
  },
  coverImagePreview: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.glass.background,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImagePlaceholderText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  coverImageUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  coverImageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  coverImageOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  coverImageSectionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  coverImageGradientList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  coverImageGradientOption: {
    flex: 1,
    margin: SPACING.xs,
    alignItems: 'center',
  },
  coverImageGradientPreview: {
    width: '100%',
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  coverImageGradientCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  coverImageGradientName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    textAlign: 'center',
  },
});






