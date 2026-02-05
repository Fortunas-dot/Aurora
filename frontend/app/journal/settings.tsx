import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, LoadingSpinner } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, Journal } from '../../src/services/journal.service';
import { uploadService } from '../../src/services/upload.service';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function JournalSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ journalId: string }>();
  const insets = useSafeAreaInsets();
  const { language } = useSettingsStore();

  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (params.journalId) {
      loadJournal();
    }
  }, [params.journalId]);

  const loadJournal = async () => {
    try {
      setLoading(true);
      const response = await journalService.getJournal(params.journalId!);
      if (response.success && response.data) {
        const journalData = response.data;
        setJournal(journalData);
        setName(journalData.name);
        setDescription(journalData.description || '');
        setIsPublic(journalData.isPublic);
        setCoverImageUrl(journalData.coverImage || null);
      } else {
        Alert.alert(
          language === 'nl' ? 'Fout' : 'Error',
          language === 'nl' ? 'Kon dagboek niet laden' : 'Could not load journal'
        );
        router.back();
      }
    } catch (error) {
      console.error('Error loading journal:', error);
      Alert.alert(
        language === 'nl' ? 'Fout' : 'Error',
        language === 'nl' ? 'Er is iets misgegaan' : 'Something went wrong'
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePickCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'nl' ? 'Toegang geweigerd' : 'Permission Denied',
          language === 'nl' 
            ? 'We hebben toegang tot je foto\'s nodig om een omslagfoto te selecteren.'
            : 'We need access to your photos to select a cover image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        language === 'nl' ? 'Fout' : 'Error',
        language === 'nl' ? 'Kon afbeelding niet selecteren' : 'Could not select image'
      );
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImageUri(null);
    setCoverImageUrl(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        language === 'nl' ? 'Fout' : 'Error',
        language === 'nl' ? 'Voer een naam in voor je dagboek' : 'Please enter a name for your journal'
      );
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert(
        language === 'nl' ? 'Fout' : 'Error',
        language === 'nl' ? 'Naam moet minimaal 3 tekens zijn' : 'Name must be at least 3 characters'
      );
      return;
    }

    setSaving(true);
    setUploading(true);

    try {
      let finalCoverImageUrl: string | undefined = coverImageUrl || undefined;

      // Upload new cover image if selected
      if (coverImageUri) {
        const uploadResult = await uploadService.uploadImage(coverImageUri);
        if (uploadResult.success && uploadResult.data) {
          finalCoverImageUrl = uploadResult.data.url;
        }
      }

      const updateData: Partial<Journal> = {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        coverImage: finalCoverImageUrl,
      };

      const response = await journalService.updateJournal(params.journalId!, updateData);

      if (response.success) {
        // Refresh the journal data
        await loadJournal();
        Alert.alert(
          language === 'nl' ? 'Succes' : 'Success',
          language === 'nl' ? 'Dagboek bijgewerkt' : 'Journal updated successfully',
          [
            {
              text: language === 'nl' ? 'OK' : 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          language === 'nl' ? 'Fout' : 'Error',
          response.message || (language === 'nl' ? 'Kon dagboek niet bijwerken' : 'Could not update journal')
        );
      }
    } catch (error: any) {
      console.error('Error updating journal:', error);
      Alert.alert(
        language === 'nl' ? 'Fout' : 'Error',
        error?.message || (language === 'nl' ? 'Er is iets misgegaan' : 'Something went wrong')
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      language === 'nl' ? 'Dagboek verwijderen' : 'Delete Journal',
      language === 'nl'
        ? 'Weet je zeker dat je dit dagboek wilt verwijderen? Alle entries worden ook verwijderd. Deze actie kan niet ongedaan worden gemaakt.'
        : 'Are you sure you want to delete this journal? All entries will also be deleted. This action cannot be undone.',
      [
        {
          text: language === 'nl' ? 'Annuleren' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'nl' ? 'Verwijderen' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await journalService.deleteJournal(params.journalId!);
              if (response.success) {
                Alert.alert(
                  language === 'nl' ? 'Verwijderd' : 'Deleted',
                  language === 'nl' ? 'Dagboek verwijderd' : 'Journal deleted successfully',
                  [
                    {
                      text: language === 'nl' ? 'OK' : 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert(
                  language === 'nl' ? 'Fout' : 'Error',
                  response.message || (language === 'nl' ? 'Kon dagboek niet verwijderen' : 'Could not delete journal')
                );
              }
            } catch (error) {
              console.error('Error deleting journal:', error);
              Alert.alert(
                language === 'nl' ? 'Fout' : 'Error',
                language === 'nl' ? 'Er is iets misgegaan' : 'Something went wrong'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {language === 'nl' ? 'Instellingen' : 'Settings'}
          </Text>
          <View style={styles.headerRight} />
        </View>
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
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {language === 'nl' ? 'Instellingen' : 'Settings'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'nl' ? 'Omslagfoto' : 'Cover Image'}
            </Text>
            <GlassCard style={styles.coverImageCard} padding="md">
              {coverImageUri || coverImageUrl ? (
                <View style={styles.coverImageContainer}>
                  <Image
                    source={{ uri: coverImageUri || coverImageUrl || '' }}
                    style={styles.coverImage}
                  />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={handleRemoveCoverImage}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.addImageButton}
                  onPress={handlePickCoverImage}
                >
                  <Ionicons name="image-outline" size={32} color={COLORS.primary} />
                  <Text style={styles.addImageText}>
                    {language === 'nl' ? 'Voeg omslagfoto toe' : 'Add cover image'}
                  </Text>
                </Pressable>
              )}
              {!coverImageUri && !coverImageUrl && (
                <Pressable
                  style={styles.changeImageButton}
                  onPress={handlePickCoverImage}
                >
                  <Text style={styles.changeImageText}>
                    {language === 'nl' ? 'Selecteer afbeelding' : 'Select image'}
                  </Text>
                </Pressable>
              )}
            </GlassCard>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'nl' ? 'Naam' : 'Name'}
            </Text>
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder={language === 'nl' ? 'Dagboek naam' : 'Journal name'}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'nl' ? 'Beschrijving' : 'Description'}
            </Text>
            <GlassCard style={styles.descriptionCard} padding="md">
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder={
                  language === 'nl'
                    ? 'Beschrijf je dagboek (optioneel)'
                    : 'Describe your journal (optional)'
                }
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {description.length}/500
              </Text>
            </GlassCard>
          </View>

          {/* Privacy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'nl' ? 'Privacy' : 'Privacy'}
            </Text>
            <GlassCard style={styles.privacyCard} padding="md">
              <View style={styles.privacyRow}>
                <View style={styles.privacyInfo}>
                  <Ionicons
                    name={isPublic ? 'globe' : 'lock-closed'}
                    size={24}
                    color={isPublic ? COLORS.primary : COLORS.textMuted}
                  />
                  <View style={styles.privacyTextContainer}>
                    <Text style={styles.privacyTitle}>
                      {isPublic
                        ? language === 'nl'
                          ? 'Openbaar'
                          : 'Public'
                        : language === 'nl'
                        ? 'Privé'
                        : 'Private'}
                    </Text>
                    <Text style={styles.privacyDescription}>
                      {isPublic
                        ? language === 'nl'
                          ? 'Iedereen kan dit dagboek zien en volgen'
                          : 'Anyone can view and follow this journal'
                        : language === 'nl'
                        ? 'Alleen jij kunt dit dagboek zien'
                        : 'Only you can view this journal'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{
                    false: COLORS.glass.border,
                    true: COLORS.primary + '40',
                  }}
                  thumbColor={isPublic ? COLORS.primary : COLORS.textMuted}
                />
              </View>
            </GlassCard>
          </View>

          {/* Journal Info */}
          {journal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'nl' ? 'Informatie' : 'Information'}
              </Text>
              <GlassCard style={styles.infoCard} padding="md">
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {language === 'nl' ? 'Entries' : 'Entries'}
                  </Text>
                  <Text style={styles.infoValue}>
                    {journal.entriesCount || 0}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {language === 'nl' ? 'Volgers' : 'Followers'}
                  </Text>
                  <Text style={styles.infoValue}>
                    {journal.followersCount || 0}
                  </Text>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Save Button */}
          <View style={styles.section}>
            <GlassButton
              title={
                saving
                  ? language === 'nl'
                    ? 'Opslaan...'
                    : 'Saving...'
                  : language === 'nl'
                  ? 'Opslaan'
                  : 'Save'
              }
              onPress={handleSave}
              disabled={saving || uploading}
              loading={saving || uploading}
            />
          </View>

          {/* Delete Button */}
          <View style={styles.section}>
            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={saving}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>
                {language === 'nl' ? 'Dagboek verwijderen' : 'Delete Journal'}
              </Text>
            </Pressable>
          </View>
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerRight: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  coverImageCard: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.glass.background,
    borderRadius: 20,
    padding: SPACING.xs,
  },
  addImageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  addImageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  changeImageButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    alignSelf: 'center',
  },
  changeImageText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  descriptionCard: {
    minHeight: 120,
  },
  descriptionInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  privacyCard: {
    paddingVertical: SPACING.md,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  privacyTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  privacyTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  privacyDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  infoCard: {
    paddingVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  infoLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    gap: SPACING.sm,
  },
  deleteButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.error,
    fontWeight: '600',
  },
});
