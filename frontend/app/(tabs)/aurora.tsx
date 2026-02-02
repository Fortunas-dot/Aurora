import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../../src/components/common';
// import { AuroraCore } from '../../src/components/voice/AuroraCore'; // Bewaard voor later gebruik
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { journalService, JournalInsights } from '../../src/services/journal.service';

// Daily quotes - selected based on day of the year
const DAILY_QUOTES = [
  "You are stronger than you think. Every day is a new chance to grow.",
  "It's okay to not be okay. Your feelings are valid and important.",
  "Small steps lead to big changes. Be proud of your progress.",
  "You are not alone in your journey. There are people who care about you.",
  "Self-care is not selfish, it's necessary. Take time for yourself.",
  "Every challenge you overcome makes you stronger. Keep going.",
  "You deserve happiness and peace. Don't let anyone tell you otherwise.",
  "It's never too late to make a fresh start. Today is a perfect moment.",
  "You are valuable, exactly as you are. You don't need to be perfect.",
  "Remember: you've already survived so many difficult moments. You can do this too.",
  "Breathe in, breathe out. You are exactly where you need to be right now.",
  "Your journey is unique. Don't compare yourself to others - you're on your own path.",
  "It's okay to ask for help. Being strong doesn't mean doing everything alone.",
  "Every day you get up and keep going is a victory. Celebrate those moments.",
  "Your thoughts are not always true. You are more than your fears.",
  "Self-love is a journey, not a destination. Be patient with yourself.",
  "You deserve rest, peace, and happiness. Don't let anything take that away.",
  "Every step forward, no matter how small, is progress. Keep moving.",
  "You are enough, exactly as you are. You don't need to prove anything.",
  "Remember: these difficult moments are temporary. Better days are coming.",
];

const getDailyQuote = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function AuroraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const [insights, setInsights] = useState<JournalInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await journalService.getInsights(30);
      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInsights();
  }, [loadInsights]);

  const dailyQuote = getDailyQuote();
  const greeting = getGreeting();
  const userName = user?.displayName || user?.username || 'Friend';

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.headerTitle}>Aurora AI</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (Platform.OS === 'ios' ? 120 : 100) + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{greeting}, {userName} 👋</Text>
          <GlassCard style={styles.quoteCard} padding="md" gradient>
            <View style={styles.quoteContainer}>
              <Ionicons name="quote" size={24} color={COLORS.primary} style={styles.quoteIcon} />
              <Text style={styles.quoteText}>{dailyQuote}</Text>
            </View>
          </GlassCard>
        </View>

        {/* Quick Stats */}
        {isAuthenticated && insights && insights.totalEntries > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <GlassCard style={styles.statCard} padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="flame" size={24} color={COLORS.warning} />
                  <Text style={styles.statValue}>{insights.streakDays}</Text>
                  <Text style={styles.statLabel}>day streak</Text>
                </View>
              </GlassCard>
              
              <GlassCard style={styles.statCard} padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="journal" size={24} color={COLORS.primary} />
                  <Text style={styles.statValue}>{insights.totalEntries}</Text>
                  <Text style={styles.statLabel}>entries</Text>
                </View>
              </GlassCard>
              
              <GlassCard style={styles.statCard} padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="happy" size={24} color={COLORS.accent} />
                  <Text style={styles.statValue}>
                    {insights.averageMood ? insights.averageMood.toFixed(1) : '-'}
                  </Text>
                  <Text style={styles.statLabel}>avg. mood</Text>
                </View>
              </GlassCard>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {isAuthenticated && (
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <Pressable
                style={styles.quickActionButton}
                onPress={() => router.push('/journal/create')}
              >
                <GlassCard style={styles.quickActionCard} padding="md">
                  <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                  <Text style={styles.quickActionText}>Quick Entry</Text>
                </GlassCard>
              </Pressable>
              
              <Pressable
                style={styles.quickActionButton}
                onPress={() => router.push('/journal/insights')}
              >
                <GlassCard style={styles.quickActionCard} padding="md">
                  <Ionicons name="analytics" size={28} color={COLORS.accent} />
                  <Text style={styles.quickActionText}>Insights</Text>
                </GlassCard>
              </Pressable>
            </View>
          </View>
        )}

        {/* Options - How can I help you? */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>How can I help you?</Text>
          
          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/voice')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="mic" size={28} color={COLORS.primary} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>Voice Support</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  Talk with Aurora via voice in a safe environment
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/text-chat')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(94, 234, 212, 0.3)', 'rgba(52, 211, 153, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.accent} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Text Chat</Text>
                <Text style={styles.optionDescription}>
                  Chat with Aurora via text at your own pace
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/journal')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(251, 191, 36, 0.3)', 'rgba(245, 158, 11, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="journal" size={28} color={COLORS.warning} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Journal</Text>
                <Text style={styles.optionDescription}>
                  Write your thoughts with AI guidance
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/journal/insights')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="analytics" size={28} color={COLORS.secondary} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Insights</Text>
                <Text style={styles.optionDescription}>
                  View patterns and insights from your journal
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/health-info')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.3)', 'rgba(248, 113, 113, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="heart" size={28} color={COLORS.error} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Health Check</Text>
                <Text style={styles.optionDescription}>
                  Manage your health information
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/sounds')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="musical-notes" size={28} color={COLORS.secondary} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Discover the power of noises & sounds</Text>
                <Text style={styles.optionDescription}>
                  Mix ambient sounds for focus, sleep, and relaxation
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
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
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl, // Base padding, wordt dynamisch aangepast met safe area
  },
  // Aurora Visualization - bewaard voor later gebruik
  // auroraContainer: {
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingVertical: SPACING.lg,
  // },
  optionsContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  optionsTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  optionCard: {
    marginBottom: SPACING.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  optionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 10,
  },
  optionDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  welcomeSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  quoteCard: {
    marginTop: SPACING.sm,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quoteIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  quoteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  statsSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
  },
  quickActionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.text,
    marginTop: SPACING.xs,
    textAlign: 'center',
    width: '100%',
  },
});

