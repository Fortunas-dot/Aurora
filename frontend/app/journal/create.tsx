import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, ISymptom, SeverityLevel } from '../../src/services/journal.service';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useVoiceJournaling, formatDuration } from '../../src/hooks/useVoiceJournaling';
import { getFontFamily } from '../../src/utils/fontHelper';

// Mood selector component
const MoodSelector: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const moods = [
    { value: 1, emoji: '😢', label: 'Very bad' },
    { value: 2, emoji: '😞', label: 'Bad' },
    { value: 3, emoji: '😔', label: 'Down' },
    { value: 4, emoji: '😕', label: 'Low' },
    { value: 5, emoji: '😐', label: 'Neutral' },
    { value: 6, emoji: '🙂', label: 'Okay' },
    { value: 7, emoji: '😊', label: 'Good' },
    { value: 8, emoji: '😄', label: 'Great' },
    { value: 9, emoji: '😁', label: 'Happy' },
    { value: 10, emoji: '🤩', label: 'Excellent' },
  ];

  return (
    <View style={styles.moodSelector}>
      <Text style={styles.moodLabel}>How are you feeling?</Text>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <Pressable
            key={mood.value}
            style={[
              styles.moodItem,
              value === mood.value && styles.moodItemSelected,
            ]}
            onPress={() => onChange(mood.value)}
          >
            <View style={styles.moodEmojiContainer}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            </View>
            <Text style={[styles.moodNumber, value === mood.value && styles.moodNumberSelected]}>
              {mood.value}
            </Text>
            {value === mood.value && (
              <Text style={styles.moodValue}>{mood.label}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

// Symptom tracker component
const SymptomTracker: React.FC<{
  symptoms: ISymptom[];
  onChange: (symptoms: ISymptom[]) => void;
  userConditions: any[];
}> = ({ symptoms, onChange, userConditions }) => {
  const severityLevels: { value: SeverityLevel; label: string; color: string }[] = [
    { value: 'mild', label: 'Mild', color: '#A3E635' },
    { value: 'moderate', label: 'Moderate', color: '#FBBF24' },
    { value: 'severe', label: 'Severe', color: '#F87171' },
  ];

  const toggleSymptom = (condition: string, type?: string) => {
    const existing = symptoms.find(
      (s) => s.condition === condition && s.type === type
    );
    
    if (existing) {
      onChange(symptoms.filter((s) => !(s.condition === condition && s.type === type)));
    } else {
      onChange([...symptoms, { condition, type, severity: 'moderate' }]);
    }
  };

  const updateSeverity = (condition: string, type: string | undefined, severity: SeverityLevel) => {
    onChange(
      symptoms.map((s) =>
        s.condition === condition && s.type === type
          ? { ...s, severity }
          : s
      )
    );
  };

  if (userConditions.length === 0) {
    return null;
  }

  return (
    <View style={styles.symptomTracker}>
      <Text style={styles.symptomLabel}>Symptoms today</Text>
      <View style={styles.conditionsList}>
        {userConditions.map((condition: any, index: number) => {
          const conditionName = typeof condition === 'string' ? condition : condition.condition;
          const conditionType = typeof condition === 'string' ? undefined : condition.type;
          const isSelected = symptoms.some(
            (s) => s.condition === conditionName && s.type === conditionType
          );
          const selectedSymptom = symptoms.find(
            (s) => s.condition === conditionName && s.type === conditionType
          );

          return (
            <View key={index} style={styles.conditionItem}>
              <Pressable
                style={[
                  styles.conditionChip,
                  isSelected && styles.conditionChipSelected,
                ]}
                onPress={() => toggleSymptom(conditionName, conditionType)}
              >
                <Text
                  style={[
                    styles.conditionText,
                    isSelected && styles.conditionTextSelected,
                  ]}
                >
                  {conditionType ? `${conditionName} (${conditionType})` : conditionName}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </Pressable>

              {isSelected && (
                <View style={styles.severitySelector}>
                  {severityLevels.map((level) => (
                    <Pressable
                      key={level.value}
                      style={[
                        styles.severityChip,
                        selectedSymptom?.severity === level.value && {
                          backgroundColor: `${level.color}30`,
                          borderColor: level.color,
                        },
                      ]}
                      onPress={() => updateSeverity(conditionName, conditionType, level.value)}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          selectedSymptom?.severity === level.value && {
                            color: level.color,
                          },
                        ]}
                      >
                        {level.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Voice Recorder Component
const VoiceRecorder: React.FC<{
  onTranscriptionComplete: (text: string) => void;
}> = ({ onTranscriptionComplete }) => {
  const {
    state,
    transcription,
    duration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  } = useVoiceJournaling();

  const hasProcessedRef = React.useRef(false);

  useEffect(() => {
    if (state === 'done' && transcription && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      onTranscriptionComplete(transcription);
      reset();
    }
    // Reset ref when state changes back to idle
    if (state === 'idle') {
      hasProcessedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, transcription]);

  const handleRecordPress = async () => {
    if (state === 'idle') {
      await startRecording();
    } else if (state === 'recording') {
      await stopRecording();
    }
  };

  return (
    <View style={voiceStyles.container}>
      <Text style={voiceStyles.label}>Or speak your thoughts</Text>
      
      <GlassCard style={voiceStyles.card} padding="lg">
        <View style={voiceStyles.content}>
          {state === 'processing' ? (
            <>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={voiceStyles.processingText}>Transcribing...</Text>
            </>
          ) : (
            <>
              <Pressable
                style={[
                  voiceStyles.recordButton,
                  state === 'recording' && voiceStyles.recordButtonActive,
                ]}
                onPress={handleRecordPress}
              >
                <Ionicons
                  name={state === 'recording' ? 'stop' : 'mic'}
                  size={32}
                  color={state === 'recording' ? COLORS.error : COLORS.primary}
                />
              </Pressable>
              
              {state === 'recording' ? (
                <View style={voiceStyles.recordingInfo}>
                  <View style={voiceStyles.recordingIndicator} />
                  <Text style={voiceStyles.durationText}>{formatDuration(duration)}</Text>
                </View>
              ) : (
                <Text style={voiceStyles.hintText}>Tap to record</Text>
              )}

              {state === 'recording' && (
                <Pressable style={voiceStyles.cancelButton} onPress={cancelRecording}>
                  <Text style={voiceStyles.cancelText}>Cancel</Text>
                </Pressable>
              )}
            </>
          )}

          {error && (
            <Text style={voiceStyles.errorText}>{error}</Text>
          )}
        </View>
      </GlassCard>
    </View>
  );
};

const voiceStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  card: {
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  recordButtonActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderColor: COLORS.error,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
  },
  durationText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  hintText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  cancelButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  cancelText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  processingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
});

export default function CreateJournalEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ journalId?: string; promptId?: string; promptText?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { fontFamily } = useSettingsStore();

  const [content, setContent] = useState('');
  const [mood, setMood] = useState(5);
  const [symptoms, setSymptoms] = useState<ISymptom[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const isMountedRef = React.useRef(true);
  const saveAbortControllerRef = React.useRef<AbortController | null>(null);

  // Get user's health conditions for symptom tracking (memoized)
  const userConditions = useMemo(() => [
    ...(user?.healthInfo?.mentalHealth || []),
    ...(user?.healthInfo?.physicalHealth || []),
  ], [user?.healthInfo?.mentalHealth, user?.healthInfo?.physicalHealth]);

  // Use Palatino as default font for journal entries
  const selectedFontFamily = useMemo(() => getFontFamily('palatino'), []);

  // Handle voice transcription
  const handleVoiceTranscription = useCallback((text: string) => {
    setContent((prev) => prev ? `${prev}\n\n${text}` : text);
  }, []);

  // Cleanup on unmount to prevent loading state issues
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing save operation
      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
        saveAbortControllerRef.current = null;
      }
      // Reset saving state when component unmounts
      setSaving(false);
    };
  }, []);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Oops', 'Please write something before saving.');
      return;
    }

    if (!params.journalId) {
      Alert.alert('Error', 'Journal ID is required');
      router.back();
      return;
    }

    if (saving) {
      return; // Prevent double submission
    }

    setSaving(true);
    
    // Create abort controller for this save operation
    const abortController = new AbortController();
    saveAbortControllerRef.current = abortController;

    try {
      console.log('Creating journal entry with data:', {
        content: content.trim().substring(0, 50) + '...',
        mood,
        journalId: params.journalId,
        symptomsCount: symptoms.length,
        tagsCount: tags.length,
      });

      const response = await journalService.createEntry({
        content: content.trim(),
        mood,
        journalId: params.journalId,
        symptoms,
        tags,
        promptId: params.promptId,
        promptText: params.promptText,
        fontFamily: 'palatino', // Save Palatino as the font for this entry
      });

      // Check if component is still mounted and operation wasn't aborted
      if (!isMountedRef.current || abortController.signal.aborted) {
        return;
      }

      console.log('Journal entry response:', response);

      if (response.success) {
        router.back();
      } else {
        if (isMountedRef.current) {
          Alert.alert('Error', response.message || 'Could not save entry');
          setSaving(false);
        }
      }
    } catch (error: any) {
      // Don't show error if operation was aborted or component unmounted
      if (!isMountedRef.current || abortController.signal.aborted) {
        return;
      }
      console.error('Error creating journal entry:', error);
      if (isMountedRef.current) {
        Alert.alert(
          'Error',
          error?.message || 'Something went wrong while saving your entry'
        );
        setSaving(false);
      }
    } finally {
      // Clear abort controller reference if this was the current operation
      if (saveAbortControllerRef.current === abortController) {
        saveAbortControllerRef.current = null;
      }
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable 
            style={styles.closeButton} 
            onPress={() => {
              // Cancel any ongoing save operation
              if (saveAbortControllerRef.current) {
                saveAbortControllerRef.current.abort();
                saveAbortControllerRef.current = null;
              }
              // Reset saving state before navigating back
              setSaving(false);
              router.back();
            }}
          >
            <Ionicons name="close" size={28} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Entry</Text>
          <GlassButton
            title={saving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            size="small"
            disabled={saving || !content.trim()}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
        >
          {/* Prompt display */}
          {params.promptText && (
            <GlassCard style={styles.promptCard} padding="md">
              <View style={styles.promptHeader}>
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                <Text style={styles.promptLabel}>Prompt</Text>
              </View>
              <Text style={styles.promptText}>{params.promptText}</Text>
            </GlassCard>
          )}

          {/* Mood Selector */}
          <MoodSelector value={mood} onChange={setMood} />

          {/* Content Input */}
          <View style={styles.contentSection}>
            <Text style={styles.contentLabel}>What's on your mind?</Text>
            <GlassCard style={styles.contentCard} padding="md">
              <TextInput
                style={[styles.contentInput, { fontFamily: selectedFontFamily }]}
                value={content}
                onChangeText={setContent}
                placeholder="Write down your thoughts and feelings..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                textAlignVertical="top"
                autoFocus={!params.promptText}
                blurOnSubmit={false}
              />
            </GlassCard>
          </View>

          {/* Voice Recorder */}
          <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} />

          {/* Symptom Tracker */}
          <SymptomTracker
            symptoms={symptoms}
            onChange={setSymptoms}
            userConditions={userConditions}
          />

          {/* Tags */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>Tags</Text>
            <View style={styles.tagsInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add tag..."
                placeholderTextColor={COLORS.textMuted}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <Pressable
                style={styles.addTagButton}
                onPress={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={tagInput.trim() ? COLORS.primary : COLORS.textMuted}
                />
              </Pressable>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagsList}>
                {tags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.tag}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                    <Ionicons name="close" size={14} color={COLORS.primary} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  closeButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  promptCard: {
    marginBottom: SPACING.lg,
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
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  moodSelector: {
    marginBottom: SPACING.xl,
  },
  moodLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  moodItem: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  moodItemSelected: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: COLORS.primary,
  },
  moodEmojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
  },
  moodEmoji: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 24,
    includeFontPadding: false,
  },
  moodNumber: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    fontSize: 12,
  },
  moodNumberSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  moodValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  contentSection: {
    marginBottom: SPACING.xl,
  },
  contentLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  contentCard: {
    minHeight: 200,
  },
  contentInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 180,
  },
  symptomTracker: {
    marginBottom: SPACING.xl,
  },
  symptomLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  conditionsList: {
    gap: SPACING.md,
  },
  conditionItem: {
    gap: SPACING.sm,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  conditionChipSelected: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: COLORS.primary,
  },
  conditionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  conditionTextSelected: {
    color: COLORS.text,
  },
  severitySelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginLeft: SPACING.md,
  },
  severityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  severityText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
  },
  tagsSection: {
    marginBottom: SPACING.xl,
  },
  tagsLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  tagsInputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
  },
});

