import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { journalService, ISymptom, SeverityLevel } from '../../src/services/journal.service';
import { uploadService } from '../../src/services/upload.service';
import { useAuthStore } from '../../src/store/authStore';
import { getFontFamily } from '../../src/utils/fontHelper';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { useVoiceJournaling, formatDuration } from '../../src/hooks/useVoiceJournaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Book page line component
const BookLine: React.FC<{ index: number }> = ({ index }) => (
  <View style={styles.bookLine} />
);

// Radial Tools Menu Component
const RadialToolsMenu: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  onInsertText: (text: string) => void;
  onAddImage: () => void;
  onAddVideo: () => void;
  onStartAudioRecording: () => void;
  bottomInset: number;
}> = ({ isOpen, onToggle, onInsertText, onAddImage, onAddVideo, onStartAudioRecording, bottomInset }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const toolAnimations = useRef(
    Array.from({ length: 3 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (isOpen) {
      // Open animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger tool animations
      toolAnimations.forEach((tool, index) => {
        Animated.parallel([
          Animated.spring(tool.scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            delay: index * 50,
          }),
          Animated.timing(tool.opacity, {
            toValue: 1,
            duration: 200,
            delay: index * 50,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Close animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Close tool animations
      toolAnimations.forEach((tool) => {
        Animated.parallel([
          Animated.spring(tool.scale, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.timing(tool.opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [isOpen]);

  const tools = [
    { icon: 'image-outline', label: 'Photo/Video', onPress: () => {
      // Show action sheet to choose photo or video
      Alert.alert(
        'Add Media',
        'Choose an option',
        [
          { text: 'Photo', onPress: onAddImage },
          { text: 'Video', onPress: onAddVideo },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }, angle: 0 },
    { icon: 'mic-outline', label: 'Audio', onPress: onStartAudioRecording, angle: 120 },
    { icon: 'text-outline', label: 'Header', onPress: () => onInsertText('# '), angle: 240 },
  ];

  const radius = 90;

  return (
    <View style={[styles.radialMenuContainer, { bottom: bottomInset + SPACING.xl + 80 }]}>
      {/* Backdrop */}
      {isOpen && (
        <Pressable
          style={styles.radialMenuBackdrop}
          onPress={onToggle}
        />
      )}

      {/* Tools */}
      {tools.map((tool, index) => {
        const angle = (tool.angle * Math.PI) / 180;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <Animated.View
            key={index}
            style={[
              styles.toolButton,
              {
                transform: [
                  { translateX: x },
                  { translateY: y },
                  { scale: toolAnimations[index].scale },
                ],
                opacity: toolAnimations[index].opacity,
              },
            ]}
          >
            <Pressable
              style={styles.toolButtonInner}
              onPress={() => {
                tool.onPress();
                onToggle();
              }}
            >
              <Ionicons name={tool.icon as any} size={20} color="#8B7355" />
            </Pressable>
            <Text style={styles.toolLabel}>{tool.label}</Text>
          </Animated.View>
        );
      })}

      {/* Main FAB - Always visible */}
      <View style={styles.mainFab}>
        <Pressable style={styles.mainFabButton} onPress={onToggle}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons
              name={isOpen ? 'close' : 'add'}
              size={28}
              color="#F5F1E8"
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

export default function BookPageEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ journalId?: string; promptId?: string; promptText?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [pages, setPages] = useState<string[]>(['']); // Array of page contents
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [mood, setMood] = useState(5);
  const [saving, setSaving] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const isMountedRef = useRef(true);
  const saveAbortControllerRef = useRef<AbortController | null>(null);
  const contentInputRef = useRef<TextInput>(null);

  // Voice journaling hook
  const {
    state: audioState,
    transcription,
    duration: audioDuration,
    error: audioError,
    startRecording,
    stopRecording,
    cancelRecording,
    reset: resetAudio,
  } = useVoiceJournaling();

  // Use Palatino as default font for journal entries
  const selectedFontFamily = useMemo(() => getFontFamily('palatino'), []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
        saveAbortControllerRef.current = null;
      }
      setSaving(false);
    };
  }, []);

  // Auto-focus content input when page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      contentInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPageIndex]);

  // Handle audio transcription
  useEffect(() => {
    if (audioState === 'done' && transcription) {
      handleInsertText(transcription);
      setShowAudioRecorder(false);
      resetAudio();
    }
  }, [audioState, transcription, handleInsertText]);

  // Update current page content
  const handleContentChange = (text: string) => {
    const newPages = [...pages];
    newPages[currentPageIndex] = text;
    setPages(newPages);
  };

  // Add new page
  const handleAddPage = useCallback(() => {
    Keyboard.dismiss();
    const newPageIndex = pages.length;
    setPages(prevPages => [...prevPages, '']);
    setCurrentPageIndex(newPageIndex);
  }, [pages.length]);

  // Navigate to page
  const handlePageChange = (index: number) => {
    Keyboard.dismiss();
    setCurrentPageIndex(index);
  };

  // Get current page content
  const currentContent = pages[currentPageIndex] || '';

  // Insert text at cursor position
  const handleInsertText = useCallback((text: string) => {
    setPages(prevPages => {
      const newPages = [...prevPages];
      const currentPage = newPages[currentPageIndex] || '';
      // For simplicity, append to end. Could be improved to insert at cursor
      newPages[currentPageIndex] = currentPage + (currentPage ? '\n' : '') + text;
      return newPages;
    });
  }, [currentPageIndex]);

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
        
        // Show uploading indicator
        handleInsertText('[Uploading image...]');
        
        // Upload to server
        const uploadResult = await uploadService.uploadImage(imageUri);
        
        if (uploadResult.success && uploadResult.data?.url) {
          // Replace placeholder with actual URL
          setPages((prevPages) => {
            const newPages = [...prevPages];
            newPages[currentPageIndex] = newPages[currentPageIndex].replace(
              '[Uploading image...]',
              `[Image: ${uploadResult.data!.url}]`
            );
            return newPages;
          });
        } else {
          // Remove placeholder on failure
          setPages((prevPages) => {
            const newPages = [...prevPages];
            newPages[currentPageIndex] = newPages[currentPageIndex].replace('[Uploading image...]', '');
            return newPages;
          });
          Alert.alert('Upload Failed', uploadResult.message || 'Could not upload image');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
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
        
        // Show uploading indicator
        handleInsertText('[Uploading video...]');
        
        // Upload to server
        const uploadResult = await uploadService.uploadVideo(videoUri);
        
        if (uploadResult.success && uploadResult.data?.url) {
          // Replace placeholder with actual URL
          setPages((prevPages) => {
            const newPages = [...prevPages];
            newPages[currentPageIndex] = newPages[currentPageIndex].replace(
              '[Uploading video...]',
              `[Video: ${uploadResult.data!.url}]`
            );
            return newPages;
          });
        } else {
          // Remove placeholder on failure
          setPages((prevPages) => {
            const newPages = [...prevPages];
            newPages[currentPageIndex] = newPages[currentPageIndex].replace('[Uploading video...]', '');
            return newPages;
          });
          Alert.alert('Upload Failed', uploadResult.message || 'Could not upload video');
        }
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Could not select video');
    }
  };

  // Handle start audio recording
  const handleStartAudioRecording = () => {
    setIsToolsMenuOpen(false);
    setShowAudioRecorder(true);
    startRecording();
  };

  const handleSave = async () => {
    // Combine all pages into one content
    const combinedContent = pages.filter(page => page.trim()).join('\n\n---\n\n');
    
    if (!combinedContent.trim()) {
      Alert.alert('Oops', 'Please write something before saving.');
      return;
    }

    if (!params.journalId) {
      Alert.alert('Error', 'Journal ID is required');
      router.back();
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);
    
    const abortController = new AbortController();
    saveAbortControllerRef.current = abortController;

    try {
      const response = await journalService.createEntry({
        content: combinedContent.trim(),
        mood,
        journalId: params.journalId,
        symptoms: [],
        tags: [],
        promptId: params.promptId,
        promptText: params.promptText,
        fontFamily: 'palatino',
      });

      if (!isMountedRef.current || abortController.signal.aborted) {
        return;
      }

      if (response.success) {
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
      if (isMountedRef.current && !abortController.signal.aborted) {
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaving(false);
          }
        }, 100);
      }
      if (saveAbortControllerRef.current === abortController) {
        saveAbortControllerRef.current = null;
      }
    }
  };

  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy', { locale: enUS });
  const currentTime = format(new Date(), 'h:mm a', { locale: enUS });

  // Generate lines for the book page - calculate based on content height
  const estimatedContentHeight = 600; // Approximate content area height
  const lineHeight = 24;
  const lineCount = Math.floor(estimatedContentHeight / lineHeight);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Book Page Background */}
        <Pressable 
          style={styles.bookPage}
          onPress={Keyboard.dismiss}
        >
        {/* Book Binding Shadow */}
        <View style={styles.bookBinding} />
        
        {/* Page Content */}
        <ScrollView
          style={styles.pageScrollView}
          contentContainerStyle={[
            styles.pageContent,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          {/* Date Header */}
          <Pressable style={styles.dateHeader} onPress={Keyboard.dismiss}>
            <Text style={styles.dateText}>{currentDate}</Text>
            <Text style={styles.timeText}>{currentTime}</Text>
          </Pressable>

          {/* Prompt if available */}
          {params.promptText && (
            <Pressable style={styles.promptContainer} onPress={Keyboard.dismiss}>
              <View style={styles.promptIcon}>
                <Ionicons name="sparkles" size={14} color="#8B7355" />
              </View>
              <Text style={styles.promptText}>{params.promptText}</Text>
            </Pressable>
          )}

          {/* Content Input Area */}
          <View style={styles.contentContainer}>
            <TextInput
              ref={contentInputRef}
              style={[styles.contentInput, { fontFamily: selectedFontFamily }]}
              value={currentContent}
              onChangeText={handleContentChange}
              placeholder=""
              placeholderTextColor="transparent"
              multiline
              textAlignVertical="top"
              autoFocus
              blurOnSubmit={false}
            />
            
            {/* Book Lines Overlay */}
            <View style={styles.linesOverlay} pointerEvents="none">
              {Array.from({ length: lineCount }).map((_, index) => (
                <BookLine key={index} index={index} />
              ))}
            </View>
            
          </View>

          {/* Page Navigation */}
          <View style={styles.pageNavigation}>
            <View style={styles.pageNumberContainer}>
              <Text style={styles.pageNumberText}>
                Page {currentPageIndex + 1} of {pages.length}
              </Text>
            </View>
            
            {/* Page Indicators */}
            {pages.length > 1 && (
              <View style={styles.pageIndicators}>
                {pages.map((_, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.pageIndicator,
                      currentPageIndex === index && styles.pageIndicatorActive,
                    ]}
                    onPress={() => handlePageChange(index)}
                  >
                    <Text style={[
                      styles.pageIndicatorText,
                      currentPageIndex === index && styles.pageIndicatorTextActive,
                    ]}>
                      {index + 1}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            
            {/* Add Page Button */}
            <Pressable
              style={styles.addPageButton}
              onPress={handleAddPage}
            >
              <Ionicons name="add" size={20} color="#8B7355" />
              <Text style={styles.addPageText}>Add Page</Text>
            </Pressable>
          </View>
        </ScrollView>
        </Pressable>

      {/* Audio Recorder Modal */}
      {showAudioRecorder && (
        <View style={styles.audioRecorderContainer}>
          <View style={styles.audioRecorderCard}>
            <View style={styles.audioRecorderHeader}>
              <Text style={styles.audioRecorderTitle}>Recording Audio</Text>
              <Pressable
                onPress={() => {
                  cancelRecording();
                  setShowAudioRecorder(false);
                  resetAudio();
                }}
              >
                <Ionicons name="close" size={24} color="#6B5D4F" />
              </Pressable>
            </View>
            
            <View style={styles.audioRecorderContent}>
              {audioState === 'processing' ? (
                <>
                  <ActivityIndicator size="large" color="#8B7355" />
                  <Text style={styles.audioRecorderText}>Transcribing...</Text>
                </>
              ) : (
                <>
                  <Pressable
                    style={[
                      styles.audioRecordButton,
                      audioState === 'recording' && styles.audioRecordButtonActive,
                    ]}
                    onPress={() => {
                      if (audioState === 'idle') {
                        startRecording();
                      } else if (audioState === 'recording') {
                        stopRecording();
                      }
                    }}
                  >
                    <Ionicons
                      name={audioState === 'recording' ? 'stop' : 'mic'}
                      size={32}
                      color={audioState === 'recording' ? '#F87171' : '#8B7355'}
                    />
                  </Pressable>
                  
                  {audioState === 'recording' && (
                    <View style={styles.audioRecordingInfo}>
                      <View style={styles.audioRecordingIndicator} />
                      <Text style={styles.audioDurationText}>
                        {formatDuration(audioDuration)}
                      </Text>
                    </View>
                  )}
                  
                  {audioError && (
                    <Text style={styles.audioErrorText}>{audioError}</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Header Controls */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable 
          style={styles.headerButton} 
          onPress={() => {
            Keyboard.dismiss();
            if (saveAbortControllerRef.current) {
              saveAbortControllerRef.current.abort();
              saveAbortControllerRef.current = null;
            }
            if (isMountedRef.current) {
              setSaving(false);
            }
            setTimeout(() => {
              router.back();
            }, 0);
          }}
        >
          <Ionicons name="close" size={24} color="#8B7355" />
        </Pressable>
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={() => {
            Keyboard.dismiss();
            handleSave();
          }}
          disabled={saving || !pages.some(page => page.trim())}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#8B7355" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Radial Tools Menu */}
      <RadialToolsMenu
        isOpen={isToolsMenuOpen}
        onToggle={() => {
          Keyboard.dismiss();
          setIsToolsMenuOpen(!isToolsMenuOpen);
        }}
        onInsertText={handleInsertText}
        onAddImage={handleAddImage}
        onAddVideo={handleAddVideo}
        onStartAudioRecording={handleStartAudioRecording}
        bottomInset={insets.bottom}
      />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E0D6', // Book cover color
  },
  bookPage: {
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
  bookBinding: {
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
  pageScrollView: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingLeft: SPACING.xl + 12, // Extra padding to account for binding
  },
  dateHeader: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C4',
  },
  dateText: {
    fontSize: 16,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  timeText: {
    fontSize: 12,
    fontFamily: getFontFamily('palatino'),
    color: '#8B7355',
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#F0EBE0',
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#8B7355',
  },
  promptIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  contentContainer: {
    minHeight: 500,
    position: 'relative',
    marginBottom: SPACING.xl,
    zIndex: 10,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: getFontFamily('palatino'),
    color: '#4A3E2F',
    lineHeight: 24,
    minHeight: 500,
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  linesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 500,
    zIndex: 0,
    justifyContent: 'flex-start',
  },
  bookLine: {
    height: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
    marginBottom: 0,
  },
  pageNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E0D5C4',
    gap: SPACING.md,
  },
  pageNumberContainer: {
    flex: 1,
  },
  pageNumberText: {
    fontSize: 14,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    fontStyle: 'italic',
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
    zIndex: 20, // Above page lines
  },
  pageIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0EBE0',
    borderWidth: 1,
    borderColor: '#E0D5C4',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20, // Above page lines
  },
  pageIndicatorActive: {
    backgroundColor: '#8B7355',
    borderColor: '#6B5D4F',
  },
  pageIndicatorText: {
    fontSize: 11,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
  },
  pageIndicatorTextActive: {
    color: '#F5F1E8',
    fontWeight: '600',
  },
  addPageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#F0EBE0',
    borderWidth: 1,
    borderColor: '#E0D5C4',
    borderRadius: BORDER_RADIUS.md,
  },
  addPageText: {
    fontSize: 13,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 241, 232, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(139, 115, 85, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: getFontFamily('palatino'),
    color: '#F5F1E8',
    fontWeight: '600',
  },
  radialMenuContainer: {
    position: 'absolute',
    left: SPACING.lg, // Changed to left side
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  radialMenuBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: -1,
  },
  toolButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F1E8',
    borderWidth: 2,
    borderColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toolLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    fontWeight: '500',
    textAlign: 'center',
    width: 60,
    marginLeft: -5,
  },
  mainFab: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainFabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  audioRecorderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  audioRecorderCard: {
    backgroundColor: '#F5F1E8',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  audioRecorderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  audioRecorderTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    fontWeight: '600',
  },
  audioRecorderContent: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  audioRecorderText: {
    fontSize: 14,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    marginTop: SPACING.md,
  },
  audioRecordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0EBE0',
    borderWidth: 2,
    borderColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioRecordButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  audioRecordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  audioRecordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F87171',
  },
  audioDurationText: {
    fontSize: 16,
    fontFamily: getFontFamily('palatino'),
    color: '#6B5D4F',
    fontWeight: '600',
  },
  audioErrorText: {
    fontSize: 12,
    fontFamily: getFontFamily('palatino'),
    color: '#F87171',
    textAlign: 'center',
  },
});
