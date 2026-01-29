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
  Switch,
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

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isAnonymous, setIsAnonymous] = useState(user?.isAnonymous || false);
  const [showEmail, setShowEmail] = useState(user?.showEmail || false);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
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
      Alert.alert('Toestemming nodig', 'We hebben toegang nodig tot je foto\'s');
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
      Alert.alert('Fout', 'Kon afbeelding niet selecteren');
    }
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
          Alert.alert('Fout', 'Kon avatar niet uploaden');
          setIsSubmitting(false);
          setIsUploadingAvatar(false);
          return;
        }
      }

      const response = await userService.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatarUrl || undefined,
        isAnonymous,
        showEmail,
      });

      if (response.success && response.data) {
        setUser(response.data);
        router.back();
      } else {
        Alert.alert('Fout', response.message || 'Kon profiel niet bijwerken');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Fout', 'Er ging iets mis bij het bijwerken van je profiel');
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
          <Text style={styles.headerTitle}>Bewerk profiel</Text>
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
            <Text style={styles.label}>Profielfoto</Text>
            <View style={styles.avatarSection}>
              <Avatar
                uri={avatarUri || undefined}
                name={displayName || user.username}
                size="xl"
              />
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
                    <Text style={styles.changeAvatarText}>Wijzigen</Text>
                  </>
                )}
              </Pressable>
            </View>
          </GlassCard>

          {/* Display Name */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Weergavenaam</Text>
            <GlassInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={user.username}
              style={styles.input}
              maxLength={50}
            />
          </GlassCard>

          {/* Bio */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Bio</Text>
            <GlassInput
              value={bio}
              onChangeText={setBio}
              placeholder="Vertel iets over jezelf..."
              multiline
              numberOfLines={4}
              style={styles.input}
              inputStyle={styles.bioInput}
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length} / 500</Text>
          </GlassCard>

          {/* Privacy Settings */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.sectionTitle}>Privacy instellingen</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Anoniem profiel</Text>
                <Text style={styles.settingDescription}>
                  Je gebruikersnaam wordt verborgen voor anderen
                </Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: COLORS.glass.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>E-mailadres tonen</Text>
                <Text style={styles.settingDescription}>
                  Laat anderen je e-mailadres zien op je profiel
                </Text>
              </View>
              <Switch
                value={showEmail}
                onValueChange={setShowEmail}
                trackColor={{ false: COLORS.glass.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
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
  avatarCard: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
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
  sectionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.glass.border,
    marginVertical: SPACING.sm,
  },
});





