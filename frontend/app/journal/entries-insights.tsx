import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, JournalEntry, JournalInsights, Journal } from '../../src/services/journal.service';
import { useAuthStore } from '../../src/store/authStore';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Mental health topics list (same as in create-journal.tsx)
const mentalHealthTopics = [
  { id: 'depression', label: 'Depression', icon: 'sad-outline' },
  { id: 'anxiety', label: 'Anxiety', icon: 'heart-outline' },
  { id: 'bipolar', label: 'Bipolar Disorder', icon: 'pulse-outline' },
  { id: 'ptsd', label: 'PTSD', icon: 'shield-outline' },
  { id: 'ocd', label: 'OCD', icon: 'repeat-outline' },
  { id: 'adhd', label: 'ADHD', icon: 'flash-outline' },
  { id: 'eating-disorder', label: 'Eating Disorder', icon: 'nutrition-outline' },
  { id: 'addiction', label: 'Addiction', icon: 'warning-outline' },
  { id: 'grief', label: 'Grief & Loss', icon: 'heart-dislike-outline' },
  { id: 'stress', label: 'Stress Management', icon: 'fitness-outline' },
  { id: 'self-esteem', label: 'Self-Esteem', icon: 'star-outline' },
  { id: 'relationships', label: 'Relationships', icon: 'people-outline' },
  { id: 'work-life', label: 'Work-Life Balance', icon: 'briefcase-outline' },
  { id: 'sleep', label: 'Sleep Issues', icon: 'moon-outline' },
  { id: 'anger', label: 'Anger Management', icon: 'flame-outline' },
  { id: 'trauma', label: 'Trauma', icon: 'medical-outline' },
  { id: 'general', label: 'General Wellness', icon: 'leaf-outline' },
];

