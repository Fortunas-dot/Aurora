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
}> = ({ entry, onPress }) => (
  <GlassCard style={styles.entryCard} onPress={onPress} padding="md">
    <View style={styles.entryHeader}>
      <View style={styles.entryDateContainer}>
        <Text style={styles.entryDate}>{formatEntryDate(entry.createdAt)}</Text>
        <Text style={styles.entryTime}>
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

    <Text style={styles.entryContent} numberOfLines={3}>
      {entry.content}
    </Text>

    {entry.aiInsights?.themes && entry.aiInsights.themes.length > 0 && (
      <View style={styles.themesContainer}>
        {entry.aiInsights.themes.slice(0, 3).map((theme, index) => (
          <View key={index} style={styles.themeTag}>
            <Text style={styles.themeText}>{theme}</Text>
          </View>
        ))}
      </View>
    )}

    {entry.audioUrl && (
      <View style={styles.voiceIndicator}>
        <Ionicons name="mic" size={14} color={COLORS.primary} />
        <Text style={styles.voiceText}>Voice entry</Text>
      </View>
    )}
  </GlassCard>
);

// Prompt Card Component
const PromptCard: React.FC<{
  prompt: JournalPrompt;
  onPress: () => void;
}> = ({ prompt, onPress }) => (
  <GlassCard style={styles.promptCard} onPress={onPress} padding="lg">
    <LinearGradient
      colors={['rgba(96, 165, 250, 0.15)', 'rgba(167, 139, 250, 0.15)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.promptHeader}>
      <View style={styles.promptIconContainer}>
        <Ionicons name="sparkles" size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.promptCategory}>{prompt.category}</Text>
    </View>
    <Text style={styles.promptText}>{prompt.text}</Text>
    <View style={styles.promptAction}>
      <Text style={styles.promptActionText}>Begin te schrijven</Text>
      <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
    </View>
  </GlassCard>
);

// Stats Card Component
const StatsCard: React.FC<{ insights: JournalInsights | null }> = ({ insights }) => {
  if (!insights) return null;

  return (
    <GlassCard style={styles.statsCard} padding="md">
      <Text style={styles.statsTitle}>Jouw statistieken</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.streakDays}</Text>
          <Text style={styles.statLabel}>dagen streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.totalEntries}</Text>
          <Text style={styles.statLabel}>entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {insights.averageMood ? `${insights.averageMood}` : '-'}
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
            <GlassCard style={styles.emptyCard} padding="lg">
              <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Nog geen entries</Text>
              <Text style={styles.emptyText}>
                Begin met schrijven om je gedachten en gevoelens te verkennen
              </Text>
            </GlassCard>
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={entry._id}
                entry={entry}
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
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  promptIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  promptCategory: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    lineHeight: 26,
  },
  promptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  promptActionText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  statsCard: {
    marginTop: -SPACING.md,
  },
  statsTitle: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  entryCard: {
    marginBottom: SPACING.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  entryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  moodEmoji: {
    fontSize: 14,
  },
  moodText: {
    ...TYPOGRAPHY.captionMedium,
  },
  entryContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
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
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  voiceText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
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






