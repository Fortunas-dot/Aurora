import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useSettingsStore, NotificationPreferences } from '../src/store/settingsStore';
import { useAuthStore } from '../src/store/authStore';
import { i18n, Language } from '../src/utils/i18n';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
}) => (
  <Pressable style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent && <View style={styles.menuRight}>{rightComponent}</View>}
    {showArrow && !rightComponent && (
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    )}
  </Pressable>
);

interface SwitchItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SwitchItem: React.FC<SwitchItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}) => (
  <View style={styles.menuItem}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: COLORS.glass.border, true: COLORS.primary }}
      thumbColor={COLORS.white}
    />
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const {
    language,
    theme,
    showEmail,
    isAnonymous,
    notificationPreferences,
    isLoading,
    isSaving,
    setLanguage,
    setTheme,
    setShowEmail,
    setIsAnonymous,
    setNotificationPreference,
    loadSettings,
    saveSettings,
  } = useSettingsStore();

  const [t, setT] = useState(() => i18n.getTranslations());

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated, loadSettings]);

  // Update translations when language changes
  useEffect(() => {
    setT(i18n.getTranslations());
  }, [language]);

  const handleLanguageChange = async (newLanguage: Language) => {
    await setLanguage(newLanguage);
    setT(i18n.getTranslations());
    Alert.alert(t.success, `Language changed to ${newLanguage === 'nl' ? 'Nederlands' : 'English'}`);
  };

  const handleSave = async () => {
    await saveSettings();
    Alert.alert(t.success, 'Settings saved successfully');
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.settings}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="settings-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.authPromptTitle}>Log in to access settings</Text>
          <GlassButton
            title={t.back}
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            style={styles.authButton}
          />
        </View>
      </LinearGradient>
    );
  }

  if (isLoading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient as readonly [string, string, string]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.settings}</Text>
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Text style={styles.saveButtonText}>{t.save}</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Settings */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{t.appSettings}</Text>
          <GlassCard padding={0}>
            <MenuItem
              icon="language-outline"
              title={t.language}
              subtitle={language === 'nl' ? 'Nederlands' : 'English'}
              onPress={() => {
                Alert.alert(
                  t.language,
                  'Choose language',
                  [
                    {
                      text: 'Nederlands',
                      onPress: () => handleLanguageChange('nl'),
                    },
                    {
                      text: 'English',
                      onPress: () => handleLanguageChange('en'),
                    },
                    { text: t.cancel, style: 'cancel' },
                  ]
                );
              }}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="color-palette-outline"
              title={t.theme}
              subtitle={
                theme === 'dark'
                  ? t.dark
                  : theme === 'light'
                  ? t.light
                  : t.system
              }
              onPress={() => {
                Alert.alert(
                  t.theme,
                  'Choose theme',
                  [
                    {
                      text: t.dark,
                      onPress: () => setTheme('dark'),
                    },
                    {
                      text: t.light,
                      onPress: () => setTheme('light'),
                    },
                    {
                      text: t.system,
                      onPress: () => setTheme('system'),
                    },
                    { text: t.cancel, style: 'cancel' },
                  ]
                );
              }}
            />
          </GlassCard>
        </View>

        {/* Privacy Settings */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{t.privacySettings}</Text>
          <GlassCard padding={0}>
            <SwitchItem
              icon="mail-outline"
              title={t.showEmail}
              subtitle={t.showEmailDesc}
              value={showEmail}
              onValueChange={setShowEmail}
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="eye-off-outline"
              title={t.isAnonymous}
              subtitle={t.isAnonymousDesc}
              value={isAnonymous}
              onValueChange={setIsAnonymous}
            />
          </GlassCard>
          
          {/* Account Data & Privacy */}
          <GlassCard padding={0} style={styles.menuCard}>
            <Text style={styles.subsectionTitle}>{t.accountData}</Text>
            <MenuItem
              icon="download-outline"
              title={t.exportData}
              subtitle={t.exportDataDesc}
              onPress={() => {
                Alert.alert(
                  t.exportData,
                  'This feature will be available soon. You will be able to download all your account data in a JSON format.',
                  [{ text: t.cancel, style: 'cancel' }]
                );
              }}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="trash-outline"
              title={t.deleteAccount}
              subtitle={t.deleteAccountDesc}
              onPress={() => {
                Alert.alert(
                  t.deleteAccount,
                  'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, posts, comments, and messages.',
                  [
                    { text: t.cancel, style: 'cancel' },
                    {
                      text: t.deleteAccount,
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert(
                          'Confirm Deletion',
                          'This will permanently delete your account. Type DELETE to confirm.',
                          [
                            { text: t.cancel, style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => {
                                // TODO: Implement account deletion
                                Alert.alert('Account deletion', 'Account deletion feature will be implemented soon.');
                              },
                            },
                          ]
                        );
                      },
                    },
                  ]
                );
              }}
            />
          </GlassCard>

          {/* Privacy Policy & Terms */}
          <GlassCard padding={0} style={styles.menuCard}>
            <MenuItem
              icon="document-text-outline"
              title={t.privacyPolicy}
              subtitle="Read our privacy policy"
              onPress={() => {
                Alert.alert(
                  t.privacyPolicy,
                  'Privacy policy will be available soon. This will contain information about how we collect, use, and protect your data.',
                  [{ text: t.cancel, style: 'cancel' }]
                );
              }}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-outline"
              title={t.termsOfService}
              subtitle="Read our terms of service"
              onPress={() => {
                Alert.alert(
                  t.termsOfService,
                  'Terms of service will be available soon. This will contain the terms and conditions for using Aurora.',
                  [{ text: t.cancel, style: 'cancel' }]
                );
              }}
            />
          </GlassCard>
        </View>

        {/* Notification Preferences */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{t.notificationSettings}</Text>
          <GlassCard padding={0}>
            <SwitchItem
              icon="notifications-outline"
              title={t.pushNotifications}
              subtitle={t.pushNotificationsDesc}
              value={notificationPreferences.pushEnabled}
              onValueChange={(value) =>
                setNotificationPreference('pushEnabled', value)
              }
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="mail-outline"
              title={t.emailNotifications}
              subtitle={t.emailNotificationsDesc}
              value={notificationPreferences.emailEnabled}
              onValueChange={(value) =>
                setNotificationPreference('emailEnabled', value)
              }
            />
            <View style={styles.menuDivider} />
            <Text style={styles.subsectionTitle}>Notification Types</Text>
            <SwitchItem
              icon="heart-outline"
              title={t.likes}
              value={notificationPreferences.likes}
              onValueChange={(value) =>
                setNotificationPreference('likes', value)
              }
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="chatbubble-outline"
              title={t.comments}
              value={notificationPreferences.comments}
              onValueChange={(value) =>
                setNotificationPreference('comments', value)
              }
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="mail-outline"
              title={t.messages}
              value={notificationPreferences.messages}
              onValueChange={(value) =>
                setNotificationPreference('messages', value)
              }
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="people-outline"
              title={t.follows}
              value={notificationPreferences.follows}
              onValueChange={(value) =>
                setNotificationPreference('follows', value)
              }
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="people-circle-outline"
              title={t.groups}
              value={notificationPreferences.groups}
              onValueChange={(value) =>
                setNotificationPreference('groups', value)
              }
            />
          </GlassCard>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  headerSpacer: {
    width: 40,
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuSectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuRight: {
    marginLeft: SPACING.sm,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.glass.border,
    marginLeft: SPACING.md + 40 + SPACING.md,
  },
  subsectionTitle: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  authPromptTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  authButton: {
    minWidth: 200,
  },
  menuCard: {
    marginTop: SPACING.md,
  },
});

