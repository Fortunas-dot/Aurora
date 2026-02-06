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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, GlassInput, GlassButton, Avatar, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { userService } from '../src/services/user.service';
import { uploadService } from '../src/services/upload.service';
import { useAuthStore } from '../src/store/authStore';
import { AVATAR_CHARACTERS } from '../src/utils/characters';
import { AVATAR_BACKGROUND_COLORS } from '../src/utils/avatarColors';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, setUser } = useAuthStore();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(user?.avatarCharacter || null);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState<string | null>(user?.avatarBackgroundColor || null);
  const [avatarMode, setAvatarMode] = useState<'photo' | 'character'>(user?.avatar ? 'photo' : 'character');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

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
        setSelectedCharacter(null); // Clear character when photo is selected
        setAvatarMode('photo');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  const handleSelectCharacter = (character: string) => {
    setSelectedCharacter(character);
    setAvatarUri(null); // Clear photo when character is selected
    setAvatarMode('character');
    // If no background color is selected yet, set a default one
    if (!selectedBackgroundColor) {
      // Use the first color as default, or keep existing if user has one
      if (!user?.avatarBackgroundColor) {
        setSelectedBackgroundColor(AVATAR_BACKGROUND_COLORS[0].value);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUri(null);
    setSelectedCharacter(null);
    setAvatarMode('character');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsUploadingAvatar(true);

    try {
      let avatarUrl = avatarUri;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== user?.avatar && !avatarUri.startsWith('http')) {
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

      // Determine avatar and character based on mode
      let finalAvatar: string | undefined = undefined;
      let finalCharacter: string | undefined = undefined;
      let finalBackgroundColor: string | undefined = undefined;

      if (avatarMode === 'photo' && avatarUrl) {
        finalAvatar = avatarUrl;
        finalCharacter = undefined; // Clear character when using photo
        finalBackgroundColor = undefined; // Clear background color when using photo
      } else if (avatarMode === 'character' && selectedCharacter) {
        finalAvatar = undefined; // Clear photo when using character
        finalCharacter = selectedCharacter;
        finalBackgroundColor = selectedBackgroundColor || undefined;
      } else if (!avatarUri && !selectedCharacter) {
        // If both are cleared, keep existing character and color
        finalCharacter = user?.avatarCharacter || undefined;
        finalBackgroundColor = user?.avatarBackgroundColor || undefined;
      }

      const response = await userService.updateProfile({
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: finalAvatar,
        avatarCharacter: finalCharacter,
        avatarBackgroundColor: finalBackgroundColor,
      });

      if (response.success && response.data) {
        setUser(response.data);
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Could not update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Something went wrong while updating your profile');
    } finally {
      setIsSubmitting(false);
      setIsUploadingAvatar(false);
    }
  };

  if (!isAuthenticated || !user) {
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable
            style={[styles.headerIconButton, isSubmitting && styles.headerIconButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
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
          {/* Avatar Section */}
          <GlassCard style={styles.avatarCard} padding="lg">
            <Text style={styles.label}>Profile Avatar</Text>
            <View style={styles.avatarSection}>
              <Avatar
                uri={avatarUri || undefined}
                name={username || user.username}
                userId={user._id}
                avatarCharacter={selectedCharacter || undefined}
                avatarBackgroundColor={selectedBackgroundColor || undefined}
                size="xl"
              />
              
              {/* Mode Selection */}
              <View style={styles.modeSelector}>
                <Pressable
                  style={[styles.modeButton, avatarMode === 'photo' && styles.modeButtonActive]}
                  onPress={() => setAvatarMode('photo')}
                >
                  <Ionicons 
                    name="camera" 
                    size={20} 
                    color={avatarMode === 'photo' ? COLORS.primary : COLORS.textMuted} 
                  />
                  <Text 
                    style={[
                      styles.modeButtonText,
                      avatarMode === 'photo' && styles.modeButtonTextActive
                    ]}
                    numberOfLines={1}
                  >
                    Photo
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modeButton, avatarMode === 'character' && styles.modeButtonActive]}
                  onPress={() => setAvatarMode('character')}
                >
                  <Ionicons 
                    name="happy" 
                    size={20} 
                    color={avatarMode === 'character' ? COLORS.primary : COLORS.textMuted} 
                  />
                  <Text 
                    style={[
                      styles.modeButtonText,
                      avatarMode === 'character' && styles.modeButtonTextActive
                    ]}
                    numberOfLines={1}
                  >
                    Character
                  </Text>
                </Pressable>
              </View>

              {/* Photo Upload */}
              {avatarMode === 'photo' && (
                <View style={styles.avatarActions}>
                  <Pressable
                    style={styles.changeAvatarButton}
                    onPress={handlePickAvatar}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Ionicons name="camera" size={20} color={COLORS.primary} />
                        <Text style={styles.changeAvatarText}>
                          {avatarUri ? 'Change Photo' : 'Upload Photo'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                  {avatarUri && (
                    <Pressable
                      style={[styles.changeAvatarButton, styles.removeButton]}
                      onPress={handleRemoveAvatar}
                    >
                      <Ionicons name="trash" size={20} color={COLORS.error} />
                      <Text style={[styles.changeAvatarText, styles.removeButtonText]}>
                        Remove
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Character Selection */}
              {avatarMode === 'character' && (
                <View style={styles.characterSelector}>
                  <Text style={styles.characterSelectorLabel}>Choose a character:</Text>
                  <View style={styles.characterGrid}>
                    {AVATAR_CHARACTERS.map((char, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.characterOption,
                          selectedCharacter === char && styles.characterOptionSelected,
                        ]}
                        onPress={() => handleSelectCharacter(char)}
                      >
                        <Text style={styles.characterEmoji}>{char}</Text>
                      </Pressable>
                    ))}
                  </View>
                  
                  <Text style={[styles.characterSelectorLabel, { marginTop: SPACING.lg }]}>
                    Choose a background color:
                  </Text>
                  <View style={styles.colorGrid}>
                    {AVATAR_BACKGROUND_COLORS.map((color, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.colorOption,
                          {
                            backgroundColor: color.value,
                            borderColor: selectedBackgroundColor === color.value 
                              ? COLORS.primary 
                              : COLORS.glass.border,
                            borderWidth: selectedBackgroundColor === color.value ? 3 : 2,
                          },
                          selectedBackgroundColor === color.value && styles.colorOptionSelected,
                        ]}
                        onPress={() => setSelectedBackgroundColor(color.value)}
                      >
                        {selectedBackgroundColor === color.value && (
                          <Ionicons name="checkmark" size={20} color={COLORS.white} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                  {!selectedCharacter && (
                    <Text style={styles.hintText}>
                      Select a character first to see the background color preview
                    </Text>
                  )}
                </View>
              )}
            </View>
          </GlassCard>

          {/* Username */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Username</Text>
            <GlassInput
              value={username}
              onChangeText={setUsername}
              placeholder={user.username}
              style={styles.input}
              maxLength={30}
            />
            <Text style={styles.hintText}>
              Username can only be changed once every 30 days
            </Text>
          </GlassCard>

          {/* Bio */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Bio</Text>
            <GlassInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              style={styles.input}
              inputStyle={styles.bioInput}
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length} / 500</Text>
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
  avatarCard: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  changeAvatarText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  inputCard: {
    marginBottom: SPACING.md,
  },
  input: {
    marginTop: 0,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    width: '100%',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    minWidth: 100,
    flexShrink: 0,
  },
  modeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.glass.background,
  },
  modeButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  modeButtonTextActive: {
    color: COLORS.primary,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    width: '100%',
  },
  removeButton: {
    borderColor: COLORS.error,
  },
  removeButtonText: {
    color: COLORS.error,
  },
  characterSelector: {
    width: '100%',
    marginTop: SPACING.md,
  },
  characterSelectorLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  characterOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.glass.background,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.glass.background,
    transform: [{ scale: 1.1 }],
  },
  characterEmoji: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  colorOptionSelected: {
    transform: [{ scale: 1.1 }],
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});







