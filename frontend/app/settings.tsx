import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  AppState,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, LoadingSpinner, Avatar } from '../src/components/common';
import { LanguagePickerSheet } from '../src/components/common/LanguagePickerSheet';
import { APP_LANGUAGES } from '../src/utils/i18n';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useTranslation } from '../src/hooks/useTranslation';
import { useSettingsStore, NotificationPreferences } from '../src/store/settingsStore';
import { LOGIN_VARIANT_TITLE_KEY } from '../src/constants/loginScreenVariant';
import { useAuthStore } from '../src/store/authStore';
import { useConsentStore } from '../src/store/consentStore';
import { userService, UserProfile } from '../src/services/user.service';
import { authService } from '../src/services/auth.service';
import { getUsernameColor } from '../src/utils/usernameColors';

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
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { colors } = useTheme();
  const {
    auroraStyle,
    notificationPreferences,
    isLoading,
    setAuroraStyle,
    setNotificationPreference,
    loadSettings,
    language,
    loginScreenVariant,
  } = useSettingsStore();

  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [showAiInfoModal, setShowAiInfoModal] = useState(false);
  const { aiConsentStatus, loadConsent, grantAiConsent, denyAiConsent, resetConsent } = useConsentStore();
  const [isSendingEmailVerification, setIsSendingEmailVerification] = useState(false);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);

  const currentLanguageMeta = useMemo(
    () => APP_LANGUAGES.find((l) => l.code === language) ?? APP_LANGUAGES[0],
    [language]
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
      loadBlockedUsers();
      loadConsent();
    }
  }, [isAuthenticated, loadSettings, loadConsent]);

  // Refresh emailVerified from the server when the user returns to this screen
  // (e.g. after clicking the verification link in their email and coming back).
  const emailVerifiedRef = useRef(user?.emailVerified);
  emailVerifiedRef.current = user?.emailVerified;

  useFocusEffect(
    useCallback(() => {
      if (!emailVerifiedRef.current) {
        authService.getMe().then((response) => {
          if (response.success && response.data?.emailVerified) {
            updateUser({ emailVerified: true });
          }
        }).catch(() => { /* silently ignore */ });
      }

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active' && !emailVerifiedRef.current) {
          authService.getMe().then((response) => {
            if (response.success && response.data?.emailVerified) {
              updateUser({ emailVerified: true });
            }
          }).catch(() => { /* silently ignore */ });
        }
      });

      return () => subscription.remove();
    }, [updateUser])
  );

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

  const handleSendEmailVerification = async () => {
    if (!user?.email) {
      Alert.alert(t('email_required_title'), t('email_required_body'));
      return;
    }

    setIsSendingEmailVerification(true);
    try {
      const response = await authService.sendVerificationEmail(user.email);
      if (response.success) {
        Alert.alert(t('verification_email_sent_title'), t('verification_email_sent_body'));
      } else {
        Alert.alert(t('error'), response.message || t('could_not_send_verification'));
      }
    } catch (error: any) {
      Alert.alert(t('error'), error?.message || t('could_not_send_verification'));
    } finally {
      setIsSendingEmailVerification(false);
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    Alert.alert(
      t('unblock_user_title'),
      t('unblock_confirm', { name: username }),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('unblock'),
          style: 'default',
          onPress: async () => {
            try {
              const response = await userService.blockUser(userId);
              if (response.success) {
                // Remove from list
                setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
                Alert.alert(t('success'), t('user_unblocked'));
              } else {
                Alert.alert(t('error'), response.message || t('unblock_failed'));
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert(t('error'), t('unblock_failed_retry'));
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={colors.backgroundGradient as readonly [string, string, string]} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
          <Pressable style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="settings-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authPromptTitle, { color: colors.text }]}>{t('auth_prompt_settings')}</Text>
          <GlassButton
            title={t('back')}
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
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
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
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t('appSettings')}</Text>
          <GlassCard padding={0}>
            {/*
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
            */}
            <MenuItem
              icon="globe-outline"
              title={t('language')}
              subtitle={currentLanguageMeta.nativeLabel}
              onPress={() => setLanguagePickerVisible(true)}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <MenuItem
              icon="school-outline"
              title={t('view_onboarding')}
              subtitle={t('view_onboarding_sub')}
              onPress={() => router.push('/onboarding')}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <MenuItem
              icon="color-wand-outline"
              title={t('settings_login_styles')}
              subtitle={t('settings_login_styles_menu_sub', {
                layout: t(LOGIN_VARIANT_TITLE_KEY[loginScreenVariant]),
              })}
              onPress={() => router.push('/login-style-showcase')}
            />
            {/*
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <MenuItem
              icon="cube-outline"
              title="Pixel Room"
              subtitle="The Lounge (multiplayer)"
              onPress={() => router.push('/pixel-room')}
            />
            */}
          </GlassCard>
        </View>

        {/* AI Data Sharing */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t('ai_data_sharing')}</Text>
          <GlassCard padding={0}>
            <View style={styles.aiConsentContainer}>
              <View style={styles.aiConsentHeader}>
                <View style={[styles.menuIconContainer, { backgroundColor: colors.glass.backgroundLight }]}>
                  <Ionicons name="sparkles" size={22} color={colors.primary} />
                </View>
                <View style={styles.aiConsentInfo}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('ai_features')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                    {aiConsentStatus === 'granted' 
                      ? t('ai_data_shared_llm') 
                      : t('ai_features_disabled')}
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
                    {aiConsentStatus === 'granted' ? t('enabled') : t('disabled')}
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
                    {t('learnMore')}
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
                        t('disable_ai_title'),
                        t('disable_ai_message'),
                        [
                          { text: t('cancel'), style: 'cancel' },
                          { 
                            text: t('disable'), 
                            style: 'destructive',
                            onPress: () => resetConsent()
                          },
                        ]
                      );
                    } else {
                      // Go to chat; consent form will always appear there until user allows.
                      router.push('/text-chat');
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
                    {aiConsentStatus === 'granted' ? t('revoke') : t('enable')}
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
            <View style={[styles.modalContent, { backgroundColor: colors.glass.backgroundDark, paddingTop: insets.top }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('ai_data_modal_title')}</Text>
                <Pressable style={styles.modalCloseButton} onPress={() => setShowAiInfoModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              
              <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
                {/* What Data */}
                <View style={styles.infoSection}>
                  <View style={styles.infoSectionHeader}>
                    <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoSectionTitle, { color: colors.text }]}>{t('ai_what_data_shared')}</Text>
                  </View>
                  <View style={styles.infoList}>
                    <View style={styles.infoListItem}>
                      <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        {t('ai_data_chat')}
                      </Text>
                    </View>
                    <View style={styles.infoListItem}>
                      <Ionicons name="book" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        {t('ai_data_journal')}
                      </Text>
                    </View>
                    <View style={styles.infoListItem}>
                      <Ionicons name="mic" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        {t('ai_data_voice')}
                      </Text>
                    </View>
                    <View style={styles.infoListItem}>
                      <Ionicons name="heart" size={18} color={colors.primary} />
                      <Text style={[styles.infoListText, { color: colors.textSecondary }]}>
                        {t('ai_data_health')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Who Receives */}
                <View style={styles.infoSection}>
                  <View style={styles.infoSectionHeader}>
                    <Ionicons name="business-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoSectionTitle, { color: colors.text }]}>{t('ai_who_receives')}</Text>
                  </View>
                  <GlassCard style={styles.recipientCard} padding="md">
                    <Text style={[styles.recipientName, { color: colors.text }]}>{t('our_llm')}</Text>
                    <Text style={[styles.recipientDesc, { color: colors.textSecondary }]}>
                      {t('our_llm_desc')}
                    </Text>
                    <Text style={[styles.recipientHighlight, { color: colors.success }]}>
                      {t('ai_provider_no_train')}
                    </Text>
                    <Pressable 
                      style={styles.externalLink}
                      onPress={() => Linking.openURL('https://openai.com/privacy')}
                    >
                      <Text style={[styles.externalLinkText, { color: colors.primary }]}>
                        {t('view_provider_privacy')}
                      </Text>
                      <Ionicons name="open-outline" size={16} color={colors.primary} />
                    </Pressable>
                  </GlassCard>
                </View>

                {/* Data Protection */}
                <View style={styles.infoSection}>
                  <View style={styles.infoSectionHeader}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoSectionTitle, { color: colors.text }]}>{t('ai_how_protected')}</Text>
                  </View>
                  <View style={styles.protectionList}>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        {t('prot_encrypted')}
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        {t('prot_contract')}
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        {t('prot_not_ads')}
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        {t('prot_not_sold')}
                      </Text>
                    </View>
                    <View style={styles.protectionItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                        {t('prot_revoke_settings')}
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
                    {t('read_full_privacy')}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </Pressable>

                {/* Optional Note */}
                <Text style={[styles.optionalNote, { color: colors.textMuted }]}>
                  {t('ai_optional_note')}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Privacy Settings */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t('privacySettings')}</Text>
          
          {/* Account Data & Privacy */}
          <GlassCard padding={0} style={styles.menuCard}>
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>{t('accountData')}</Text>
            <MenuItem
              icon={user?.emailVerified ? 'shield-checkmark-outline' : 'alert-circle-outline'}
              title={t('email_verification')}
              subtitle={
                user?.emailVerified
                  ? t('email_verified_sub')
                  : t('email_verify_prompt_sub')
              }
              onPress={() => {
                if (user?.emailVerified) {
                  router.push('/account-settings');
                } else {
                  handleSendEmailVerification();
                }
              }}
              showArrow={false}
              rightComponent={
                user?.emailVerified ? (
                  <View style={styles.emailStatusPillVerified}>
                    <Text style={styles.emailStatusPillTextVerified}>{t('verified')}</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.emailStatusPillUnverified}
                    onPress={handleSendEmailVerification}
                    disabled={isSendingEmailVerification}
                  >
                    <Text style={styles.emailStatusPillTextUnverified}>
                      {isSendingEmailVerification ? t('sending') : t('verify')}
                    </Text>
                  </Pressable>
                )
              }
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <MenuItem
              icon="trash-outline"
              title={t('delete_account_title')}
              subtitle={t('deleteAccountDesc')}
              onPress={() => {
                Alert.alert(
                  t('deleteAccount'),
                  t('delete_account_confirm'),
                  [
                    { text: t('cancel'), style: 'cancel' },
                    {
                      text: t('deleteAccount'),
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert(
                          t('confirm_deletion_title'),
                          t('confirm_deletion_body'),
                          [
                            { text: t('cancel'), style: 'cancel' },
                            {
                              text: t('delete'),
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  const response = await userService.deleteAccount();
                                  
                                  if (response.success) {
                                    Alert.alert(
                                      t('account_deleted_title'),
                                      t('account_deleted_body'),
                                      [
                                        {
                                          text: t('ok'),
                                          onPress: () => {
                                            useAuthStore.getState().logout();
                                            router.replace('/(auth)/login');
                                          },
                                        },
                                      ]
                                    );
                                  } else {
                                    Alert.alert(t('error'), response.message || t('failed_delete_account'));
                                  }
                                } catch (error: any) {
                                  Alert.alert(t('error'), error.message || t('failed_delete_account'));
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
              title={t('privacyPolicy')}
              subtitle={t('privacy_read_sub')}
              onPress={() => router.push('/privacy-policy')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-outline"
              title={t('termsOfService')}
              subtitle={t('terms_read_sub')}
              onPress={() => router.push('/terms-of-service')}
            />
          </GlassCard>
        </View>

        {/* Notification Preferences */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t('notificationSettings')}</Text>
          <GlassCard padding={0}>
            <SwitchItem
              icon="notifications-outline"
              title={t('pushNotifications')}
              subtitle={t('pushNotificationsDesc')}
              value={notificationPreferences.pushEnabled}
              onValueChange={(value) =>
                setNotificationPreference('pushEnabled', value)
              }
            />
            <View style={styles.menuDivider} />
            <SwitchItem
              icon="mail-outline"
              title={t('emailNotifications')}
              subtitle={t('emailNotificationsDesc')}
              value={notificationPreferences.emailEnabled}
              onValueChange={(value) =>
                setNotificationPreference('emailEnabled', value)
              }
            />
          </GlassCard>
        </View>

        {/* Blocked Users */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{t('blocked_users_title')}</Text>
          <GlassCard padding={0}>
            {isLoadingBlocked ? (
              <View style={styles.blockedLoadingContainer}>
                <LoadingSpinner size="sm" />
              </View>
            ) : blockedUsers.length === 0 ? (
              <View style={styles.blockedEmptyContainer}>
                <Ionicons name="ban-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.blockedEmptyText, { color: colors.textMuted }]}>
                  {t('blocked_users_empty')}
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
                      pixelCharacter={(blockedUser as any).pixelCharacter}
                      avatarCharacter={blockedUser.avatarCharacter}
                      avatarBackgroundColor={blockedUser.avatarBackgroundColor}
                      size="md"
                    />
                    <View style={styles.blockedUserInfo}>
                      <Text style={[styles.blockedUserName, { color: getUsernameColor(blockedUser._id, blockedUser) }]}>
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
                        {t('unblock')}
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

        {/* Design Preview (removed v2/v3 variants on request) */}
      </ScrollView>

      <LanguagePickerSheet
        visible={languagePickerVisible}
        onClose={() => setLanguagePickerVisible(false)}
      />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for better contrast
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: 40,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    opacity: 1, // Ensure full opacity
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
  emailStatusPillVerified: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.successGlass || 'rgba(34, 197, 94, 0.08)',
  },
  emailStatusPillUnverified: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.warningGlass || 'rgba(251, 191, 36, 0.08)',
  },
  emailStatusPillTextVerified: {
    ...TYPOGRAPHY.small,
    color: COLORS.success || '#22c55e',
    fontWeight: '600',
  },
  emailStatusPillTextUnverified: {
    ...TYPOGRAPHY.small,
    color: COLORS.warning || '#fbbf24',
    fontWeight: '600',
  },
});

