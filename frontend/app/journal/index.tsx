import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, Avatar } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, JournalEntry, JournalPrompt, JournalInsights, Journal } from '../../src/services/journal.service';
import { getFontFamily } from '../../src/utils/fontHelper';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useConsentStore } from '../../src/store/consentStore';
import { AiConsentCard } from '../../src/components/legal/AiConsentCard';

// Typewriter effect component
const TypewriterText: React.FC<{
  text: string;
  delay?: number;
  style?: any;
  onComplete?: () => void;
  shouldStart?: boolean;
}> = ({ text, delay = 0, style, onComplete, shouldStart = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Cleanup any existing timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!shouldStart) {
      setDisplayedText('');
      setIsTyping(false);
      hasStartedRef.current = false;
      return;
    }

    // Start typewriter if shouldStart is true and we haven't started yet
    if (shouldStart && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setIsTyping(true);
      setDisplayedText('');
      
      timeoutRef.current = setTimeout(() => {
        let currentIndex = 0;
        
        intervalRef.current = setInterval(() => {
          if (currentIndex < text.length) {
            setDisplayedText(text.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsTyping(false);
            if (onComplete) {
              onComplete();
            }
          }
        }, 50); // 50ms per character
      }, delay);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text, delay, onComplete, shouldStart]);

  // If not starting, show full text immediately
  if (!shouldStart) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {displayedText}
      {isTyping && <Text style={{ opacity: 0.5 }}>|</Text>}
    </Text>
  );
};

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
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMMM', { locale: enUS });
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
        <Text 
          style={[
            styles.entryContent, 
            { fontFamily: getFontFamily(entry.fontFamily || 'palatino') }
          ]} 
          numberOfLines={4}
        >
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
            <Text style={styles.readMoreText}>Read more</Text>
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
    <GlassCard style={styles.promptCard} padding="md">
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
              <Text style={styles.promptBadgeText}>Today</Text>
            </View>
          </View>
      </View>
      <Text style={styles.promptText}>{prompt.text}</Text>
      <View style={styles.promptAction}>
        <View style={styles.promptActionContent}>
          <Text style={styles.promptActionText}>Start writing</Text>
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
    <GlassCard style={styles.statsCard} padding="md">
      <LinearGradient
        colors={['rgba(96, 165, 250, 0.1)', 'rgba(167, 139, 250, 0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.statsTitle}>Your Progress</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.warning}20` }]}>
            <Ionicons name="flame" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.statValue}>{insights.streakDays}</Text>
          <Text style={styles.statLabel}>day streak</Text>
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
          <Text style={styles.statLabel}>avg. mood</Text>
        </View>
      </View>
    </GlassCard>
  );
};

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { aiConsentStatus, loadConsent, grantAiConsent, denyAiConsent } = useConsentStore();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [insights, setInsights] = useState<JournalInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const hasInitialLoadRef = useRef(false);
  const isLoadingJournalsRef = useRef(false);
  const [showTypewriter, setShowTypewriter] = useState(false);

  const loadJournals = useCallback(async (skipLoadingState = false) => {
    // Prevent multiple simultaneous calls
    if (isLoadingJournalsRef.current) {
      return;
    }
    
    isLoadingJournalsRef.current = true;
    
    try {
      if (!skipLoadingState) {
        setLoading(true);
      }
      const response = await journalService.getUserJournals(1, 100);
      if (response.success && response.data) {
        setJournals(response.data);
        // Auto-select first journal if available and no journal is selected
        if (response.data.length > 0) {
          const newSelectedJournal = response.data[0];
          setSelectedJournal((prev) => prev || newSelectedJournal);
          // If we're skipping loading state (subsequent loads), don't change loading
          // Otherwise, loadData will handle setting loading to false
          if (skipLoadingState) {
            setLoading(false);
          }
        } else {
          setSelectedJournal(null);
          setLoading(false);
        }
      } else {
        setSelectedJournal(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading journals:', error);
      if (!skipLoadingState) {
        setLoading(false);
      }
    } finally {
      isLoadingJournalsRef.current = false;
    }
  }, []);

  const loadData = useCallback(async (journalId: string) => {
    try {
      setLoading(true);
      const [entriesRes, promptRes, insightsRes] = await Promise.all([
        journalService.getEntries(1, 10, { journalId }),
        // Only load AI-powered prompt & insights when consent is granted
        aiConsentStatus === 'granted' ? journalService.getPrompt() : Promise.resolve({ success: false }),
        aiConsentStatus === 'granted' ? journalService.getInsights(30, journalId) : Promise.resolve({ success: false }),
      ]);

      if (entriesRes.success && entriesRes.data) {
        setEntries(entriesRes.data);
      }
      if (promptRes && (promptRes as any).success && (promptRes as any).data) {
        setPrompt((promptRes as any).data);
      } else {
        setPrompt(null);
      }
      if (insightsRes && (insightsRes as any).success && (insightsRes as any).data) {
        setInsights((insightsRes as any).data);
      } else {
        setInsights(null);
      }
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      // Trigger typewriter effect after data is loaded (only on initial load)
      if (!hasTriggeredTypewriterRef.current) {
        setTimeout(() => {
          setShowTypewriter(true);
          hasTriggeredTypewriterRef.current = true;
        }, 500);
      }
    }
  }, [aiConsentStatus]);

  useFocusEffect(
    useCallback(() => {
      loadConsent().catch(console.error);
      // Only load journals on initial focus, not every time we navigate back
      if (!hasInitialLoadRef.current) {
        hasInitialLoadRef.current = true;
        hasTriggeredTypewriterRef.current = false; // Reset typewriter trigger for initial load
        setShowTypewriter(false); // Reset typewriter state
        loadJournals(false);
      } else {
        // On subsequent focuses, only refresh data if we have a selected journal
        // Don't reload journals list to avoid unnecessary loading state
        if (selectedJournal) {
          loadData(selectedJournal._id);
        }
        // Don't reset typewriter on subsequent focuses - keep it showing
      }
    }, [loadJournals, loadConsent, selectedJournal, loadData])
  );

  useEffect(() => {
    if (selectedJournal) {
      loadData(selectedJournal._id);
    } else if (journals.length === 0) {
      setLoading(false);
    }
  }, [selectedJournal, loadData, journals.length]);

  // Trigger typewriter effect when data is loaded (only on initial load)
  const hasTriggeredTypewriterRef = useRef(false);

  const onRefresh = useCallback(() => {
    if (selectedJournal) {
      setRefreshing(true);
      loadData(selectedJournal._id);
    }
  }, [loadData, selectedJournal]);

  const handleNewEntry = (promptData?: JournalPrompt) => {
    if (!selectedJournal) {
      Alert.alert('No Journal', 'Please create or select a journal first');
      return;
    }

    if (promptData) {
      router.push({
        pathname: '/journal/create',
        params: { 
          journalId: selectedJournal._id,
          promptId: promptData.id, 
          promptText: promptData.text 
        },
      });
    } else {
      router.push({
        pathname: '/journal/create',
        params: { journalId: selectedJournal._id },
      });
    }
  };


  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`/journal/${entry._id}`);
  };

  const handleInsightsPress = () => {
    router.push('/journal/insights');
  };

  // Show journal selection/creation screen if no journals
  if (!loading && journals.length === 0) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Journal</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/journal/browse')}
          >
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.emptyJournalContainer}>
          <GlassCard style={styles.emptyJournalCard} padding="xl">
            <View style={styles.emptyJournalContent}>
              <Ionicons name="book-outline" size={64} color={COLORS.primary} />
              <Text style={styles.emptyJournalTitle}>Create Your First Journal</Text>
              <Text style={styles.emptyJournalText}>
                Start your journey by creating a private or public journal
              </Text>
              <GlassButton
                title="Create Journal"
                onPress={() => router.push('/journal/create-journal')}
                style={styles.createJournalButton}
                size="lg"
              />
              <Pressable
                style={styles.browseButton}
                onPress={() => router.push('/journal/browse')}
              >
                <Text style={styles.browseButtonText}>Browse Public Journals</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </LinearGradient>
    );
  }

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
        <Pressable
          style={styles.journalSelector}
          onPress={() => setShowJournalModal(true)}
        >
          {selectedJournal && (
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
              <Text style={styles.journalSelectorText} numberOfLines={1}>
                {selectedJournal.name}
              </Text>
            </>
          )}
          <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
        </Pressable>
        <View style={styles.headerRight}>
          {selectedJournal && (
            <Pressable
              style={styles.headerButton}
              onPress={() => router.push(`/journal/settings?journalId=${selectedJournal._id}`)}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            </Pressable>
          )}
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/journal/browse')}
          >
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={handleInsightsPress}
          >
            <Ionicons name="analytics" size={24} color={COLORS.text} />
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
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        decelerationRate="normal"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* AI Consent (for prompts & insights) */}
        {aiConsentStatus !== 'granted' && (
          <AiConsentCard
            onAccept={grantAiConsent}
            onDecline={denyAiConsent}
          />
        )}

        {/* Daily Prompt (AI-powered, only when consent granted) */}
        {aiConsentStatus === 'granted' && prompt && (
          <View style={styles.section}>
            <TypewriterText 
              key={`today-${showTypewriter}`}
              text="Today" 
              delay={0}
              style={styles.sectionTitle}
              shouldStart={showTypewriter}
            />
            <PromptCard prompt={prompt} onPress={() => handleNewEntry(prompt)} />
          </View>
        )}

        {/* Quick Stats (AI-powered insights, only when consent granted) */}
        {aiConsentStatus === 'granted' && insights && insights.totalEntries > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TypewriterText 
                key={`statistics-${showTypewriter}`}
                text="Statistics" 
                delay={800}
                style={styles.sectionTitle}
                shouldStart={showTypewriter}
              />
              <Pressable onPress={handleInsightsPress}>
                <Text style={styles.sectionLink}>View all</Text>
              </Pressable>
            </View>
            <StatsCard insights={insights} />
          </View>
        )}

        {/* Recent Entries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TypewriterText 
              key={`recent-entries-${showTypewriter}`}
              text="Recent Entries" 
              delay={1600}
              style={styles.sectionTitle}
              shouldStart={showTypewriter}
            />
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <GlassCard style={styles.emptyCard} padding="lg">
                <View style={styles.emptyContent}>
                  <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>No entries yet</Text>
                  <Text style={styles.emptyText} numberOfLines={0}>
                    Start writing to explore your thoughts and feelings
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
          <Ionicons name="create" size={28} color={COLORS.white} />
        </LinearGradient>
      </Pressable>

      {/* Journal Selection Modal */}
      <Modal
        visible={showJournalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJournalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + SPACING.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Journal</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowJournalModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            <FlatList
              data={journals}
              keyExtractor={(item) => item._id}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              updateCellsBatchingPeriod={50}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalJournalItem}
                  onPress={() => {
                    setSelectedJournal(item);
                    setShowJournalModal(false);
                  }}
                >
                  {item.coverImage ? (
                    <Image
                      source={{ uri: item.coverImage }}
                      style={styles.modalJournalImage}
                    />
                  ) : (
                    <View style={styles.modalJournalIcon}>
                      <Ionicons name="book" size={24} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={styles.modalJournalInfo}>
                    <Text style={styles.modalJournalName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.modalJournalDescription} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                    <View style={styles.modalJournalMeta}>
                      <Ionicons
                        name={item.isPublic ? 'globe' : 'lock-closed'}
                        size={14}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.modalJournalMetaText}>
                        {item.entriesCount || 0} entries
                      </Text>
                    </View>
                  </View>
                  {selectedJournal?._id === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </Pressable>
              )}
              ListFooterComponent={
                <Pressable
                  style={styles.modalCreateButton}
                  onPress={() => {
                    setShowJournalModal(false);
                    router.push('/journal/create-journal');
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.modalCreateButtonText}>Create New Journal</Text>
                </Pressable>
              }
              contentContainerStyle={styles.modalListContent}
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: SPACING.sm,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.md,
    lineHeight: 24,
    fontSize: 15,
  },
  promptAction: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
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
    marginBottom: SPACING.md,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
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
    paddingHorizontal: SPACING.xl,
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
  emptyJournalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyJournalCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyJournalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyJournalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyJournalText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  createJournalButton: {
    marginBottom: SPACING.md,
  },
  browseButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  browseButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
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
  journalSelectorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
    paddingHorizontal: SPACING.md,
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
  modalJournalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalJournalMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  modalCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  modalCreateButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
});






