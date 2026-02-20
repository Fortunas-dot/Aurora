import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, JournalInsights, JournalEntry } from '../../src/services/journal.service';
import { useAuthStore } from '../../src/store/authStore';
import { usePremium } from '../../src/hooks/usePremium';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from 'date-fns';
import { nlNL } from 'date-fns/locale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - SPACING.lg * 2 - SPACING.lg * 2;

// Mood emoji mapping (based on 5-point scale: 1-5)
const getMoodEmoji = (mood: number): string => {
  if (mood <= 1) return '😢';  // Very bad
  if (mood <= 2) return '😔';  // Down
  if (mood <= 3) return '😐';  // Neutral
  if (mood <= 4) return '🙂';  // Good
  return '😊';  // Excellent (5)
};

// Mood color mapping based on mood value (based on 5-point scale: 1-5)
const getMoodColor = (mood: number): string => {
  if (mood <= 1) return '#F87171';  // Red for very bad
  if (mood <= 2) return '#FB923C';  // Orange for down
  if (mood <= 3) return '#FBBF24';  // Yellow for neutral
  if (mood <= 4) return '#A3E635';  // Light green for good
  return '#34D399';  // Green for excellent (5)
};

// Mood color mapping based on emoji
const getMoodColorByEmoji = (emoji: string): string => {
  if (emoji === '😢') return '#F87171'; // Red for sad
  if (emoji === '😔') return '#FB923C'; // Orange for down
  if (emoji === '😐') return '#FBBF24'; // Yellow for neutral
  if (emoji === '🙂') return '#A3E635'; // Light green for happy
  if (emoji === '😊') return '#34D399'; // Green for very happy
  return '#FBBF24'; // Default yellow
};

