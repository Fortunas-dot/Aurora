import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, LoadingSpinner, Avatar } from '../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore, NotificationPreferences } from '../src/store/settingsStore';
import { useAuthStore } from '../src/store/authStore';
import { useConsentStore } from '../src/store/consentStore';
import { userService, UserProfile } from '../src/services/user.service';
import { i18n, Language } from '../src/utils/i18n';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = React.memo(({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
}) => {
  const { colors } = useTheme();
  return (
    <Pressable style={[styles.menuItem, { borderBottomColor: colors.glass.border }]} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: colors.glass.backgroundLight }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.menuRight}>{rightComponent}</View>}
      {showArrow && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );
});

interface SwitchItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SwitchItem: React.FC<SwitchItemProps> = React.memo(({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.menuItem, { borderBottomColor: colors.glass.border }]}>
      <View style={[styles.menuIconContainer, { backgroundColor: colors.glass.backgroundLight }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.glass.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
});

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const {
    auroraStyle,
    notificationPreferences,
    isLoading,
    setAuroraStyle,
    setNotificationPreference,
    loadSettings,
  } = useSettingsStore();

  const [t, setT] = useState(() => i18n.getTranslations());
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [showAiInfoModal, setShowAiInfoModal] = useState(false);
  const { aiConsentStatus, loadConsent, grantAiConsent, denyAiConsent, resetConsent } = useConsentStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
      loadBlockedUsers();
      loadConsent();
    }
  }, [isAuthenticated, loadSettings, loadConsent]);

  const loadBlockedUsers = async () => {
    setIsLoadingBlocked(true);
    try {
      const response = await userService.getBlockedUsers();
      if (response.success && response.data) {
        setBlockedUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          style: 'default',
          onPress: async () => {
            try {
              const response = await userService.blockUser(userId);
              if (response.success) {
                // Remove from list
                setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
                Alert.alert('Success', 'User unblocked successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to unblock user');
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Initialize translations (app is always in English)
  useEffect(() => {
    setT(i18n.getTranslations());
  }, []);

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
          <Pressable style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="settings-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authPromptTitle, { color: colors.text }]}>Log in to access settings</Text>
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
      <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.loading}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
        <Pressable style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        decelerationRate="normal"
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Settings */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t.appSettings}</Text>
          <GlassCard padding={0}>
            <MenuItem
              icon="sparkles-outline"
              title="Aurora Style"
              subtitle={
                auroraStyle === 'organic' ? 'Organic & Alive' :
                auroraStyle === 'classic' ? 'Classic Sphere' :
                'Organic Blobs'
              }
              onPress={() => router.push('/aurora-style')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="school-outline"
              title="View Onboarding"
              subtitle="Learn about Aurora's features"
              onPress={() => router.push('/onboarding')}
            />
          </GlassCard>
        </View>

        {/* AI Data Sharing */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>AI Data Sharing</Text>
          <GlassCard padding={0}>
            <View style={styles.aiConsentContainer}>
              <View style={styles.aiConsentHeader}>
                <View style={[styles.menuIconContainer, { backgroundColor: colors.glass.backgroundLight }]}>
                  <Ionicons name="sparkles" size={22} color={colors.primary} />
                </View>
                <View style={styles.aiConsentInfo}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>AI Features</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                    {aiConsentStatus === 'granted' 
                      ? 'Data shared with OpenAI' 
                      : 'AI features disabled'}
                  </Text>
                </View>
                <View style={[
                  styles.aiStatusBadge, 
                  { backgroundColor: aiConsentStatus === 'granted' ? colors.success + '20' : colors.glass.backgroundLight }
                ]}>
                  <Text style={[
                    styles.aiStatusText, 
                    { color: aiConsentStatus === 'granted' ? colors.success : colors.textMuted }
                  ]}>
                    {aiConsentStatus === 'granted' ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <View style={styles.aiConsentActions}>
                <Pressable
                  style={[styles.aiLearnMoreButton, { borderColor: colors.glass.border }]}
                  onPress={() => setShowAiInfoModal(true)}
                >
                  <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                  <Text style={[styles.aiLearnMoreText, { color: colors.primary }]}>
                    Learn More
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.aiConsentButton,
                    { 
                      backgroundColor: aiConsentStatus === 'granted' ? colors.error + '20' : colors.primary + '20',
                      borderColor: aiConsentStatus === 'granted' ? colors.error : colors.primary,
                    }
                  ]}
                  onPress={() => {
                    if (aiConsentStatus === 'granted') {
                      Alert.alert(
                        'Disable AI Features?',
                        'This will stop sharing your data with OpenAI. AI chat, voice therapy, and journal insights will be disabled.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Disable', 
                            style: 'destructive',
                            onPress: () => resetConsent()
                          },
                        ]
                      );
                    } else {
                      router.push('/text-chat'); // This will show the consent card
                    }
                  }}
                >
                  <Ionicons 
                    name={aiConsentStatus === 'granted' ? 'close-circle' : 'checkmark-circle'} 
                    size={18} 
                    color={aiConsentStatus === 'granted' ? colors.error : colors.primary} 
                  />
                  <Text style={[
                    styles.aiConsentButtonText,
                    { color: aiConsentStatus === 'granted' ? colors.error : colors.primary }
                  ]}>
                    {aiConsentStatus === 'granted' ? 'Revoke' : 'Enable'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* AI Info Modal */}
        <Modal
          visible={showAiInfoModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAiInfoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.backgroundDark, paddingTop: insets.top }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>AI Data Sharing</Text>
                <Pressable style={styles.modalCloseButton} onPress={() => setShowAiInfoModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              
              <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
                {/* What Data */}
                <View style={styles.infoSection}>
                  <View style={styles.infoSectionHeader}>
                    <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoSectionTitle, { color: colors.text }]}>What data is shared?</Text>
                  </View>
                  <View style={styles.infoList}>
                    <View style={styles.infoListItem}>
                      <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        Text you type in AI chat conversations
                      </Text>
                    </View>
                    <View style={styles.infoListItem}>
                      <Ionicons name="book" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        Journal entries (for AI-generated prompts and insights)
                      </Text>
                    </View>
                    <View style={styles.infoListItem}>
                      <Ionicons name="mic" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        Voice recordings and transcripts (for voice therapy)
                      </Text>
                    </View>
                    <View style={styles.infoListItem}>
                      <Ionicons name="heart" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        Health information from your profile (if applicable)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Who Receives */}
                <View style={styles.infoSection}>
                  <View style={styles.infoSectionHeader}>
                    <Ionicons name="business-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Who receives this data?</Text>
                  </View>
                  <GlassCard style={styles.recipientCard} padding="md">
                    <Text style={[styles.recipientName, { color: colors.text }]}>OpenAI</Text>
                    <Text style={[styles.recipientDesc, { color: colors.textSecondary }]}>
                      Our AI technology provider. OpenAI processes your data to generate supportive responses and insights.
                    </Text>
                    <Text style={[styles.recipientHighlight, { color: colors.success }]}>
                      ✓ OpenAI does NOT use your data to train their AI models
                    </Text>
                    <Pressable 
                      style={styles.externalLink}
                      onPress={() => Linking.openURL('https://openai.com/privacy')}
                    >
                      <Text style={[styles.externalLinkText, { color: colors.primary }]}>
                        View OpenAI's Privacy Policy
                      </Text>
                      <Ionicons name="open-outline" size={16} color={colors.primary} />
                    </Pressable>
                  </GlassCard>
                </View>

                {/* Data Protection */}
                <View style={styles.infoSection}>
                  <View style={styles.infoSectionHeader}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoSectionTitle, { color: colors.text }]}>How is your data protected?</Text>
                  </View>
                  <View style={styles.protectionList}>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        Encrypted in transit and at rest
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        OpenAI is contractually obligated to protect your data
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        NOT used for advertising
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        NOT sold to third parties
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        You can revoke consent anytime in Settings
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Privacy Policy Link */}
                <Pressable 
                  style={[styles.privacyPolicyButton, { borderColor: colors.glass.border }]}
                  onPress={() => {
                    setShowAiInfoModal(false);
                    router.push('/privacy-policy');
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                  <Text style={[styles.privacyPolicyText, { color: colors.primary }]}>
                    Read our full Privacy Policy
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </Pressable>

                {/* Optional Note */}
                <Text style={[styles.optionalNote, { color: colors.textMuted }]}>
                  AI features are optional. You can use Aurora's community, journaling, and other features without enabling AI.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Privacy Settings */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t.privacySettings}</Text>
          
          {/* Account Data & Privacy */}
          <GlassCard padding={0} style={styles.menuCard}>
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>{t.accountData}</Text>
            <MenuItem
              icon="trash-outline"
              title="Delete account and all data"
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
                              onPress: async () => {
                                try {
                                  const response = await userService.deleteAccount();
                                  
                                  if (response.success) {
                                    Alert.alert(
                                      'Account Deleted',
                                      'Your account and all associated data have been permanently deleted.',
                                      [
                                        {
                                          text: 'OK',
                                          onPress: () => {
                                            useAuthStore.getState().logout();
                                            router.replace('/(auth)/login');
                                          },
                                        },
                                      ]
                                    );
                                  } else {
                                    Alert.alert('Error', response.message || 'Failed to delete account');
                                  }
                                } catch (error: any) {
                                  Alert.alert('Error', error.message || 'Failed to delete account');
                                }
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
              onPress={() => router.push('/privacy-policy')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-outline"
              title={t.termsOfService}
              subtitle="Read our terms of service"
              onPress={() => router.push('/terms-of-service')}
            />
          </GlassCard>
        </View>

        {/* Notification Preferences */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t.notificationSettings}</Text>
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
          </GlassCard>
        </View>

        {/* Blocked Users */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Blocked Users</Text>
          <GlassCard padding={0}>
            {isLoadingBlocked ? (
              <View style={styles.blockedLoadingContainer}>
                <LoadingSpinner size="sm" />
              </View>
            ) : blockedUsers.length === 0 ? (
              <View style={styles.blockedEmptyContainer}>
                <Ionicons name="ban-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.blockedEmptyText, { color: colors.textMuted }]}>
                  No blocked users
                </Text>
              </View>
            ) : (
              blockedUsers.map((blockedUser, index) => (
                <React.Fragment key={blockedUser._id}>
                  <Pressable
                    style={styles.blockedUserItem}
                    onPress={() => router.push(`/user/${blockedUser._id}`)}
                  >
                    <Avatar
                      uri={blockedUser.avatar}
                      name={blockedUser.displayName || blockedUser.username}
                      userId={blockedUser._id}
                      avatarCharacter={blockedUser.avatarCharacter}
                      avatarBackgroundColor={blockedUser.avatarBackgroundColor}
                      size="md"
                    />
                    <View style={styles.blockedUserInfo}>
                      <Text style={[styles.blockedUserName, { color: colors.text }]}>
                        {blockedUser.displayName || blockedUser.username}
                      </Text>
                      <Text style={[styles.blockedUserUsername, { color: colors.textMuted }]}>
                        @{blockedUser.username}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.unblockButton, { backgroundColor: colors.glass.backgroundLight, borderColor: colors.glass.border }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleUnblock(blockedUser._id, blockedUser.displayName || blockedUser.username);
                      }}
                    >
                      <Ionicons name="ban" size={16} color={colors.error} />
                      <Text style={[styles.unblockButtonText, { color: colors.error }]}>
                        Unblock
                      </Text>
                    </Pressable>
                  </Pressable>
                  {index < blockedUsers.length - 1 && (
                    <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
                  )}
                </React.Fragment>
              ))
            )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  headerSpacer: {
    width: 40,
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
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodyMedium,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  menuRight: {
    marginLeft: SPACING.sm,
  },
  menuDivider: {
    height: 1,
    marginLeft: SPACING.md + 40 + SPACING.md,
  },
  subsectionTitle: {
    ...TYPOGRAPHY.captionMedium,
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
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  authButton: {
    minWidth: 200,
  },
  menuCard: {
    marginTop: SPACING.md,
  },
  blockedLoadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  blockedEmptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  blockedEmptyText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
  },
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  blockedUserInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  blockedUserName: {
    ...TYPOGRAPHY.bodyMedium,
  },
  blockedUserUsername: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  unblockButtonText: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
  },
  aiConsentContainer: {
    padding: SPACING.md,
  },
  aiConsentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiConsentInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  aiStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  aiStatusText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  aiConsentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginLeft: 40 + SPACING.md,
  },
  aiLearnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  aiLearnMoreText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '500',
  },
  aiConsentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  aiConsentButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalHeaderLeft: {
    width: 40,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  infoSection: {
    marginBottom: SPACING.xl,
  },
  infoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoSectionTitle: {
    ...TYPOGRAPHY.h4,
    flex: 1,
  },
  infoList: {
    gap: SPACING.sm,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  infoListText: {
    ...TYPOGRAPHY.body,
    flex: 1,
    lineHeight: 22,
  },
  recipientCard: {
    marginTop: SPACING.xs,
  },
  recipientName: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.xs,
  },
  recipientDesc: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  recipientHighlight: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  externalLinkText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '500',
  },
  protectionList: {
    gap: SPACING.sm,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  protectionText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  privacyPolicyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  privacyPolicyText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  optionalNote: {
    ...TYPOGRAPHY.small,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});

