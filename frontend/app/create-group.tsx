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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, GlassButton, TagChip, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { groupService } from '../src/services/group.service';
import { useAuthStore } from '../src/store/authStore';

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
      Alert.alert('Fout', 'Groepsnaam is verplicht');
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert('Fout', 'Groepsnaam moet minimaal 3 karakters bevatten');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await groupService.createGroup(
        name.trim(),
        description.trim(),
        tags,
        isPrivate
      );
      
      if (response.success && response.data) {
        router.back();
      } else {
        Alert.alert('Fout', response.message || 'Kon groep niet aanmaken');
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Fout', 'Er ging iets mis bij het aanmaken van de groep');
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
          <Text style={styles.headerTitle}>Nieuwe groep</Text>
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
            <Text style={styles.label}>Groepsnaam *</Text>
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder="Bijv. Angst & Paniek Support"
              style={styles.input}
              maxLength={100}
            />
          </GlassCard>

          {/* Description Input */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Beschrijving</Text>
            <GlassInput
              value={description}
              onChangeText={setDescription}
              placeholder="Beschrijf wat deze groep doet..."
              multiline
              numberOfLines={4}
              style={styles.input}
              inputStyle={styles.descriptionInput}
              maxLength={500}
            />
          </GlassCard>

          {/* Privacy Toggle */}
          <GlassCard style={styles.inputCard} padding="lg">
            <View style={styles.privacyRow}>
              <View style={styles.privacyInfo}>
                <Text style={styles.label}>Privé groep</Text>
                <Text style={styles.privacyDescription}>
                  Alleen leden kunnen de groep zien en posts bekijken
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
            <Text style={styles.label}>Tags (optioneel)</Text>
            <Text style={styles.sectionSubtitle}>
              Voeg tags toe om je groep beter vindbaar te maken
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
});






