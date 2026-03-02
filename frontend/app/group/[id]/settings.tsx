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
  Switch,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner } from '../../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/constants/theme';
import { groupService, Group } from '../../../src/services/group.service';
import { uploadService } from '../../../src/services/upload.service';
import { useAuthStore } from '../../../src/store/authStore';
import { COUNTRIES, getCountryName, Country } from '../../../src/constants/countries';

const SUGGESTED_TAGS = [
  'anxiety',
  'depression',
  'mindfulness',
  'therapy',
  'support',
  'recovery',
  'stress',
  'sleep',
  'meditation',
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

export default function GroupSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
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
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    loadGroup();
  }, [id, isAuthenticated]);

  const loadGroup = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await groupService.getGroup(id);
      if (response.success && response.data) {
        const groupData = response.data;
        setGroup(groupData);
        setName(groupData.name);
        setDescription(groupData.description || '');
        setTags(groupData.tags || []);
        setCountry(groupData.country || 'global');
        setAvatarUri(groupData.avatar || null);
        if (groupData.coverImage) {
          if (groupData.coverImage.startsWith('gradient:')) {
            setSelectedCoverImageOption(groupData.coverImage.replace('gradient:', ''));
            setCoverImageUri(null);
          } else {
            setCoverImageUri(groupData.coverImage);
            setSelectedCoverImageOption(null);
          }
        }
        setHealthCondition(groupData.healthCondition || null);

        // Check admin status
        console.log('Group data:', { isAdmin: groupData.isAdmin, userId: groupData._id });
        if (groupData.isAdmin !== true) {
          Alert.alert('Access Denied', 'Only admins can edit group settings');
          router.back();
          return;
        }
      }
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Error', 'Failed to load group');
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

  const handlePickCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingCoverImage(true);
        try {
          const uploadResponse = await uploadService.uploadImage(result.assets[0].uri);
          if (uploadResponse.success && uploadResponse.data) {
            const coverUrl = uploadResponse.data.url;
            setCoverImageUri(coverUrl);
            setSelectedCoverImageOption(null);

            // Immediately update the group cover image in the backend
            if (id) {
              try {
                const updateResponse = await groupService.updateGroup(id, {
                  coverImage: coverUrl,
                });
                if (updateResponse.success && updateResponse.data) {
                  setGroup({
                    ...group!,
                    coverImage: coverUrl,
                  });
                  console.log('✅ Cover image updated immediately');
                }
              } catch (updateError) {
                console.error('Error updating group cover image:', updateError);
              }
            }

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
      console.error('Error picking cover image:', error);
    }
  };

  const handleSelectCoverImageOption = async (optionId: string) => {
    setSelectedCoverImageOption(optionId);
    setCoverImageUri(null);

    // Immediately update backend with gradient cover
    if (id) {
      try {
        const coverImage = `gradient:${optionId}`;
        const updateResponse = await groupService.updateGroup(id, {
          coverImage,
        });
        if (updateResponse.success && updateResponse.data) {
          setGroup({
            ...group!,
            coverImage,
          });
          console.log('✅ Cover gradient updated immediately');
        }
      } catch (error) {
        console.error('Error updating group cover gradient:', error);
      }
    }

    setShowCoverImageModal(false);
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingAvatar(true);
        try {
          const uploadResponse = await uploadService.uploadImage(result.assets[0].uri);
          if (uploadResponse.success && uploadResponse.data) {
            const avatarUrl = uploadResponse.data.url;
            setAvatarUri(avatarUrl);
            
            // Immediately update the group in the backend
            if (id) {
              try {
                const updateResponse = await groupService.updateGroup(id, {
                  avatar: avatarUrl,
                });
                if (updateResponse.success && updateResponse.data) {
                  // Update local group state immediately
                  setGroup({
                    ...group!,
                    avatar: avatarUrl,
                  });
                  console.log('✅ Avatar updated immediately');
                }
              } catch (updateError) {
                console.error('Error updating group avatar:', updateError);
                // Don't show error - avatar is uploaded, will be saved on form submit
              }
            }
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    if (!id) return;

    setIsSubmitting(true);
    try {
      let coverImageUrl: string | undefined = undefined;
      if (coverImageUri) {
        coverImageUrl = coverImageUri;
      } else if (selectedCoverImageOption) {
        coverImageUrl = `gradient:${selectedCoverImageOption}`;
      }

      const response = await groupService.updateGroup(id, {
        name: name.trim(),
        description: description.trim(),
        tags,
        isPrivate: false, // Always public - private groups removed
        country,
        avatar: avatarUri || undefined,
        coverImage: coverImageUrl,
        healthCondition: healthCondition || undefined,
      });

      if (response.success) {
        Alert.alert('Success', 'Group updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update group');
      }
    } catch (error: any) {
      console.error('Error updating group:', error);
      Alert.alert('Error', error.message || 'Failed to update group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = () => {
    if (!id) return;

    Alert.alert(
      'Delete Group',
      'Are you sure you want to permanently delete this group? This action cannot be undone. All posts in this group will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const response = await groupService.deleteGroup(id);

              if (response.success) {
                Alert.alert('Group deleted', 'The group has been deleted successfully.', [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Go back to main Aurora tab after deletion
                      router.replace('/(tabs)/aurora');
                    },
                  },
                ]);
              } else {
                Alert.alert('Error', response.message || 'Failed to delete group');
              }
            } catch (error: any) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', error.message || 'Failed to delete group');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  if (!group) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Group not found</Text>
          <GlassButton title="Back" onPress={() => router.back()} variant="primary" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Group Settings</Text>
          <Pressable
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={[styles.saveButtonText, isSubmitting && styles.saveButtonTextDisabled]}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.sectionTitle}>Group Banner</Text>
            <Text style={styles.sectionSubtitle}>
              Choose or upload a banner for this group
            </Text>
            <Pressable
              style={styles.coverImageSelector}
              onPress={() => setShowCoverImageModal(true)}
            >
              {coverImageUri ? (
                <Image source={{ uri: coverImageUri }} style={styles.coverImagePreview} />
              ) : selectedCoverImageOption ? (
                <LinearGradient
                  colors={
                    COVER_IMAGE_OPTIONS.find((opt) => opt.id === selectedCoverImageOption)?.colors ||
                    COVER_IMAGE_OPTIONS[0].colors
                  }
                  style={styles.coverImagePreview}
                />
              ) : (
                <View style={styles.coverImagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={COLORS.primary} />
                  <Text style={styles.coverImagePlaceholderText}>Select banner</Text>
                </View>
              )}
              {isUploadingCoverImage && (
                <View style={styles.coverImageUploadingOverlay}>
                  <LoadingSpinner size="sm" />
                </View>
              )}
            </Pressable>
          </GlassCard>

          {/* Avatar */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.sectionTitle}>Group Avatar</Text>
            <Pressable style={styles.avatarContainer} onPress={handlePickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.avatarPlaceholder}
                >
                  <Ionicons name="people" size={48} color={COLORS.primary} />
                </LinearGradient>
              )}
              {isUploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <LoadingSpinner size="sm" />
                </View>
              )}
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change avatar</Text>
          </GlassCard>

          {/* Basic Info */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <GlassInput
              label="Group Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter group name"
              maxLength={100}
            />
            <GlassInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what this group does..."
              multiline
              numberOfLines={4}
              maxLength={1000}
              style={styles.descriptionInput}
            />
          </GlassCard>

          {/* Location */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.sectionTitle}>Location</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {country === 'global' ? 'Global' : getCountryName(country)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
            </Pressable>
          </GlassCard>

          {/* Health Condition */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.sectionTitle}>Health Condition</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setShowHealthConditionModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {healthCondition || 'None'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
            </Pressable>
          </GlassCard>

          {/* Tags */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.sectionTitle}>Tags ({tags.length}/5)</Text>
            <View style={styles.tagInputRow}>
              <GlassInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag"
                onSubmitEditing={() => handleAddTag(tagInput)}
                style={styles.tagInput}
              />
              <Pressable
                style={styles.addTagButton}
                onPress={() => handleAddTag(tagInput)}
              >
                <Ionicons name="add" size={24} color={COLORS.primary} />
              </Pressable>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <TagChip
                    key={tag}
                    label={tag}
                    onRemove={() => handleRemoveTag(tag)}
                    size="md"
                  />
                ))}
              </View>
            )}
            {tags.length < 5 && (
              <View style={styles.suggestedTags}>
                {SUGGESTED_TAGS.filter((tag) => !tags.includes(tag)).map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.suggestedTag}
                    onPress={() => handleAddTag(tag)}
                  >
                    <Text style={styles.suggestedTagText}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard style={styles.card} padding="lg">
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerDescription}>
              Deleting this group will remove all posts and members. This action cannot be undone.
            </Text>
            <GlassButton
              title={isDeleting ? 'Deleting...' : 'Delete Group'}
              onPress={handleDeleteGroup}
              variant="outline"
              fullWidth
              disabled={isDeleting || isSubmitting}
              textStyle={styles.dangerButtonText}
              style={styles.dangerButton}
            />
          </GlassCard>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country</Text>
                <Pressable onPress={() => {
                  setShowCountryModal(false);
                  setCountrySearchQuery('');
                }}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </Pressable>
              </View>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <GlassInput
                  placeholder="Search countries..."
                  value={countrySearchQuery}
                  onChangeText={setCountrySearchQuery}
                  style={styles.searchInput}
                  icon="search"
                />
              </View>
              <FlatList
                data={[{ code: 'global', name: 'Global' }, ...COUNTRIES].filter((country) =>
                  country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
                )}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.modalItem}
                    onPress={() => {
                      setCountry(item.code);
                      setShowCountryModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    {country === item.code && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Health Condition Modal */}
      <Modal
        visible={showHealthConditionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHealthConditionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Health Condition</Text>
                <Pressable onPress={() => setShowHealthConditionModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </Pressable>
              </View>
              <FlatList
                data={[{ label: 'None', value: null }, ...HEALTH_CONDITIONS.map((hc) => ({ label: hc, value: hc }))]}
                keyExtractor={(item) => item.value || 'none'}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.modalItem}
                    onPress={() => {
                      setHealthCondition(item.value);
                      setShowHealthConditionModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                    {healthCondition === item.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Cover Image Selection Modal */}
      <Modal
        visible={showCoverImageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCoverImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Banner</Text>
                <Pressable onPress={() => setShowCoverImageModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </Pressable>
              </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.white,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    opacity: 0.6,
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
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  descriptionInput: {
    minHeight: 100,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  switchLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  switchHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  selectButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  suggestedTag: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  suggestedTagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  submitButton: {
    marginTop: SPACING.md,
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
  dangerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  dangerDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  dangerButton: {
    borderColor: COLORS.error,
    marginTop: SPACING.sm,
  },
  dangerButtonText: {
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for better contrast
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '80%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background, // Solid background instead of glass effect
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    opacity: 1, // Ensure full opacity
  },
  modalCardContent: {
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchInput: {
    marginBottom: 0,
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
  },
  coverImageGradientList: {
    paddingTop: SPACING.sm,
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
    overflow: 'hidden',
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
