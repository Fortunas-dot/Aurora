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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { groupService } from '../src/services/group.service';
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
    try {
      const response = await groupService.createGroup(
        name.trim(),
        description.trim(),
        tags,
        isPrivate,
        country
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
                onPress={() => setShowCountryModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            {/* Countries List */}
            <FlatList
              data={COUNTRIES}
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
});






