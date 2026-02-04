import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, JournalEntry } from '../../src/services/journal.service';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

// Mood emoji mapping
const getMoodEmoji = (mood: number): string => {
  if (mood <= 2) return '😢';
  if (mood <= 4) return '😔';
  if (mood <= 6) return '😐';
  if (mood <= 8) return '🙂';
  return '😊';
};

// Mood color mapping
const getMoodColor = (mood: number): string => {
  if (mood <= 2) return '#F87171';
  if (mood <= 4) return '#FB923C';
  if (mood <= 6) return '#FBBF24';
  if (mood <= 8) return '#A3E635';
  return '#34D399';
};

// Severity colors
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'mild': return '#A3E635';
    case 'moderate': return '#FBBF24';
    case 'severe': return '#F87171';
    default: return COLORS.textMuted;
  }
};

const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case 'mild': return 'Licht';
    case 'moderate': return 'Matig';
    case 'severe': return 'Ernstig';
    default: return severity;
  }
};

// AI Insights Card Component
const AIInsightsCard: React.FC<{ insights: JournalEntry['aiInsights'] }> = ({ insights }) => {
  if (!insights) return null;

  const sentimentEmoji: Record<string, string> = {
    positive: '😊',
    neutral: '😐',
    negative: '😔',
    mixed: '🤔',
  };

  const sentimentLabel: Record<string, string> = {
    positive: 'Positief',
    neutral: 'Neutraal',
    negative: 'Negatief',
    mixed: 'Gemengd',
  };

  return (
    <GlassCard style={styles.insightsCard} padding="lg">
      <View style={styles.insightsHeader}>
        <View style={styles.insightsIconContainer}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.insightsTitle}>Aurora's Inzichten</Text>
      </View>

      {/* Sentiment */}
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Mood</Text>
        <View style={styles.sentimentBadge}>
          <Text style={styles.sentimentEmoji}>{sentimentEmoji[insights.sentiment]}</Text>
          <Text style={styles.sentimentText}>{sentimentLabel[insights.sentiment]}</Text>
        </View>
      </View>

      {/* Themes */}
      {insights.themes && insights.themes.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Themes</Text>
          <View style={styles.themesContainer}>
            {insights.themes.map((theme, index) => (
              <View key={index} style={styles.themeTag}>
                <Text style={styles.themeText}>{theme}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Cognitive Patterns */}
      {insights.cognitivePatterns && insights.cognitivePatterns.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Gedetecteerde patronen</Text>
          <View style={styles.patternsContainer}>
            {insights.cognitivePatterns.map((pattern, index) => (
              <View key={index} style={styles.patternTag}>
                <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
                <Text style={styles.patternText}>{pattern}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mental Health Support Feedback */}
      {insights.therapeuticFeedback && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Feedback</Text>
          <Text style={styles.feedbackText}>{insights.therapeuticFeedback}</Text>
        </View>
      )}

      {/* Follow-up Questions */}
      {insights.followUpQuestions && insights.followUpQuestions.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightLabel}>Vragen om over na te denken</Text>
          {insights.followUpQuestions.map((question, index) => (
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

export default function JournalEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    if (!id) return;
    
    try {
      const response = await journalService.getEntry(id);
      if (response.success && response.data) {
        setEntry(response.data);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Verwijderen',
      'Weet je zeker dat je deze entry wilt verwijderen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            const response = await journalService.deleteEntry(id);
            if (response.success) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleReanalyze = async () => {
    if (!id) return;
    
    setAnalyzing(true);
    try {
      const response = await journalService.analyzeEntry(id);
      if (response.success && response.data) {
        setEntry(response.data);
      }
    } catch (error) {
      Alert.alert('Fout', 'Kon analyse niet uitvoeren');
    } finally {
      setAnalyzing(false);
    }
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

  if (!entry) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Entry niet gevonden</Text>
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
        <Text style={styles.headerTitle}>Entry</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton} onPress={handleReanalyze}>
            <Ionicons
              name="refresh"
              size={22}
              color={analyzing ? COLORS.textMuted : COLORS.text}
            />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date & Mood Header */}
        <View style={styles.entryHeader}>
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>
              {format(parseISO(entry.createdAt), 'EEEE d MMMM yyyy', { locale: nl })}
            </Text>
            <Text style={styles.timeText}>
              {format(parseISO(entry.createdAt), 'HH:mm')}
            </Text>
          </View>
          <View style={[styles.moodBadge, { backgroundColor: `${getMoodColor(entry.mood)}20` }]}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
            <Text style={[styles.moodText, { color: getMoodColor(entry.mood) }]}>
              {entry.mood}/10
            </Text>
          </View>
        </View>

        {/* Prompt if available */}
        {entry.promptText && (
          <GlassCard style={styles.promptCard} padding="md">
            <View style={styles.promptHeader}>
              <Ionicons name="sparkles" size={14} color={COLORS.primary} />
              <Text style={styles.promptLabel}>Prompt</Text>
            </View>
            <Text style={styles.promptText}>{entry.promptText}</Text>
          </GlassCard>
        )}

        {/* Content */}
        <GlassCard style={styles.contentCard} padding="lg">
          <Text style={styles.contentText}>{entry.content}</Text>
        </GlassCard>

        {/* Symptoms */}
        {entry.symptoms && entry.symptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptomen</Text>
            <View style={styles.symptomsContainer}>
              {entry.symptoms.map((symptom, index) => (
                <View key={index} style={styles.symptomItem}>
                  <Text style={styles.symptomCondition}>
                    {symptom.type
                      ? `${symptom.condition} (${symptom.type})`
                      : symptom.condition}
                  </Text>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: `${getSeverityColor(symptom.severity)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        { color: getSeverityColor(symptom.severity) },
                      ]}
                    >
                      {getSeverityLabel(symptom.severity)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Insights */}
        {analyzing ? (
          <GlassCard style={styles.insightsCard} padding="lg">
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.analyzingText}>Aurora analyseert je entry...</Text>
            </View>
          </GlassCard>
        ) : (
          <AIInsightsCard insights={entry.aiInsights} />
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
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
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
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  dateSection: {},
  dateText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  promptCard: {
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  promptLabel: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.primary,
  },
  promptText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  contentCard: {
    marginBottom: SPACING.lg,
  },
  contentText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 26,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  symptomsContainer: {
    gap: SPACING.sm,
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  symptomCondition: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  severityText: {
    ...TYPOGRAPHY.captionMedium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
  },
  insightsCard: {
    marginBottom: SPACING.lg,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  insightsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  insightsTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  insightLabel: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.glass.backgroundLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  sentimentEmoji: {
    fontSize: 16,
  },
  sentimentText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
  },
  insightSection: {
    marginTop: SPACING.md,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  themeTag: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  themeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  patternsContainer: {
    gap: SPACING.sm,
  },
  patternTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  patternText: {
    ...TYPOGRAPHY.small,
    color: COLORS.warning,
  },
  feedbackText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  questionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  analyzingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
});






