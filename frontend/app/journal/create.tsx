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
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  InputAccessoryView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { journalService, ISymptom, SeverityLevel } from '../../src/services/journal.service';
import { uploadService } from '../../src/services/upload.service';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useVoiceJournaling, formatDuration } from '../../src/hooks/useVoiceJournaling';
import { getFontFamily } from '../../src/utils/fontHelper';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';

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
  const [isFullscreenBookPage, setIsFullscreenBookPage] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [mediaItems, setMediaItems] = useState<Array<{ type: 'image' | 'video'; uri: string; uploadedUrl?: string; isUploading?: boolean }>>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const contentInputRef = React.useRef<TextInput>(null);
  const inputAccessoryViewID = 'mediaInputAccessoryView';
  const isMountedRef = React.useRef(true);
  const saveAbortControllerRef = React.useRef<AbortController | null>(null);

  // Current date and time for book page header
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy', { locale: enUS });
  const currentTime = format(new Date(), 'h:mm a', { locale: enUS });

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

  // Keyboard visibility listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Insert text at cursor position (or append to end)
  const handleInsertText = useCallback((text: string) => {
    setContent((prev) => {
      // For simplicity, append to end. Could be improved to insert at cursor
      return prev ? `${prev}\n${text}` : text;
    });
  }, []);

  // Add media item (image or video)
  const handleAddMediaItem = useCallback((type: 'image' | 'video', uri: string) => {
    setMediaItems((prev) => [...prev, { type, uri }]);
  }, []);

  // Request media permissions
  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos and videos');
      return false;
    }
    return true;
  };

  // Handle add image
  const handleAddImage = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Add media item with uploading state
        const newItemIndex = mediaItems.length;
        setMediaItems((prev) => [...prev, { type: 'image', uri: imageUri, isUploading: true }]);
        setIsUploadingMedia(true);
        
        // Upload to server
        const uploadResult = await uploadService.uploadImage(imageUri);
        
        if (uploadResult.success && uploadResult.data?.url) {
          // Update media item with uploaded URL
          setMediaItems((prev) => 
            prev.map((item, index) => 
              index === newItemIndex 
                ? { ...item, uploadedUrl: uploadResult.data!.url, isUploading: false }
                : item
            )
          );
        } else {
          // Remove failed upload
          setMediaItems((prev) => prev.filter((_, index) => index !== newItemIndex));
          Alert.alert('Upload Failed', uploadResult.message || 'Could not upload image');
        }
        
        setIsUploadingMedia(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
      setIsUploadingMedia(false);
    }
  };

  // Handle add video
  const handleAddVideo = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        
        // Add media item with uploading state
        const newItemIndex = mediaItems.length;
        setMediaItems((prev) => [...prev, { type: 'video', uri: videoUri, isUploading: true }]);
        setIsUploadingMedia(true);
        
        // Upload to server
        const uploadResult = await uploadService.uploadVideo(videoUri);
        
        if (uploadResult.success && uploadResult.data?.url) {
          // Update media item with uploaded URL
          setMediaItems((prev) => 
            prev.map((item, index) => 
              index === newItemIndex 
                ? { ...item, uploadedUrl: uploadResult.data!.url, isUploading: false }
                : item
            )
          );
        } else {
          // Remove failed upload
          setMediaItems((prev) => prev.filter((_, index) => index !== newItemIndex));
          Alert.alert('Upload Failed', uploadResult.message || 'Could not upload video');
        }
        
        setIsUploadingMedia(false);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Could not select video');
      setIsUploadingMedia(false);
    }
  };

  // Handle media selection (show action sheet)
  const handleMediaSelection = () => {
    Alert.alert(
      "Add Media",
      "Choose an option",
      [
        { text: "Photo", onPress: handleAddImage },
        { text: "Video", onPress: handleAddVideo },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

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

    // Check if any media is still uploading
    if (isUploadingMedia || mediaItems.some(item => item.isUploading)) {
      Alert.alert('Please wait', 'Media is still uploading. Please wait until upload completes.');
      return;
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

      // Prepare media items (only include successfully uploaded items)
      const uploadedMedia = mediaItems
        .filter(item => item.uploadedUrl && !item.isUploading)
        .map(item => ({
          type: item.type,
          url: item.uploadedUrl!,
        }));

      const response = await journalService.createEntry({
        content: content.trim(),
        mood,
        journalId: params.journalId,
        symptoms,
        tags,
        promptId: params.promptId,
        promptText: params.promptText,
        fontFamily: 'palatino', // Save Palatino as the font for this entry
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      });

      // Check if component is still mounted and operation wasn't aborted
      if (!isMountedRef.current || abortController.signal.aborted) {
        return;
      }

      console.log('Journal entry response:', response);

      if (response.success) {
        // Reset saving state before navigation
        if (isMountedRef.current) {
          setSaving(false);
        }
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
      // Safety net: Always reset saving state if component is still mounted and operation wasn't aborted
      // This ensures the loading state is cleared even if something unexpected happens
      if (isMountedRef.current && !abortController.signal.aborted) {
        // Use setTimeout to ensure state update happens after any navigation
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaving(false);
          }
        }, 100);
      }
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
              if (isMountedRef.current) {
                setSaving(false);
              }
              // Use setTimeout to ensure state is reset before navigation
              setTimeout(() => {
                router.back();
              }, 0);
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
            {/* Book Page Style Container */}
            <View style={styles.bookPageContainer}>
              {/* Expand Icon */}
              <Pressable 
                style={styles.expandIcon}
                onPress={() => setIsFullscreenBookPage(true)}
              >
                <Ionicons name="expand" size={20} color="#6B5D4F" />
              </Pressable>
              
              {/* Date Header */}
              <Pressable style={styles.bookDateHeader} onPress={Keyboard.dismiss}>
                <Text style={styles.bookDateText}>{currentDate}</Text>
                <Text style={styles.bookTimeText}>{currentTime}</Text>
              </Pressable>

              {/* Media Items */}
              {mediaItems.length > 0 && (
                <View style={styles.mediaItemsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                    {mediaItems.map((item, index) => (
                      <View key={index} style={styles.mediaItemWrapper}>
                        {item.type === 'image' ? (
                          <Image source={{ uri: item.uri }} style={styles.mediaItemImage} />
                        ) : (
                          <View style={styles.mediaItemVideo}>
                            <Ionicons name="videocam" size={32} color={COLORS.textMuted} />
                            <Text style={styles.mediaItemVideoText}>Video</Text>
                          </View>
                        )}
                        <Pressable
                          style={styles.mediaItemRemove}
                          onPress={() => {
                            setMediaItems((prev) => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color={COLORS.error} />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              <View style={styles.bookPageContent}>
                <TextInput
                  ref={contentInputRef}
                  style={[styles.bookPageInput, { fontFamily: selectedFontFamily }]}
                  value={content}
                  onChangeText={setContent}
                  placeholder=""
                  placeholderTextColor="transparent"
                  multiline
                  textAlignVertical="top"
                  autoFocus={!params.promptText}
                  blurOnSubmit={false}
                  inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                />
                
                {/* Book Lines Overlay - limited to content area */}
                <View style={styles.bookLinesOverlay} pointerEvents="none">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <View key={index} style={styles.bookLine} />
                  ))}
                </View>
              </View>
            </View>
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

      {/* Keyboard Toolbar with Media Options - iOS InputAccessoryView */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.keyboardToolbar}>
            <Pressable
              style={styles.keyboardToolbarButton}
              onPress={handleMediaSelection}
            >
              <Ionicons name="image-outline" size={24} color={COLORS.primary} />
              <Text style={styles.keyboardToolbarButtonText}>Media</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}

      {/* Keyboard Toolbar with Media Options - Android fallback */}
      {Platform.OS === 'android' && isKeyboardVisible && (
        <View style={[styles.keyboardToolbar, { bottom: insets.bottom }]}>
          <Pressable
            style={styles.keyboardToolbarButton}
            onPress={handleMediaSelection}
          >
            <Ionicons name="image-outline" size={24} color={COLORS.primary} />
            <Text style={styles.keyboardToolbarButtonText}>Media</Text>
          </Pressable>
        </View>
      )}

      {/* Fullscreen Book Page Modal */}
      <Modal
        visible={isFullscreenBookPage}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullscreenBookPage(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.fullscreenContainer}>
            {/* Book Page Background */}
            <Pressable 
              style={styles.fullscreenBookPage}
              onPress={Keyboard.dismiss}
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
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={Keyboard.dismiss}
              >
                {/* Date Header */}
                <Pressable style={styles.fullscreenDateHeader} onPress={Keyboard.dismiss}>
                  <Text style={styles.fullscreenDateText}>{currentDate}</Text>
                  <Text style={styles.fullscreenTimeText}>{currentTime}</Text>
                </Pressable>

                {/* Prompt if available */}
                {params.promptText && (
                  <Pressable style={styles.fullscreenPromptContainer} onPress={Keyboard.dismiss}>
                    <View style={styles.fullscreenPromptIcon}>
                      <Ionicons name="sparkles" size={14} color="#8B7355" />
                    </View>
                    <Text style={styles.fullscreenPromptText}>{params.promptText}</Text>
                  </Pressable>
                )}

                {/* Media Items */}
                {mediaItems.length > 0 && (
                  <View style={styles.fullscreenMediaItemsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fullscreenMediaScrollView}>
                      {mediaItems.map((item, index) => (
                        <View key={index} style={styles.fullscreenMediaItemWrapper}>
                          {item.type === 'image' ? (
                            <Image source={{ uri: item.uri }} style={styles.fullscreenMediaItemImage} />
                          ) : (
                            <View style={styles.fullscreenMediaItemVideo}>
                              <Ionicons name="videocam" size={32} color="#8B7355" />
                              <Text style={styles.fullscreenMediaItemVideoText}>Video</Text>
                            </View>
                          )}
                          <Pressable
                            style={styles.fullscreenMediaItemRemove}
                            onPress={() => {
                              setMediaItems((prev) => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <Ionicons name="close-circle" size={20} color="#DC2626" />
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Content Input Area */}
                <View style={styles.fullscreenContentContainer}>
                  <TextInput
                    style={[styles.fullscreenContentInput, { fontFamily: selectedFontFamily }]}
                    value={content}
                    onChangeText={setContent}
                    placeholder=""
                    placeholderTextColor="transparent"
                    multiline
                    textAlignVertical="top"
                    autoFocus
                    blurOnSubmit={false}
                  />
                  
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
        </TouchableWithoutFeedback>
      </Modal>
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
  bookPageContainer: {
    backgroundColor: '#F5F1E8', // Paper color
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0D5C4',
    minHeight: 300,
    position: 'relative',
  },
  bookDateHeader: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C4',
  },
  bookDateText: {
    fontSize: 15,
    fontFamily: 'Palatino',
    color: '#6B5D4F',
    fontWeight: '500',
    marginBottom: 2,
  },
  bookTimeText: {
    fontSize: 13,
    fontFamily: 'Palatino',
    color: '#8B7355',
    fontStyle: 'italic',
  },
  bookPageContent: {
    position: 'relative',
    minHeight: 280,
    maxHeight: 288, // 12 lines * 24px - limit to prevent overflow
    overflow: 'hidden', // Prevent lines from going outside
  },
  bookPageInput: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: '#4A3E2F',
    lineHeight: 24,
    minHeight: 280,
    maxHeight: 288, // Match content area
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  bookLinesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 288, // 12 lines * 24px - limited to content area
    zIndex: 0,
    justifyContent: 'flex-start',
  },
  bookLine: {
    height: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
    marginBottom: 0,
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
  expandIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
    padding: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BORDER_RADIUS.sm,
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
  fullscreenCloseButton: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 100,
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
    paddingTop: SPACING.xl + 50, // Extra padding for close button
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
  fullscreenContentContainer: {
    position: 'relative',
    minHeight: 600,
  },
  fullscreenContentInput: {
    fontSize: 16,
    fontFamily: 'Palatino',
    color: '#4A3E2F',
    lineHeight: 24,
    minHeight: 600,
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingTop: 0,
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
  // Keyboard Toolbar Styles
  keyboardToolbar: {
    ...(Platform.OS === 'ios' ? {} : { position: 'absolute', left: 0, right: 0 }),
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 44, // iOS minimum touch target
  },
  keyboardToolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    marginRight: SPACING.sm,
  },
  keyboardToolbarButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  // Media Items Styles
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
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  mediaItemVideo: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mediaItemVideoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  mediaItemRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
  },
  // Fullscreen Media Items Styles
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
  fullscreenMediaItemRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F5F1E8',
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
  },
});

