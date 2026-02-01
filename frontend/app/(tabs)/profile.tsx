import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, Avatar, TagChip } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}) => (
  <Pressable style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? COLORS.error : COLORS.primary}
      />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && (
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    )}
  </Pressable>
);

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (!isAuthenticated || !user) {
    return (
      <LinearGradient
        colors={COLORS.backgroundGradient}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Text style={styles.headerTitle}>Profiel</Text>
        </View>
        
        <View style={styles.authPrompt}>
          <View style={styles.guestAvatarContainer}>
            <LinearGradient
              colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
              style={styles.guestAvatar}
            >
              <Ionicons name="person" size={48} color={COLORS.primary} />
            </LinearGradient>
          </View>
          <Text style={styles.authPromptTitle}>Welkom, Gast</Text>
          <Text style={styles.authPromptText}>
            Log in of maak een account aan om alle functies te gebruiken
          </Text>
          
          <View style={styles.authButtons}>
            <GlassButton
              title="Inloggen"
              onPress={() => router.push('/(auth)/login')}
              variant="primary"
              style={styles.authButton}
            />
            <GlassButton
              title="Registreren"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              style={styles.authButton}
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Text style={styles.headerTitle}>Profiel</Text>
          <Pressable style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <GlassCard style={styles.profileCard} padding="lg" gradient>
            <View style={styles.profileHeader}>
              <Avatar
                uri={user.avatar}
                name={user.displayName || user.username}
                size="xl"
              />
              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>
                  {user.displayName || user.username}
                </Text>
                <Text style={styles.username}>@{user.username}</Text>
              </View>
              <Pressable style={styles.editButton}>
                <Ionicons name="pencil" size={18} color={COLORS.primary} />
              </Pressable>
            </View>

            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            {/* Health Info Tags */}
            {user.healthInfo && (
              <View style={styles.healthInfoSection}>
                {(user.healthInfo.mentalHealth && user.healthInfo.mentalHealth.length > 0) && (
                  <View style={styles.healthCategory}>
                    <Text style={styles.healthCategoryLabel}>Mentale gezondheid</Text>
                    <View style={styles.healthTags}>
                      {user.healthInfo.mentalHealth.slice(0, 3).map((item, index) => {
                        const condition = typeof item === 'string' ? item : item.condition;
                        const type = typeof item === 'string' ? undefined : item.type;
                        const severity = typeof item === 'string' ? undefined : item.severity;
                        const displayText = type ? `${condition}: ${type}` : condition;
                        return (
                          <View key={index} style={styles.healthTagContainer}>
                            <TagChip label={displayText} size="sm" />
                            {severity && (
                              <View style={[
                                styles.severityIndicator,
                                {
                                  backgroundColor: severity === 'mild' ? COLORS.success :
                                    severity === 'moderate' ? COLORS.warning : COLORS.error,
                                }
                              ]} />
                            )}
                          </View>
                        );
                      })}
                      {user.healthInfo.mentalHealth.length > 3 && (
                        <Text style={styles.moreTags}>+{user.healthInfo.mentalHealth.length - 3}</Text>
                      )}
                    </View>
                  </View>
                )}
                {(user.healthInfo.physicalHealth && user.healthInfo.physicalHealth.length > 0) && (
                  <View style={styles.healthCategory}>
                    <Text style={styles.healthCategoryLabel}>Fysieke gezondheid</Text>
                    <View style={styles.healthTags}>
                      {user.healthInfo.physicalHealth.slice(0, 3).map((item, index) => {
                        const condition = typeof item === 'string' ? item : item.condition;
                        const type = typeof item === 'string' ? undefined : item.type;
                        const severity = typeof item === 'string' ? undefined : item.severity;
                        const displayText = type ? `${condition}: ${type}` : condition;
                        return (
                          <View key={index} style={styles.healthTagContainer}>
                            <TagChip label={displayText} size="sm" />
                            {severity && (
                              <View style={[
                                styles.severityIndicator,
                                {
                                  backgroundColor: severity === 'mild' ? COLORS.success :
                                    severity === 'moderate' ? COLORS.warning : COLORS.error,
                                }
                              ]} />
                            )}
                          </View>
                        );
                      })}
                      {user.healthInfo.physicalHealth.length > 3 && (
                        <Text style={styles.moreTags}>+{user.healthInfo.physicalHealth.length - 3}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>156</Text>
                <Text style={styles.statLabel}>Connecties</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>42</Text>
                <Text style={styles.statLabel}>Groepen</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <GlassCard padding={0}>
            <MenuItem
              icon="person-outline"
              title="Bewerk profiel"
              subtitle="Naam, bio, foto"
              onPress={() => router.push('/edit-profile')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="heart-outline"
              title="Gezondheidsinformatie"
              subtitle="Mentale & fysieke gezondheid"
              onPress={() => router.push('/health-info')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Privacy"
              subtitle="Anonimiteit instellingen"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="notifications-outline"
              title="Notificaties"
              onPress={() => {}}
            />
          </GlassCard>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>App</Text>
          <GlassCard padding={0}>
            <MenuItem
              icon="color-palette-outline"
              title="Thema"
              subtitle="Donker"
              onPress={() => router.push('/settings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="language-outline"
              title="Taal"
              subtitle="Nederlands"
              onPress={() => router.push('/settings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="sparkles-outline"
              title="Tab Bar Icoon"
              subtitle="Kies een bewegend symbool"
              onPress={() => router.push('/icon-selector')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => {}}
            />
          </GlassCard>
        </View>

        <View style={styles.menuSection}>
          <GlassCard padding={0}>
            <MenuItem
              icon="log-out-outline"
              title="Uitloggen"
              onPress={handleLogout}
              showArrow={false}
              danger
            />
          </GlassCard>
        </View>

        {/* Version */}
        <Text style={styles.version}>Aurora v1.0.0</Text>
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
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  profileCard: {},
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  displayName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  username: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bio: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  healthInfoSection: {
    marginBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  healthCategory: {
    marginBottom: SPACING.sm,
  },
  healthCategoryLabel: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  healthTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  healthTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreTags: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.glass.border,
  },
  menuSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  menuSectionTitle: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDanger: {
    backgroundColor: COLORS.errorGlass,
  },
  menuContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  menuTitleDanger: {
    color: COLORS.error,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.glass.border,
    marginLeft: 68,
  },
  version: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  guestAvatarContainer: {
    marginBottom: SPACING.lg,
  },
  guestAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.glass.border,
  },
  authPromptTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  authPromptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  authButton: {
    minWidth: 120,
  },
});

