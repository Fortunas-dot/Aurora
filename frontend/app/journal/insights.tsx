import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, JournalInsights } from '../../src/services/journal.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - SPACING.lg * 2 - SPACING.lg * 2;

// Simple line chart component for mood trends
const MoodTrendChart: React.FC<{
  data: { date: string; mood: number }[];
}> = ({ data }) => {
  if (data.length === 0) return null;

  const maxMood = 10;
  const minMood = 1;
  const chartHeight = 150;
  const pointRadius = 4;

  // Calculate points
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * CHART_WIDTH;
    const y = chartHeight - ((item.mood - minMood) / (maxMood - minMood)) * chartHeight;
    return { x, y, mood: item.mood, date: item.date };
  });

  // Create path for the line
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Get mood color
  const getMoodColor = (mood: number): string => {
    if (mood <= 3) return '#F87171';
    if (mood <= 5) return '#FBBF24';
    if (mood <= 7) return '#A3E635';
    return '#34D399';
  };

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.yAxis}>
        <Text style={chartStyles.axisLabel}>10</Text>
        <Text style={chartStyles.axisLabel}>5</Text>
        <Text style={chartStyles.axisLabel}>1</Text>
      </View>
      <View style={chartStyles.chartArea}>
        {/* Grid lines */}
        <View style={[chartStyles.gridLine, { top: 0 }]} />
        <View style={[chartStyles.gridLine, { top: chartHeight / 2 }]} />
        <View style={[chartStyles.gridLine, { top: chartHeight }]} />

        {/* SVG-like drawing using View components */}
        <View style={chartStyles.lineContainer}>
          {points.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = points[index - 1];
            const dx = point.x - prevPoint.x;
            const dy = point.y - prevPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
              <View
                key={`line-${index}`}
                style={[
                  chartStyles.lineSegment,
                  {
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: length,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Data points */}
        {points.map((point, index) => (
          <View
            key={`point-${index}`}
            style={[
              chartStyles.dataPoint,
              {
                left: point.x - pointRadius,
                top: point.y - pointRadius,
                backgroundColor: getMoodColor(point.mood),
              },
            ]}
          />
        ))}

        {/* X-axis labels */}
        <View style={chartStyles.xAxis}>
          {points.length > 0 && (
            <>
              <Text style={chartStyles.axisLabel}>
                {new Date(points[0].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </Text>
              {points.length > 1 && (
                <Text style={chartStyles.axisLabel}>
                  {new Date(points[points.length - 1].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: SPACING.md,
  },
  yAxis: {
    width: 30,
    height: 150,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: SPACING.sm,
  },
  chartArea: {
    flex: 1,
    height: 150,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.primary,
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  xAxis: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});

// Stat card component
const StatCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
}> = ({ icon, label, value, color = COLORS.primary }) => (
  <GlassCard style={styles.statCard} padding="md">
    <View style={styles.statContent}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </GlassCard>
);

// Theme/Pattern item
const InsightItem: React.FC<{
  text: string;
  count: number;
  color: string;
}> = ({ text, count, color }) => (
  <View style={styles.insightItem}>
    <View style={[styles.insightDot, { backgroundColor: color }]} />
    <Text style={styles.insightText}>{text}</Text>
    <View style={styles.insightCount}>
      <Text style={[styles.insightCountText, { color }]}>{count}x</Text>
    </View>
  </View>
);

export default function JournalInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [insights, setInsights] = useState<JournalInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(30);

  const loadInsights = useCallback(async () => {
    try {
      const response = await journalService.getInsights(selectedPeriod);
      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInsights();
  }, [loadInsights]);

  const getMoodDescription = (mood: number): string => {
    if (mood <= 3) return 'Laag';
    if (mood <= 5) return 'Matig';
    if (mood <= 7) return 'Goed';
    return 'Uitstekend';
  };

  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Inzichten</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
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
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {([7, 14, 30] as const).map((period) => (
            <Pressable
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}
              >
                {period} dagen
              </Text>
            </Pressable>
          ))}
        </View>

        {!insights || insights.totalEntries === 0 ? (
          <GlassCard style={styles.emptyCard} padding="xl">
            <View style={styles.emptyContent}>
              <Ionicons name="analytics-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Nog geen data</Text>
              <Text style={styles.emptyText}>
                Schrijf meer dagboekentries om inzichten te ontdekken over je stemming en patronen.
              </Text>
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="flame"
                label="Streak"
                value={`${insights.streakDays} dagen`}
                color={COLORS.warning}
              />
              <StatCard
                icon="document-text"
                label="Entries"
                value={insights.totalEntries}
                color={COLORS.primary}
              />
              <StatCard
                icon="happy"
                label="Gem. stemming"
                value={insights.averageMood ? `${insights.averageMood}/10` : '-'}
                color={COLORS.success}
              />
            </View>

            {/* Mood Trend */}
            {insights.moodTrend && insights.moodTrend.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mood Trend</Text>
                <GlassCard style={styles.chartCard} padding="lg">
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartSubtitle}>
                      Average: {insights.averageMood}/10 ({getMoodDescription(insights.averageMood || 5)})
                    </Text>
                  </View>
                  <MoodTrendChart data={insights.moodTrend} />
                </GlassCard>
              </View>
            )}

            {/* Top Themes */}
            {insights.topThemes && insights.topThemes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Common themes</Text>
                <GlassCard style={styles.listCard} padding="lg">
                  {insights.topThemes.map((item, index) => (
                    <InsightItem
                      key={item.theme}
                      text={item.theme}
                      count={item.count}
                      color={[COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.success][index % 5]}
                    />
                  ))}
                </GlassCard>
              </View>
            )}

            {/* Common Patterns */}
            {insights.commonPatterns && insights.commonPatterns.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detected Patterns</Text>
                <GlassCard style={styles.listCard} padding="lg">
                  <View style={styles.patternWarning}>
                    <Ionicons name="information-circle" size={18} color={COLORS.warning} />
                    <Text style={styles.patternWarningText}>
                      Aurora detects thought patterns to increase your awareness
                    </Text>
                  </View>
                  {insights.commonPatterns.map((item, index) => (
                    <InsightItem
                      key={item.pattern}
                      text={item.pattern}
                      count={item.count}
                      color={COLORS.warning}
                    />
                  ))}
                </GlassCard>
              </View>
            )}

            {/* Symptom Frequency */}
            {insights.symptomFrequency && Object.keys(insights.symptomFrequency).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Symptom Frequency</Text>
                <GlassCard style={styles.listCard} padding="lg">
                  {Object.entries(insights.symptomFrequency).map(([symptom, data]) => (
                    <InsightItem
                      key={symptom}
                      text={symptom}
                      count={data.count}
                      color={COLORS.error}
                    />
                  ))}
                </GlassCard>
              </View>
            )}

            {/* Tips */}
            <View style={styles.section}>
              <GlassCard style={styles.tipCard} padding="lg">
                <View style={styles.tipHeader}>
                  <Ionicons name="bulb" size={24} color={COLORS.warning} />
                  <Text style={styles.tipTitle}>Aurora's Tip</Text>
                </View>
                <Text style={styles.tipText}>
                  {insights.averageMood && insights.averageMood < 5
                    ? 'Your mood seems lower than average. Consider talking to Aurora about how you feel, or try a gratitude exercise.'
                    : insights.streakDays >= 7
                    ? `Great! You've written for ${insights.streakDays} days in a row. Consistency helps with self-awareness.`
                    : 'Try writing daily for the best insights. Even a short reflection helps.'}
                </Text>
              </GlassCard>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  periodTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    width: '100%',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chartCard: {},
  chartHeader: {
    marginBottom: SPACING.sm,
  },
  chartSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  listCard: {},
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.md,
  },
  insightText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  insightCount: {
    backgroundColor: COLORS.glass.backgroundLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  insightCountText: {
    ...TYPOGRAPHY.captionMedium,
  },
  patternWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  patternWarningText: {
    ...TYPOGRAPHY.small,
    color: COLORS.warning,
    flex: 1,
  },
  tipCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tipTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.warning,
  },
  tipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 24,
  },
});






