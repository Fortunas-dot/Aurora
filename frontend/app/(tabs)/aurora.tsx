import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../../src/components/common';
import { AuroraCore } from '../../src/components/voice/AuroraCore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { journalService, JournalInsights } from '../../src/services/journal.service';

// Dagelijkse quotes - geselecteerd op basis van dag van het jaar
const DAILY_QUOTES = [
  "Je bent sterker dan je denkt. Elke dag is een nieuwe kans om te groeien.",
  "Het is oké om niet oké te zijn. Je gevoelens zijn geldig en belangrijk.",
  "Kleine stappen leiden tot grote veranderingen. Wees trots op je vooruitgang.",
  "Je bent niet alleen in je reis. Er zijn mensen die om je geven.",
  "Zelfzorg is geen egoïsme, het is noodzakelijk. Neem de tijd voor jezelf.",
  "Elke uitdaging die je overwint maakt je sterker. Blijf doorgaan.",
  "Je verdient geluk en vrede. Laat niemand je anders laten geloven.",
  "Het is nooit te laat om een nieuwe start te maken. Vandaag is een perfect moment.",
  "Je bent waardevol, precies zoals je bent. Je hoeft niet perfect te zijn.",
  "Vergeet niet: je hebt al zoveel moeilijke momenten doorstaan. Je kunt dit ook.",
  "Adem in, adem uit. Je bent precies waar je moet zijn op dit moment.",
  "Je reis is uniek. Vergelijk jezelf niet met anderen - je bent op je eigen pad.",
  "Het is oké om hulp te vragen. Sterk zijn betekent niet alles alleen doen.",
  "Elke dag dat je opstaat en doorgaat is een overwinning. Vier die momenten.",
  "Je gedachten zijn niet altijd waar. Je bent meer dan je angsten.",
  "Zelfliefde is een reis, geen bestemming. Wees geduldig met jezelf.",
  "Je verdient rust, vrede en geluk. Laat niets je dat afnemen.",
  "Elke stap vooruit, hoe klein ook, is vooruitgang. Blijf bewegen.",
  "Je bent genoeg, precies zoals je bent. Je hoeft niets te bewijzen.",
  "Vergeet niet: deze moeilijke momenten zijn tijdelijk. Betere dagen komen eraan.",
];

const getDailyQuote = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
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
  const userName = user?.displayName || user?.username || 'Vriend';

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
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.sectionTitle}>Jouw voortgang</Text>
            <View style={styles.statsGrid}>
              <GlassCard style={styles.statCard} padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="flame" size={24} color={COLORS.warning} />
                  <Text style={styles.statValue}>{insights.streakDays}</Text>
                  <Text style={styles.statLabel}>dagen streak</Text>
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
                  <Text style={styles.statLabel}>gem. stemming</Text>
                </View>
              </GlassCard>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {isAuthenticated && (
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Snelle acties</Text>
            <View style={styles.quickActionsGrid}>
              <Pressable
                style={styles.quickActionButton}
                onPress={() => router.push('/journal/create')}
              >
                <GlassCard style={styles.quickActionCard} padding="md">
                  <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                  <Text style={styles.quickActionText}>Snelle entry</Text>
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

        {/* Aurora Visualization */}
        <View style={styles.auroraContainer}>
          <AuroraCore state="idle" audioLevel={0} />
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Hoe kan ik je helpen?</Text>
          
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
                  <Text style={styles.optionTitle}>Voice Therapy</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Binnenkort</Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  Praat met Aurora via spraak in een veilige omgeving
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
                  Chat met Aurora via tekst op je eigen tempo
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
                <Text style={styles.optionTitle}>Dagboek</Text>
                <Text style={styles.optionDescription}>
                  Schrijf je gedachten op met AI-begeleiding
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
                  Bekijk patronen en inzichten uit je journal
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
                  Beheer je gezondheidsinformatie
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
    paddingBottom: SPACING.xxl,
  },
  auroraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  optionsContainer: {
    paddingHorizontal: SPACING.md,
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
  },
});