// Simple line chart component for mood trends
const MoodTrendChart: React.FC<{
  data: { date: string; mood: number }[];
}> = ({ data }) => {
  if (data.length === 0) return null;

  // Sort data by date to ensure correct order
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  const maxMood = 5;
  const minMood = 1;
  const chartHeight = 150;
  const pointRadius = 4;

  // Calculate points - distribute evenly across available width
  // Account for y-axis width (30px from styles)
  const yAxisWidth = 30;
  const availableWidth = CHART_WIDTH - yAxisWidth;
  const points = sortedData.map((item, index) => {
    const x = sortedData.length > 1 
      ? yAxisWidth + (index / (sortedData.length - 1)) * availableWidth 
      : yAxisWidth + availableWidth / 2;
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
                {new Date(points[0].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </Text>
              {points.length > 1 && (
                <Text style={chartStyles.axisLabel}>
                  {new Date(points[points.length - 1].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

// Bar chart component for mood trends
const MoodBarChart: React.FC<{
  data: { date: string; mood: number }[];
}> = ({ data }) => {
  if (data.length === 0) return null;

  const maxMood = 5;
  const minMood = 1;
  const chartHeight = 150;
  const barWidth = CHART_WIDTH / Math.max(data.length, 1) - 4;

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

        {/* Bars */}
        <View style={chartStyles.barContainer}>
          {data.map((item, index) => {
            const barHeight = ((item.mood - minMood) / (maxMood - minMood)) * chartHeight;
            const x = (index / Math.max(data.length - 1, 1)) * CHART_WIDTH;

            return (
              <View
                key={`bar-${index}`}
                style={[
                  chartStyles.bar,
                  {
                    left: x,
                    bottom: 0,
                    width: barWidth,
                    height: barHeight,
                    backgroundColor: getMoodColor(item.mood),
                  },
                ]}
              />
            );
          })}
        </View>

        {/* X-axis labels */}
        <View style={chartStyles.xAxis}>
          {data.length > 0 && (
            <>
              <Text style={chartStyles.axisLabel}>
                {new Date(data[0].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </Text>
              {data.length > 1 && (
                <Text style={chartStyles.axisLabel}>
                  {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
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
  barContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    position: 'absolute',
    borderRadius: BORDER_RADIUS.xs,
    marginHorizontal: 2,
  },
});

// Get mood icon based on mood value (Ionicons)
const getMoodIcon = (mood: number): keyof typeof Ionicons.glyphMap => {
  if (mood <= 1) return 'close-circle';  // Very bad
  if (mood <= 2) return 'arrow-down-circle-outline';  // Down
  if (mood <= 3) return 'ellipse-outline';  // Neutral
  if (mood <= 4) return 'arrow-up-circle-outline';  // Good
  return 'happy';  // Excellent (5)
};

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

// Mood Calendar Component
const MoodCalendar: React.FC<{
  entries: JournalEntry[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}> = ({ entries, currentMonth, onMonthChange }) => {
  // Create a map of date -> mood for quick lookup
  // Group entries by date and use the latest entry for each day
  const moodMap = new Map<string, number>();
  const entriesByDate = new Map<string, JournalEntry>();
  
  entries.forEach(entry => {
    const date = parseISO(entry.createdAt);
    const dateKey = format(date, 'yyyy-MM-dd');
    const existing = entriesByDate.get(dateKey);
    
    // If no entry for this date, or this entry is newer, use this one
    if (!existing || parseISO(entry.createdAt) > parseISO(existing.createdAt)) {
      entriesByDate.set(dateKey, entry);
      moodMap.set(dateKey, entry.mood);
    }
  });

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  return (
    <GlassCard style={styles.calendarCard} padding="lg">
      <View style={styles.calendarHeader}>
        <Pressable
          style={styles.calendarNavButton}
          onPress={() => onMonthChange(subMonths(currentMonth, 1))}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.calendarTitle}>
          {format(currentMonth, 'MMMM yyyy', { locale: nlNL })}
        </Text>
        <Pressable
          style={styles.calendarNavButton}
          onPress={() => onMonthChange(addMonths(currentMonth, 1))}
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Week day headers */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayHeader}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const mood = moodMap.get(dateKey);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <View
              key={index}
              style={[
                styles.calendarDay,
                !isCurrentMonth && styles.calendarDayOtherMonth,
                isCurrentDay && styles.calendarDayToday,
              ]}
            >
              {mood ? (
                <View
                  style={[
                    styles.moodDaySquare,
                    { backgroundColor: getMoodColorByEmoji(getMoodEmoji(mood)) },
                  ]}
                >
                  <Text style={styles.moodDayEmoji}>{getMoodEmoji(mood)}</Text>
                  <Text style={styles.moodDayNumber}>{format(day, 'd')}</Text>
                </View>
              ) : (
                <View style={styles.emptyDaySquare}>
                  <Text
                    style={[
                      styles.emptyDayNumber,
                      !isCurrentMonth && styles.emptyDayNumberOtherMonth,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
};

export default function JournalInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { isPremium, isLoading: isPremiumLoading } = usePremium();

  const [insights, setInsights] = useState<JournalInsights | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30 | 'all'>(30);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'calendar' | 'line'>('calendar');
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const loadInsights = useCallback(async (signal?: AbortSignal) => {
    // Check authentication first
    if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to view insights');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setError(null);
    
    // Only set loading to true if we don't have data yet
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    
    try {
      const [insightsResponse, entriesResponse] = await Promise.all([
        journalService.getInsights(
          selectedPeriod === 'all' ? 'all' : selectedPeriod,
          undefined,
          signal
        ),
        // Load entries for calendar - get entries for the last 3 months
        journalService.getEntries(1, 200, {}).catch(() => ({ success: false, data: [] }))
      ]);
      
      // Check if request was aborted or component unmounted
      if (signal?.aborted || !isMountedRef.current) {
        return;
      }
      
      if (insightsResponse.success && insightsResponse.data) {
        setInsights(insightsResponse.data);
        hasLoadedRef.current = true;
        setError(null);
      } else {
        // If request failed, show error message
        const errorMessage = insightsResponse.message || 'Failed to load insights';
        setError(errorMessage);
        console.warn('Failed to load insights:', errorMessage);
      }

      // Set entries for calendar
      if (entriesResponse.success && entriesResponse.data) {
        setEntries(entriesResponse.data);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError' || signal?.aborted) {
        return;
      }
      const errorMessage = error.message || 'An error occurred while loading insights';
      setError(errorMessage);
      console.error('Error loading insights:', error);
    } finally {
      // Only update state if component is still mounted and not aborted
      if (isMountedRef.current && !signal?.aborted) {
        isLoadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedPeriod, isAuthenticated]);

  // Load insights on mount and when period changes
  useEffect(() => {
    isMountedRef.current = true;
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Reset hasLoaded when period changes
    hasLoadedRef.current = false;
    
    loadInsights(signal);
    
    return () => {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isMountedRef.current = false;
      isLoadingRef.current = false;
      // Explicitly reset loading state to prevent stuck loading
      setLoading(false);
      setRefreshing(false);
    };
  }, [loadInsights]);

  // Prevent reloading when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      // Only reload if we don't have data yet
      if (!hasLoadedRef.current && !isLoadingRef.current) {
        abortControllerRef.current = new AbortController();
        loadInsights(abortControllerRef.current.signal);
      }
    }, [loadInsights])
  );

  const onRefresh = useCallback(() => {
    // Abort any ongoing request before starting refresh
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for refresh
    abortControllerRef.current = new AbortController();
    setRefreshing(true);
    loadInsights(abortControllerRef.current.signal);
  }, [loadInsights]);

  const getMoodDescription = (mood: number): string => {
    if (mood <= 3) return 'Low';
    if (mood <= 5) return 'Moderate';
    if (mood <= 7) return 'Good';
    return 'Excellent';
  };

  // Redirect non‑premium users to subscription via effect (avoid navigation in render)
  // TEMPORARILY DISABLED FOR TESTING
  // useEffect(() => {
  // if (isAuthenticated && !isPremium && !isPremiumLoading) {
  //   router.replace('/subscription');
  //   }
  // }, [isAuthenticated, isPremium, isPremiumLoading, router]);

  // While redirecting, render nothing to avoid flicker
  // TEMPORARILY DISABLED FOR TESTING
  // if (isAuthenticated && !isPremium && !isPremiumLoading) {
  //   return null;
  // }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Insights</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <GlassCard style={styles.emptyCard} padding="xl">
            <View style={styles.emptyContent}>
              <Ionicons name="lock-closed-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Authentication Required</Text>
              <Text style={styles.emptyText}>
                Please log in to view your journal insights.
              </Text>
            </View>
          </GlassCard>
        </View>
      </LinearGradient>
    );
  }

  // (Non‑premium redirect is handled above)

  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Insights</Text>
          <View style={styles.headerSpacer} />
        </View>
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
        <Pressable 
          style={styles.backButton} 
          onPress={() => {
            // Abort any ongoing request before navigating back
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
              abortControllerRef.current = null;
            }
            isLoadingRef.current = false;
            setLoading(false);
            setRefreshing(false);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Insights</Text>
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
        {([7, 14, 30, 'all'] as const).map((period) => (
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
                {period === 'all' ? 'All' : `${period} days`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Error message */}
        {error && (
          <GlassCard style={styles.emptyCard} padding="xl">
            <View style={styles.emptyContent}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
              <Text style={styles.emptyTitle}>Error</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  hasLoadedRef.current = false;
                  loadInsights();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          </GlassCard>
        )}

        {/* No data or insights */}
        {!error && (!insights || insights.totalEntries === 0) ? (
          <GlassCard style={styles.emptyCard} padding="xl">
            <View style={styles.emptyContent}>
              <Ionicons name="analytics-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptyText}>
                Write more journal entries to discover insights about your mood and patterns.
              </Text>
            </View>
          </GlassCard>
        ) : !error ? (
          <>
            {/* Aurora's Tip - Moved to top */}
            {insights && (
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
            )}

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="flame"
                label="Streak"
                value={`${insights.streakDays} days`}
                color={COLORS.warning}
              />
              <StatCard
                icon="document-text"
                label="Entries"
                value={insights.totalEntries}
                color={COLORS.primary}
              />
              <StatCard
                icon={insights.averageMood ? getMoodIcon(insights.averageMood) : 'remove-circle-outline'}
                label="Avg. mood"
                value={insights.averageMood ? `${insights.averageMood.toFixed(1)}/5` : '-'}
                color={insights.averageMood ? getMoodColor(insights.averageMood) : COLORS.textMuted}
              />
            </View>

            {/* Mood Calendar */}
            {entries.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mood Calendar</Text>
                  <View style={styles.chartToggle}>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        calendarView === 'calendar' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setCalendarView('calendar')}
                    >
                      <Ionicons 
                        name="calendar" 
                        size={18} 
                        color={calendarView === 'calendar' ? COLORS.white : COLORS.textMuted} 
                      />
                    </Pressable>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        calendarView === 'line' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setCalendarView('line')}
                    >
                      <Ionicons 
                        name="trending-up" 
                        size={18} 
                        color={calendarView === 'line' ? COLORS.white : COLORS.textMuted} 
                      />
                    </Pressable>
                  </View>
                </View>
                {calendarView === 'calendar' ? (
                  <MoodCalendar
                    entries={entries}
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                  />
                ) : (
                  <GlassCard style={styles.chartCard} padding="lg">
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartSubtitle}>
                        Mood over time
                      </Text>
                    </View>
                    <MoodTrendChart data={insights.moodTrend || entries.map(e => ({ date: e.createdAt, mood: e.mood }))} />
                  </GlassCard>
                )}
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
          </>
        ) : null}
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
  upgradeButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  upgradeButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.white,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    width: 36,
    height: 36,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleButtonText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
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
  retryButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  retryButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.white,
    fontWeight: '600',
  },
  calendarCard: {
    marginBottom: SPACING.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  weekDayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    // Highlight today
  },
  moodDaySquare: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    overflow: 'hidden',
  },
  moodDayEmoji: {
    fontSize: 14,
    lineHeight: 16,
    marginBottom: 1,
  },
  moodDayNumber: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 9,
    lineHeight: 10,
  },
  emptyDaySquare: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  emptyDayNumber: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontSize: 12,
  },
  emptyDayNumberOtherMonth: {
    color: COLORS.textMuted,
  },
});






