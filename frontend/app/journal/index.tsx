import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, JournalEntry, JournalPrompt, JournalInsights } from '../../src/services/journal.service';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
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

// Format date for display
const formatEntryDate = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Vandaag';
  if (isYesterday(date)) return 'Gisteren';
  return format(date, 'd MMMM', { locale: nl });
};

// Entry Card Component
const EntryCard: React.FC<{
  entry: JournalEntry;
  onPress: () => void;
  index: number;
}> = ({ entry, onPress, index }) => {
  const moodColor = getMoodColor(entry.mood);
  const gradientColors = [
    `${moodColor}15`,
    `${moodColor}08`,
    'transparent',
  ];

  return (
    <Pressable onPress={onPress} style={styles.entryCardWrapper}>
      {/* Timeline connector */}
      {index < 10 && (
        <View style={[styles.timelineConnector, { borderLeftColor: `${moodColor}30` }]} />
      )}
      
      <GlassCard style={styles.entryCard} padding="lg">
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Header with date and mood */}
        <View style={styles.entryHeader}>
          <View style={styles.entryDateContainer}>
            <View style={[styles.dateDot, { backgroundColor: moodColor }]} />
            <View>
              <Text style={styles.entryDate}>{formatEntryDate(entry.createdAt)}</Text>
              <Text style={styles.entryTime}>
                {format(parseISO(entry.createdAt), 'HH:mm')}
              </Text>
            </View>
          </View>
          
          <View style={[styles.moodBadge, { backgroundColor: `${moodColor}25` }]}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
            <View style={styles.moodScoreContainer}>
              <View style={[styles.moodBar, { 
                width: `${(entry.mood / 10) * 100}%`,
                backgroundColor: moodColor,
              }]} />
            </View>
            <Text style={[styles.moodText, { color: moodColor }]}>
              {entry.mood}/10
            </Text>
          </View>
        </View>

        {/* Content with better styling */}
        <Text style={styles.entryContent} numberOfLines={4}>
          {entry.content}
        </Text>

        {/* AI Insights Themes */}
        {entry.aiInsights?.themes && entry.aiInsights.themes.length > 0 && (
          <View style={styles.themesContainer}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} style={styles.themesIcon} />
            {entry.aiInsights.themes.slice(0, 3).map((theme, idx) => (
              <View key={idx} style={[styles.themeTag, { backgroundColor: `${moodColor}20` }]}>
                <Text style={[styles.themeText, { color: moodColor }]}>{theme}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer with indicators */}
        <View style={styles.entryFooter}>
          {entry.audioUrl && (
            <View style={styles.voiceIndicator}>
              <LinearGradient
                colors={[`${COLORS.primary}30`, `${COLORS.primary}15`]}
                style={styles.voiceIndicatorBg}
              >
                <Ionicons name="mic" size={14} color={COLORS.primary} />
                <Text style={styles.voiceText}>Voice</Text>
              </LinearGradient>
            </View>
          )}
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Lees meer</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
};

// Prompt Card Component
const PromptCard: React.FC<{
  prompt: JournalPrompt;
  onPress: () => void;
}> = ({ prompt, onPress }) => (
  <Pressable onPress={onPress}>
    <GlassCard style={styles.promptCard} padding="lg">
      <LinearGradient
        colors={['rgba(96, 165, 250, 0.2)', 'rgba(167, 139, 250, 0.15)', 'rgba(94, 234, 212, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.promptHeader}>
        <View style={styles.promptIconContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.promptIconGradient}
          >
            <Ionicons name="sparkles" size={20} color={COLORS.white} />
          </LinearGradient>
        </View>
        <View style={styles.promptCategoryContainer}>
          <Text style={styles.promptCategory}>{prompt.category}</Text>
          <View style={styles.promptBadge}>
            <Text style={styles.promptBadgeText}>Vandaag</Text>
          </View>
        </View>
      </View>
      <Text style={styles.promptText}>{prompt.text}</Text>
      <View style={styles.promptAction}>
        <View style={styles.promptActionContent}>
          <Text style={styles.promptActionText}>Begin te schrijven</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </View>
      </View>
    </GlassCard>
  </Pressable>
);

// Stats Card Component
const StatsCard: React.FC<{ insights: JournalInsights | null }> = ({ insights }) => {
  if (!insights) return null;

  const averageMoodColor = insights.averageMood 
    ? getMoodColor(insights.averageMood) 
    : COLORS.textMuted;

  return (
    <GlassCard style={styles.statsCard} padding="lg">
      <LinearGradient
        colors={['rgba(96, 165, 250, 0.1)', 'rgba(167, 139, 250, 0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.statsTitle}>Jouw voortgang</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.warning}20` }]}>
            <Ionicons name="flame" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.statValue}>{insights.streakDays}</Text>
          <Text style={styles.statLabel}>dagen streak</Text>
          {insights.streakDays > 0 && (
            <View style={styles.streakIndicator}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            </View>
          )}
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
            <Ionicons name="journal" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>{insights.totalEntries}</Text>
          <Text style={styles.statLabel}>entries</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: `${averageMoodColor}20` }]}>
            <Text style={styles.statEmoji}>
              {insights.averageMood ? getMoodEmoji(insights.averageMood) : '😐'}
            </Text>
          </View>
          <Text style={[styles.statValue, { color: averageMoodColor }]}>
            {insights.averageMood ? insights.averageMood.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statLabel}>gem. stemming</Text>
        </View>
      </View>
    </GlassCard>
  );
};

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [insights, setInsights] = useState<JournalInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [entriesRes, promptRes, insightsRes] = await Promise.all([
        journalService.getEntries(1, 10),
        journalService.getPrompt(),
        journalService.getInsights(30),
      ]);

      if (entriesRes.success && entriesRes.data) {
        setEntries(entriesRes.data);
      }
      if (promptRes.success && promptRes.data) {
        setPrompt(promptRes.data);
      }
      if (insightsRes.success && insightsRes.data) {
        setInsights(insightsRes.data);
      }
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleNewEntry = (promptData?: JournalPrompt) => {
    if (promptData) {
      router.push({
        pathname: '/journal/create',
        params: { promptId: promptData.id, promptText: promptData.text },
      });
    } else {
      router.push('/journal/create');
    }
  };

  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`/journal/${entry._id}`);
  };

  const handleInsightsPress = () => {
    router.push('/journal/insights');
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
        <Text style={styles.headerTitle}>Dagboek</Text>
        <Pressable
          style={styles.headerButton}
          onPress={handleInsightsPress}
        >
          <Ionicons name="analytics" size={24} color={COLORS.text} />
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
        {/* Daily Prompt */}
        {prompt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vandaag</Text>
            <PromptCard prompt={prompt} onPress={() => handleNewEntry(prompt)} />
          </View>
        )}

        {/* Quick Stats */}
        {insights && insights.totalEntries > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statistieken</Text>
              <Pressable onPress={handleInsightsPress}>
                <Text style={styles.sectionLink}>Bekijk alles</Text>
              </Pressable>
            </View>
            <StatsCard insights={insights} />
          </View>
        )}

        {/* Recent Entries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recente entries</Text>
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <GlassCard style={styles.emptyCard} padding="lg">
                <View style={styles.emptyContent}>
                  <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>Nog geen entries</Text>
                  <Text style={styles.emptyText} numberOfLines={0}>
                    Begin met schrijven om je gedachten en gevoelens te verkennen
                  </Text>
                </View>
              </GlassCard>
            </View>
          ) : (
            entries.map((entry, index) => (
              <EntryCard
                key={entry._id}
                entry={entry}
                index={index}
                onPress={() => handleEntryPress(entry)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + SPACING.lg }]}
        onPress={() => handleNewEntry()}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </LinearGradient>
      </Pressable>
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionLink: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
  },
  promptCard: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  promptIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: SPACING.md,
  },
  promptIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptCategoryContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  promptCategory: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    fontSize: 12,
  },
  promptBadge: {
    backgroundColor: `${COLORS.accent}25`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  promptBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  promptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    lineHeight: 26,
    fontSize: 16,
  },
  promptAction: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  promptActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  promptActionText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsCard: {
    marginTop: -SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  statsTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 11,
  },
  streakIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  entryCardWrapper: {
    position: 'relative',
    marginBottom: SPACING.lg,
    marginLeft: SPACING.md,
  },
  timelineConnector: {
    position: 'absolute',
    left: -SPACING.md - 1,
    top: 0,
    bottom: -SPACING.lg,
    width: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  entryCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
    marginTop: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  entryDateContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  entryDate: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  entryTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  moodBadge: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
  },
  moodEmoji: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  moodScoreContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  moodBar: {
    height: '100%',
    borderRadius: 2,
  },
  moodText: {
    ...TYPOGRAPHY.captionMedium,
    fontSize: 11,
    fontWeight: '600',
  },
  entryContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  themesIcon: {
    marginRight: SPACING.xs,
  },
  themeTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  themeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '500',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceIndicatorBg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  voiceText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    minHeight: 200,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    width: '100%',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: SPACING.md,
    lineHeight: 22,
    flexShrink: 1,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});






