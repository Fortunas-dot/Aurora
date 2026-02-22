import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, Avatar } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, JournalEntry } from '../../src/services/journal.service';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useAuthStore } from '../../src/store/authStore';
import { getFontFamily } from '../../src/utils/fontHelper';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

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
    case 'mild': return 'Mild';
    case 'moderate': return 'Moderate';
    case 'severe': return 'Severe';
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
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    mixed: 'Mixed',
  };

  // Get sentiment with fallback
  const sentiment = insights.sentiment || 'neutral';
  const emoji = sentimentEmoji[sentiment] || sentimentEmoji.neutral;
  const label = sentimentLabel[sentiment] || 'Neutral';

  return (
    <GlassCard style={styles.insightsCard} padding="lg">
      <View style={styles.insightsHeader}>
        <View style={styles.insightsIconContainer}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.insightsTitle}>Aurora's Insights</Text>
      </View>

      {/* Sentiment */}
      <View style={styles.insightSection}>
        <Text style={styles.insightLabel}>Sentiment</Text>
        <View style={styles.sentimentBadge}>
          <Text style={styles.sentimentEmoji}>{emoji}</Text>
          <Text style={styles.sentimentText}>{label}</Text>
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
          <Text style={styles.insightLabel}>Detected patterns</Text>
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
          <Text style={styles.insightLabel}>Questions to reflect on</Text>
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
  const { id, fromPublicJournal } = useLocalSearchParams<{ id: string; fromPublicJournal?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [isFullscreenBookPage, setIsFullscreenBookPage] = useState(false);
  
  // If coming from public journal view, always show book page style
  const showBookPageStyle = fromPublicJournal === 'true';
  
  // Check if this is the user's own entry
  // Use isOwner from backend response, or fallback to checking author
  const isOwnEntry = React.useMemo(() => {
    if (!entry) return false;
    
    // First, use isOwner from backend if available
    if (entry.isOwner !== undefined) {
      return entry.isOwner;
    }
    
    // Fallback: check author if isOwner is not provided
    if (!user) return false;
    
    if (typeof entry.author === 'object' && entry.author !== null) {
      const authorId = (entry.author as any)._id || (entry.author as any).id;
      return authorId === user._id;
    }
    
    if (typeof entry.author === 'string') {
      return entry.author === user._id;
    }
    
    return false;
  }, [entry, user]);

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
      'Delete',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
      Alert.alert('Error', 'Could not perform analysis');
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
          <Text style={styles.errorText}>Entry not found</Text>
        </View>
      </LinearGradient>
    );
  }

  // Get author info
  const author = entry && typeof entry.author === 'object' ? entry.author : null;
  const journal = entry && typeof entry.journal === 'object' ? entry.journal : null;
  const moodColor = entry ? getMoodColor(entry.mood) : COLORS.primary;

  // Debug logging
  console.log('Entry view debug:', {
    isOwnEntry,
    entryIsOwner: entry?.isOwner,
    authorId: typeof entry?.author === 'object' ? (entry.author as any)?._id : entry?.author,
    userId: user?._id,
  });

  // For entries from others (public journals) or when viewing from public journal view, show fullscreen book page directly
  if (!isOwnEntry || showBookPageStyle) {
    return (
      <View style={styles.fullscreenContainer}>
        {/* Book Page Background */}
        <Pressable 
          style={styles.fullscreenBookPage}
          onPress={() => router.back()}
        >
          {/* Book Binding Shadow */}
          <View style={styles.fullscreenBookBinding} />
          
          {/* Author Info at top */}
          {author && (
            <View style={[styles.fullscreenAuthorInfo, { top: insets.top + SPACING.md }]}>
              <Avatar
                uri={author.avatar}
                size={40}
                name={author.displayName || author.username}
                userId={author._id}
                avatarCharacter={author.avatarCharacter}
                avatarBackgroundColor={author.avatarBackgroundColor}
              />
              <View style={styles.fullscreenAuthorDetails}>
                <Text style={styles.fullscreenAuthorName} numberOfLines={1}>
                  {author.displayName || author.username}
                </Text>
                {journal && (
                  <Text style={styles.fullscreenJournalName} numberOfLines={1}>
                    {journal.name}
                  </Text>
                )}
                {/* Date in header */}
                <Text style={styles.fullscreenHeaderDate}>
                  {format(parseISO(entry.createdAt), 'EEEE d MMMM yyyy', { locale: enUS })}
                </Text>
                <Text style={styles.fullscreenHeaderTime}>
                  {format(parseISO(entry.createdAt), 'HH:mm')}
                </Text>
              </View>
            </View>
          )}
          
          {/* Close Button and Actions */}
          <View style={[styles.fullscreenHeaderActions, { top: insets.top + SPACING.md }]}>
            {/* Edit/Delete buttons for own entries */}
            {isOwnEntry && (
              <>
                <Pressable 
                  style={styles.fullscreenActionButton}
                  onPress={handleReanalyze}
                >
                  <Ionicons
                    name="refresh"
                    size={24}
                    color={analyzing ? "#8B7355" : "#6B5D4F"}
                  />
                </Pressable>
                <Pressable 
                  style={styles.fullscreenActionButton}
                  onPress={() => {
                    router.push({
                      pathname: '/journal/create',
                      params: { entryId: entry._id, journalId: typeof entry.journal === 'object' ? entry.journal?._id : entry.journal },
                    });
                  }}
                >
                  <Ionicons name="create-outline" size={24} color="#6B5D4F" />
                </Pressable>
                <Pressable 
                  style={styles.fullscreenActionButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={24} color="#8B4E4E" />
                </Pressable>
              </>
            )}
            {/* Close Button */}
            <Pressable 
              style={styles.fullscreenCloseButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color="#6B5D4F" />
            </Pressable>
          </View>
          
          {/* Page Content */}
          <ScrollView
            style={styles.fullscreenPageScrollView}
            contentContainerStyle={[
              styles.fullscreenPageContent,
              { paddingBottom: insets.bottom + SPACING.xl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Date Header */}
            <View style={styles.fullscreenDateHeader}>
              <Text style={styles.fullscreenDateText}>
                {format(parseISO(entry.createdAt), 'EEEE d MMMM yyyy', { locale: enUS })}
              </Text>
              <Text style={styles.fullscreenTimeText}>
                {format(parseISO(entry.createdAt), 'HH:mm')}
              </Text>
            </View>

            {/* Prompt if available */}
            {entry.promptText && (
              <View style={styles.fullscreenPromptContainer}>
                <Ionicons name="sparkles" size={14} color="#8B7355" style={styles.fullscreenPromptIcon} />
                <Text style={styles.fullscreenPromptText}>{entry.promptText}</Text>
              </View>
            )}

            {/* Media Items */}
            {entry.media && entry.media.length > 0 && (
              <View style={styles.fullscreenMediaItemsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fullscreenMediaScrollView}>
                  {entry.media.map((item, index) => (
                    <View key={index} style={styles.fullscreenMediaItemWrapper}>
                      {item.type === 'image' ? (
                        <Image source={{ uri: item.url }} style={styles.fullscreenMediaItemImage} />
                      ) : (
                        <View style={styles.fullscreenMediaItemVideo}>
                          <Ionicons name="videocam" size={32} color="#8B7355" />
                          <Text style={styles.fullscreenMediaItemVideoText}>Video</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Content Area */}
            <View style={styles.fullscreenContentContainer}>
              <Text style={[styles.fullscreenContentText, { fontFamily: getFontFamily(entry.fontFamily || 'palatino') }]}>
                {entry.content}
              </Text>
              
              {/* Book Lines Overlay */}
              <View style={styles.fullscreenLinesOverlay} pointerEvents="none">
                {Array.from({ length: 25 }).map((_, index) => (
                  <View key={index} style={styles.fullscreenBookLine} />
                ))}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </View>
    );
  }

  // For own entries, show normal view with expand option
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
              {format(parseISO(entry.createdAt), 'EEEE d MMMM yyyy', { locale: enUS })}
            </Text>
            <Text style={styles.timeText}>
              {format(parseISO(entry.createdAt), 'HH:mm')}
            </Text>
          </View>
          <View style={[styles.moodBadge, { backgroundColor: `${moodColor}20` }]}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
            <Text style={[styles.moodText, { color: moodColor }]}>
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

        {/* Content - Book Page Style */}
        <View style={styles.contentSection}>
          <View style={styles.bookPageContainer}>
            {/* Expand Icon */}
            <Pressable 
              style={styles.expandIcon}
              onPress={() => {
                // For own entries, we can still show the expand functionality if needed
                // But for now, we'll keep the normal view for own entries
                router.push({
                  pathname: '/journal/[id]',
                  params: { id: entry._id, fullscreen: 'true' },
                });
              }}
            >
              <Ionicons name="expand" size={20} color="#6B5D4F" />
            </Pressable>
            
            {/* Date Header */}
            <View style={styles.bookDateHeader}>
              <Text style={styles.bookDateText}>
                {format(parseISO(entry.createdAt), 'EEEE d MMMM yyyy', { locale: enUS })}
              </Text>
              <Text style={styles.bookTimeText}>
                {format(parseISO(entry.createdAt), 'HH:mm')}
              </Text>
            </View>

            {/* Media Items */}
            {entry.media && entry.media.length > 0 && (
              <View style={styles.mediaItemsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                  {entry.media.map((item, index) => (
                    <View key={index} style={styles.mediaItemWrapper}>
                      {item.type === 'image' ? (
                        <Image source={{ uri: item.url }} style={styles.mediaItemImage} />
                      ) : (
                        <View style={styles.mediaItemVideo}>
                          <Ionicons name="videocam" size={32} color="#8B7355" />
                          <Text style={styles.mediaItemVideoText}>Video</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Prompt if available */}
            {entry.promptText && (
              <View style={styles.bookPromptContainer}>
                <Ionicons name="sparkles" size={14} color="#8B7355" style={styles.bookPromptIcon} />
                <Text style={styles.bookPromptText}>{entry.promptText}</Text>
              </View>
            )}
            
            <View style={styles.bookPageContent}>
              <Text style={[styles.bookPageText, { fontFamily: getFontFamily(entry.fontFamily || 'palatino') }]}>
                {entry.content}
              </Text>
              
              {/* Book Lines Overlay */}
              <View style={styles.bookLinesOverlay} pointerEvents="none">
                {Array.from({ length: 12 }).map((_, index) => (
                  <View key={index} style={styles.bookLine} />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Audio Indicator */}
        {entry.audioUrl && (
          <GlassCard style={styles.audioCard} padding="md">
            <View style={styles.audioInfo}>
              <LinearGradient
                colors={[`${COLORS.primary}30`, `${COLORS.primary}15`]}
                style={styles.audioIconBg}
              >
                <Ionicons name="mic" size={20} color={COLORS.primary} />
              </LinearGradient>
              <View style={styles.audioTextContainer}>
                <Text style={styles.audioLabel}>Voice Entry</Text>
                {entry.transcription && (
                  <Text style={styles.audioTranscription} numberOfLines={2}>
                    {entry.transcription}
                  </Text>
                )}
              </View>
            </View>
          </GlassCard>
        )}

        {/* Symptoms */}
        {entry.symptoms && entry.symptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
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
              <Text style={styles.analyzingText}>Aurora is analyzing your entry...</Text>
            </View>
          </GlassCard>
        ) : (
          <AIInsightsCard insights={entry.aiInsights} />
        )}
      </ScrollView>

      {/* Fullscreen Book Page Modal (for own entries) */}
      <Modal
        visible={isFullscreenBookPage}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullscreenBookPage(false)}
      >
        <View style={styles.fullscreenContainer}>
          {/* Book Page Background */}
          <Pressable 
            style={styles.fullscreenBookPage}
            onPress={() => setIsFullscreenBookPage(false)}
          >
            {/* Book Binding Shadow */}
            <View style={styles.fullscreenBookBinding} />
            
            {/* Close Button */}
            <Pressable 
              style={[styles.fullscreenCloseButton, { top: insets.top + SPACING.md }]}
              onPress={() => setIsFullscreenBookPage(false)}
            >
              <Ionicons name="close" size={28} color="#6B5D4F" />
            </Pressable>
            
            {/* Page Content */}
            <ScrollView
              style={styles.fullscreenPageScrollView}
              contentContainerStyle={[
                styles.fullscreenPageContent,
                { paddingBottom: insets.bottom + SPACING.xl },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Header */}
              <View style={styles.fullscreenDateHeader}>
                <Text style={styles.fullscreenDateText}>
                  {format(parseISO(entry.createdAt), 'EEEE d MMMM yyyy', { locale: enUS })}
                </Text>
                <Text style={styles.fullscreenTimeText}>
                  {format(parseISO(entry.createdAt), 'HH:mm')}
                </Text>
              </View>

              {/* Prompt if available */}
              {entry.promptText && (
                <View style={styles.fullscreenPromptContainer}>
                  <Ionicons name="sparkles" size={14} color="#8B7355" style={styles.fullscreenPromptIcon} />
                  <Text style={styles.fullscreenPromptText}>{entry.promptText}</Text>
                </View>
              )}

              {/* Media Items */}
              {entry.media && entry.media.length > 0 && (
                <View style={styles.fullscreenMediaItemsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fullscreenMediaScrollView}>
                    {entry.media.map((item, index) => (
                      <View key={index} style={styles.fullscreenMediaItemWrapper}>
                        {item.type === 'image' ? (
                          <Image source={{ uri: item.url }} style={styles.fullscreenMediaItemImage} />
                        ) : (
                          <View style={styles.fullscreenMediaItemVideo}>
                            <Ionicons name="videocam" size={32} color="#8B7355" />
                            <Text style={styles.fullscreenMediaItemVideoText}>Video</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Content Area */}
              <View style={styles.fullscreenContentContainer}>
                <Text style={[styles.fullscreenContentText, { fontFamily: getFontFamily(entry.fontFamily || 'palatino') }]}>
                  {entry.content}
                </Text>
                
                {/* Book Lines Overlay */}
                <View style={styles.fullscreenLinesOverlay} pointerEvents="none">
                  {Array.from({ length: 25 }).map((_, index) => (
                    <View key={index} style={styles.fullscreenBookLine} />
                  ))}
                </View>
              </View>
            </ScrollView>
          </Pressable>
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
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  dateSection: {
    flex: 1,
  },
  dateText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textTransform: 'capitalize',
    marginBottom: SPACING.xs,
  },
  timeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  promptCard: {
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderColor: 'rgba(96, 165, 250, 0.25)',
    borderWidth: 1,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  promptLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  promptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  authorCard: {
    marginBottom: SPACING.lg,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  journalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  journalName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  contentSection: {
    marginBottom: SPACING.xl,
  },
  bookPageContainer: {
    backgroundColor: '#F5F1E8', // Paper color
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    minHeight: 300,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0D5C4',
  },
  expandIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
    padding: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BORDER_RADIUS.sm,
  },
  bookDateHeader: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C4',
  },
  bookDateText: {
    fontSize: 14,
    fontFamily: 'Palatino',
    color: '#6B5D4F',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  bookTimeText: {
    fontSize: 12,
    fontFamily: 'Palatino',
    color: '#8B7355',
    fontStyle: 'italic',
  },
  bookPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E8D8',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E0D5C4',
  },
  bookPromptIcon: {
    marginRight: SPACING.sm,
  },
  bookPromptText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Palatino',
    color: '#6B5D4F',
    lineHeight: 18,
  },
  mediaItemsContainer: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  mediaScrollView: {
    flexGrow: 0,
  },
  mediaItemWrapper: {
    marginRight: SPACING.sm,
    position: 'relative',
  },
  mediaItemImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#E0D5C4',
  },
  mediaItemVideo: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#E0D5C4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4C5B0',
  },
  mediaItemVideoText: {
    ...TYPOGRAPHY.caption,
    color: '#8B7355',
    fontSize: 10,
    marginTop: SPACING.xs,
  },
  bookPageContent: {
    position: 'relative',
    minHeight: 200,
    marginTop: SPACING.md,
  },
  bookPageText: {
    fontSize: 15,
    fontFamily: 'Palatino',
    color: '#4A3E2F',
    lineHeight: 22,
    zIndex: 2,
    position: 'relative',
  },
  bookLinesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 264, // 12 lines * 22px
    zIndex: 0,
    justifyContent: 'flex-start',
  },
  bookLine: {
    height: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
    marginBottom: 0,
  },
  // Fullscreen Modal Styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#E8E0D6', // Book cover color
  },
  fullscreenBookPage: {
    flex: 1,
    backgroundColor: '#F5F1E8', // Paper color
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  fullscreenBookBinding: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#D4C5B0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fullscreenHeaderActions: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 100,
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  fullscreenActionButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fullscreenCloseButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fullscreenPageScrollView: {
    flex: 1,
  },
  fullscreenPageContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl + 100, // Extra padding for header (author info + close button)
    paddingLeft: SPACING.xl + 12, // Extra padding to account for binding
  },
  fullscreenDateHeader: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C4',
  },
  fullscreenDateText: {
    fontSize: 16,
    fontFamily: 'Palatino',
    color: '#6B5D4F',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  fullscreenTimeText: {
    fontSize: 12,
    fontFamily: 'Palatino',
    color: '#8B7355',
    fontStyle: 'italic',
  },
  fullscreenPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E8D8',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E0D5C4',
  },
  fullscreenPromptIcon: {
    marginRight: SPACING.sm,
  },
  fullscreenPromptText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Palatino',
    color: '#6B5D4F',
    lineHeight: 20,
  },
  fullscreenMediaItemsContainer: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  fullscreenMediaScrollView: {
    flexGrow: 0,
  },
  fullscreenMediaItemWrapper: {
    marginRight: SPACING.md,
    position: 'relative',
  },
  fullscreenMediaItemImage: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#E0D5C4',
  },
  fullscreenMediaItemVideo: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#E0D5C4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4C5B0',
  },
  fullscreenMediaItemVideoText: {
    ...TYPOGRAPHY.caption,
    color: '#8B7355',
    marginTop: SPACING.xs,
  },
  fullscreenContentContainer: {
    position: 'relative',
    minHeight: 600,
  },
  fullscreenContentText: {
    fontSize: 16,
    fontFamily: 'Palatino',
    color: '#4A3E2F',
    lineHeight: 24,
    zIndex: 2,
    position: 'relative',
  },
  fullscreenLinesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 600, // 25 lines * 24px
    zIndex: 0,
    justifyContent: 'flex-start',
  },
  fullscreenBookLine: {
    height: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
    marginBottom: 0,
  },
  fullscreenAuthorInfo: {
    position: 'absolute',
    left: SPACING.xl + 12, // Account for binding
    right: SPACING.xl + 100, // Leave space for action buttons
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    zIndex: 50,
    maxWidth: '70%', // Prevent overlap with close button
  },
  fullscreenAuthorDetails: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  fullscreenAuthorName: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#6B5D4F',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  fullscreenJournalName: {
    ...TYPOGRAPHY.caption,
    color: '#8B7355',
    fontSize: 13,
    marginBottom: 4,
  },
  fullscreenHeaderDate: {
    fontSize: 14,
    fontFamily: 'Palatino',
    color: '#6B5D4F',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 2,
  },
  fullscreenHeaderTime: {
    fontSize: 12,
    fontFamily: 'Palatino',
    color: '#8B7355',
    fontStyle: 'italic',
  },
  mediaSection: {
    marginBottom: SPACING.lg,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mediaItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.glass.background,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.glass.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioCard: {
    marginBottom: SPACING.lg,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  audioIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioTextContainer: {
    flex: 1,
  },
  audioLabel: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  audioTranscription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontWeight: '600',
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
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
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