// AI Insights Card Component for individual entries
const EntryInsightsCard: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
  if (!entry.aiInsights) return null;

  const sentimentEmoji: Record<string, string> = {
    positive: '😊',
    neutral: '😐',
    negative: '😔',
    mixed: '🤔',
  };

  const sentimentLabel: Record<string, string> = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    mixed: 'Mixed',
  };

  const sentiment = entry.aiInsights.sentiment || 'neutral';
  const emoji = sentimentEmoji[sentiment] || sentimentEmoji.neutral;
  const label = sentimentLabel[sentiment] || 'Neutral';

  return (
    <GlassCard style={styles.entryInsightsCard} padding="md">
      <View style={styles.entryInsightsHeader}>
        <View style={styles.entryInsightsDate}>
          <Text style={styles.entryInsightsDateText}>
            {format(parseISO(entry.createdAt), 'MMM d, yyyy', { locale: enUS })}
          </Text>
          <Text style={styles.entryInsightsTimeText}>
            {format(parseISO(entry.createdAt), 'HH:mm')}
          </Text>
        </View>
        <View style={styles.sentimentBadge}>
          <Text style={styles.sentimentEmoji}>{emoji}</Text>
          <Text style={styles.sentimentText}>{label}</Text>
        </View>
      </View>

      {/* Themes */}
      {entry.aiInsights.themes && entry.aiInsights.themes.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Themes</Text>
          <View style={styles.themesContainer}>
            {entry.aiInsights.themes.map((theme, index) => (
              <View key={index} style={styles.themeTag}>
                <Text style={styles.themeText}>{theme}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Cognitive Patterns */}
      {entry.aiInsights.cognitivePatterns && entry.aiInsights.cognitivePatterns.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Detected patterns</Text>
          <View style={styles.patternsContainer}>
            {entry.aiInsights.cognitivePatterns.map((pattern, index) => (
              <View key={index} style={styles.patternTag}>
                <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
                <Text style={styles.patternText}>{pattern}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Therapeutic Feedback */}
      {entry.aiInsights.therapeuticFeedback && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Feedback</Text>
          <Text style={styles.feedbackText}>{entry.aiInsights.therapeuticFeedback}</Text>
        </View>
      )}

      {/* Follow-up Questions */}
      {entry.aiInsights.followUpQuestions && entry.aiInsights.followUpQuestions.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Questions to reflect on</Text>
          {entry.aiInsights.followUpQuestions.map((question, index) => (
            <View key={index} style={styles.questionRow}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.questionText}>{question}</Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
};

export default function JournalEntriesInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<JournalInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30 | 'all'>(30);
  const [showJournalModal, setShowJournalModal] = useState(false);

  const loadJournals = useCallback(async () => {
    try {
      const response = await journalService.getUserJournals(1, 100);
      if (response.success && response.data) {
        setJournals(response.data);
        // Auto-select first journal if available and no journal is selected
        if (response.data.length > 0 && !selectedJournal) {
          setSelectedJournal(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading journals:', error);
    }
  }, [selectedJournal]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated || !selectedJournal) {
      setLoading(false);
      return;
    }

    try {
      // Load entries for selected journal
      const entriesResponse = await journalService.getEntries(1, 100, { journalId: selectedJournal._id });
      if (entriesResponse.success && entriesResponse.data) {
        // Filter entries by period
        const now = new Date();
        const filteredEntries = entriesResponse.data.filter((entry) => {
          if (selectedPeriod === 'all') return true;
          const entryDate = parseISO(entry.createdAt);
          const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= selectedPeriod;
        });
        setEntries(filteredEntries);
      }

      // Load insights for selected journal
      const insightsResponse = await journalService.getInsights(
        selectedPeriod === 'all' ? 365 : selectedPeriod,
        selectedJournal._id
      );
      if (insightsResponse.success && insightsResponse.data) {
        setInsights(insightsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, selectedJournal, selectedPeriod]);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  useEffect(() => {
    if (selectedJournal) {
      loadData();
    } else if (journals.length === 0) {
      setLoading(false);
    }
  }, [selectedJournal, loadData, journals.length]);

  const onRefresh = useCallback(() => {
    if (selectedJournal) {
      setRefreshing(true);
      loadData();
    }
  }, [loadData, selectedJournal]);

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Journal Insights</Text>
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

  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Journal Insights</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </LinearGradient>
    );
  }

  const entriesWithInsights = entries.filter((entry) => entry.aiInsights);

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Pressable
          style={styles.journalSelector}
          onPress={() => setShowJournalModal(true)}
        >
          {selectedJournal ? (
            <>
              {selectedJournal.coverImage ? (
                <Image
                  source={{ uri: selectedJournal.coverImage }}
                  style={styles.journalSelectorImage}
                />
              ) : (
                <View style={styles.journalSelectorIcon}>
                  <Ionicons name="book" size={20} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.journalSelectorTextContainer}>
                <Text style={styles.journalSelectorText} numberOfLines={1}>
                  {selectedJournal.name}
                </Text>
                {selectedJournal.topics && selectedJournal.topics.length > 0 && (
                  <View style={styles.journalSelectorTopics}>
                    {selectedJournal.topics.slice(0, 2).map((topic, index) => {
                      const topicInfo = mentalHealthTopics.find(t => t.id === topic);
                      if (!topicInfo) return null;
                      return (
                        <View key={index} style={styles.journalSelectorTopicChip}>
                          <Ionicons
                            name={topicInfo.icon as any}
                            size={10}
                            color={COLORS.primary}
                          />
                          <Text style={styles.journalSelectorTopicText} numberOfLines={1}>
                            {topicInfo.label}
                          </Text>
                        </View>
                      );
                    })}
                    {selectedJournal.topics.length > 2 && (
                      <Text style={styles.journalSelectorTopicMore}>
                        +{selectedJournal.topics.length - 2}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.journalSelectorPlaceholder}>Select Journal</Text>
          )}
          <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
        </Pressable>
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

        {/* Overall Journal Insights */}
        {insights && insights.totalEntries > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Journal Insights</Text>
            <GlassCard style={styles.overallInsightsCard} padding="lg">
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="document-text" size={24} color={COLORS.primary} />
                  <Text style={styles.statValue}>{insights.totalEntries}</Text>
                  <Text style={styles.statLabel}>Total Entries</Text>
                </View>
                {insights.averageMood && (
                  <View style={styles.statItem}>
                    <Ionicons name="happy-outline" size={24} color={COLORS.warning} />
                    <Text style={styles.statValue}>{insights.averageMood.toFixed(1)}/5</Text>
                    <Text style={styles.statLabel}>Avg. Mood</Text>
                  </View>
                )}
                <View style={styles.statItem}>
                  <Ionicons name="flame" size={24} color={COLORS.error} />
                  <Text style={styles.statValue}>{insights.streakDays}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>

              {/* Top Themes */}
              {insights.topThemes && insights.topThemes.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={styles.insightLabel}>Common Themes</Text>
                  <View style={styles.themesContainer}>
                    {insights.topThemes.map((item, index) => (
                      <View key={index} style={styles.themeTag}>
                        <Text style={styles.themeText}>{item.theme}</Text>
                        <Text style={styles.themeCount}>({item.count})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Common Patterns */}
              {insights.commonPatterns && insights.commonPatterns.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={styles.insightLabel}>Detected Patterns</Text>
                  <View style={styles.patternsContainer}>
                    {insights.commonPatterns.map((item, index) => (
                      <View key={index} style={styles.patternTag}>
                        <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
                        <Text style={styles.patternText}>{item.pattern}</Text>
                        <Text style={styles.patternCount}>({item.count})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </GlassCard>
          </View>
        )}

        {/* Individual Entry Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Entry Insights</Text>
            <Text style={styles.sectionSubtitle}>
              {entriesWithInsights.length} {entriesWithInsights.length === 1 ? 'entry' : 'entries'} with insights
            </Text>
          </View>

          {entriesWithInsights.length === 0 ? (
            <GlassCard style={styles.emptyCard} padding="lg">
              <View style={styles.emptyContent}>
                <Ionicons name="sparkles-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No insights yet</Text>
                <Text style={styles.emptyText}>
                  Write more journal entries to get Aurora's AI insights and feedback.
                </Text>
              </View>
            </GlassCard>
          ) : (
            entriesWithInsights.map((entry) => (
              <EntryInsightsCard key={entry._id} entry={entry} />
            ))
          )}
        </View>
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
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  overallInsightsCard: {
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  entryInsightsCard: {
    marginBottom: SPACING.md,
  },
  entryInsightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  entryInsightsDate: {
    flex: 1,
  },
  entryInsightsDateText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
  },
  entryInsightsTimeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  sentimentEmoji: {
    fontSize: 18,
  },
  sentimentText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  insightSection: {
    marginTop: SPACING.md,
  },
  insightLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  themeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  themeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  themeCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  patternsContainer: {
    gap: SPACING.sm,
  },
  patternTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  patternText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    flex: 1,
  },
  patternCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  feedbackText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  questionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
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
  journalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
  },
  journalSelectorImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  journalSelectorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalSelectorTextContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  journalSelectorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  journalSelectorPlaceholder: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    flex: 1,
  },
  journalSelectorTopics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  journalSelectorTopicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  journalSelectorTopicText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontSize: 9,
    maxWidth: 60,
  },
  journalSelectorTopicMore: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalListContent: {
    padding: SPACING.md,
  },
  modalJournalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.sm,
  },
  modalJournalImage: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  modalJournalIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  modalJournalInfo: {
    flex: 1,
  },
  modalJournalName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  modalJournalDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs / 2,
  },
  modalJournalTopics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  modalJournalTopicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  modalJournalTopicText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontSize: 10,
    maxWidth: 80,
  },
  modalJournalTopicMore: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  modalJournalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalJournalMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});
