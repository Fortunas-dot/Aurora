import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LoadingSpinner } from '../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isReady, setIsReady] = useState(true); // Component is ready, waiting for user to start
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false); // Preview state after stopping recording
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const durationRef = useRef(0);
  const recordingRef = useRef<Audio.Recording | null>(null); // Use ref to avoid stale closures
  const isStartingRef = useRef(false); // Prevent multiple simultaneous starts

  // Cleanup on unmount - use ref to avoid stale closure
  useEffect(() => {
    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.tsx:35',message:'Component unmounting, cleaning up',data:{hasRecording:!!recordingRef.current},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
        recordingRef.current = null;
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      if (previewSound) {
        previewSound.unloadAsync().catch(console.error);
      }
    };
  }, [previewSound]); // Cleanup preview sound on unmount

  const startRecording = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.tsx:42',message:'startRecording called',data:{isStarting:isStartingRef.current,hasRecording:!!recordingRef.current},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Prevent multiple simultaneous calls
    if (isStartingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.tsx:46',message:'startRecording already in progress, returning',data:{},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Clean up any existing recording first
    if (recordingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.tsx:52',message:'Cleaning up existing recording before starting new one',data:{},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error cleaning up old recording:', error);
      }
      recordingRef.current = null;
      setRecording(null);
    }
    
    isStartingRef.current = true;
    
    try {
      setIsReady(false); // Hide ready state, show loading
      
      // Request permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (!permissionResponse.granted) {
        console.error('Audio recording permission denied');
        setIsReady(true); // Return to ready state
        isStartingRef.current = false;
        onCancel();
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.tsx:78',message:'Creating new recording',data:{},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Create recording with proper options - use simpler preset with metering enabled
      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true, // Enable metering for audio level visualization
        },
        (status) => {
          // Update audio level in real-time
          if (status.isRecording && status.metering !== undefined) {
            const dbValue = status.metering;
            // Normalize dB value (-160 to 0) to 0-1 range
            const normalizedLevel = Math.min(1, Math.max(0, (dbValue + 160) / 160));
            setAudioLevel(normalizedLevel);
          }
        },
        100 // Update every 100ms
      );

      // Verify recording actually started
      const status = await newRecording.getStatusAsync();
      if (!status.isRecording) {
        console.error('Recording did not start');
        await newRecording.stopAndUnloadAsync();
        setIsReady(true); // Return to ready state
        onCancel();
        return;
      }

      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
      isStartingRef.current = false;
      durationRef.current = 0;
      setDuration(0);
      setAudioLevel(0);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.tsx:120',message:'Recording started successfully',data:{},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Clear any existing interval first
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Start duration timer - poll recording status for accurate duration
      console.log('Starting duration timer');
      durationInterval.current = setInterval(async () => {
        try {
          const currentStatus = await newRecording.getStatusAsync();
          if (currentStatus.isRecording && currentStatus.durationMillis) {
            // Use actual duration from recording status (more accurate)
            const seconds = Math.floor(currentStatus.durationMillis / 1000);
            durationRef.current = seconds;
            setDuration(seconds);
            console.log('Duration from recording:', seconds);
          } else {
            // Fallback: increment manually if status doesn't have duration
            durationRef.current += 1;
            setDuration(durationRef.current);
            console.log('Duration manual increment:', durationRef.current);
          }
        } catch (error) {
          // Fallback: increment manually on error
          durationRef.current += 1;
          setDuration(durationRef.current);
          console.log('Duration fallback increment:', durationRef.current);
        }
      }, 1000);
      
      // Verify timer started
      if (!durationInterval.current) {
        console.error('Failed to start duration timer');
      } else {
        console.log('Duration timer started successfully');
      }

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.tsx:160',message:'Failed to start recording',data:{error:error.message,errorName:error.name},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      console.error('Failed to start recording:', error);
      isStartingRef.current = false;
      setIsReady(true); // Return to ready state
      Alert.alert('Error', error.message || 'Could not start recording');
      onCancel();
    }
  };

  const stopRecordingForPreview = async () => {
    if (!recordingRef.current) return;

    try {
      // Clear intervals first
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Stop recording but keep the URI for preview
      const recordingToStop = recordingRef.current;
      
      // Set audio mode to allow playback (disable recording mode)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      await recordingToStop.stopAndUnloadAsync();
      const uri = recordingToStop.getURI();
      
      // Clear recording ref immediately
      recordingRef.current = null;
      
      if (uri) {
        // Immediately switch to preview UI (before loading sound)
        setPreviewUri(uri);
        setIsPreviewing(true);
        setIsRecording(false);
        setRecording(null);
        scaleAnim.setValue(1);
        
        // Load audio for preview in background
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: false }
          );
          setPreviewSound(sound);
          
          // Get duration from sound status
          const soundStatus = await sound.getStatusAsync();
          if (soundStatus.isLoaded && soundStatus.durationMillis) {
            const soundDuration = Math.floor(soundStatus.durationMillis / 1000);
            if (soundDuration > 0) {
              durationRef.current = soundDuration;
              setDuration(soundDuration);
            }
          }
          
          // Set up playback status updates
          sound.setOnPlaybackStatusUpdate((playbackStatus) => {
            if (playbackStatus.isLoaded) {
              setPreviewPosition(playbackStatus.positionMillis / 1000);
              if (playbackStatus.didJustFinish) {
                setIsPlayingPreview(false);
                setPreviewPosition(0);
              }
            }
          });
        } catch (soundError) {
          console.error('Failed to load audio for preview:', soundError);
          // Preview UI is already showing, sound just won't work
        }
      } else {
        // No URI, cancel
        cancelRecording();
      }
    } catch (error: any) {
      console.error('Failed to stop recording for preview:', error);
      cancelRecording();
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current && !isPreviewing) return;

    try {
      // Clear intervals first
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Stop and unload recording without saving
      if (recordingRef.current) {
        const recordingToCancel = recordingRef.current;
        await recordingToCancel.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      
      // Clean up preview sound
      if (previewSound) {
        await previewSound.unloadAsync();
        setPreviewSound(null);
      }
      
      setRecording(null);
      setIsRecording(false);
      setIsPreviewing(false);
      setIsReady(true); // Return to ready state
      setPreviewUri(null);
      durationRef.current = 0;
      setDuration(0);
      setAudioLevel(0);
      setPreviewPosition(0);
      setIsPlayingPreview(false);
      scaleAnim.setValue(1);
    } catch (error: any) {
      console.error('Failed to cancel recording:', error);
      recordingRef.current = null;
      setRecording(null);
      setIsRecording(false);
      setIsPreviewing(false);
      setIsReady(true);
    }
  };

  const togglePreviewPlayback = async () => {
    if (!previewSound) return;

    try {
      if (isPlayingPreview) {
        await previewSound.pauseAsync();
        setIsPlayingPreview(false);
      } else {
        await previewSound.playAsync();
        setIsPlayingPreview(true);
      }
    } catch (error) {
      console.error('Error toggling preview playback:', error);
    }
  };

  const sendRecording = () => {
    if (previewUri && durationRef.current > 0) {
      onRecordingComplete(previewUri, durationRef.current);
      // Clean up
      if (previewSound) {
        previewSound.unloadAsync().catch(console.error);
      }
      setIsPreviewing(false);
      setPreviewUri(null);
      setPreviewSound(null);
      setIsPlayingPreview(false);
      setPreviewPosition(0);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) {
      console.log('stopRecording: No recording ref');
      return;
    }

    try {
      // Clear intervals first
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Stop and unload recording
      const recordingToStop = recordingRef.current;
      await recordingToStop.stopAndUnloadAsync();
      const uri = recordingToStop.getURI();
      
      console.log('stopRecording: Stopped recording', { uri, duration: durationRef.current, durationState: duration });
      
      // Clear ref before state update
      recordingRef.current = null;
      
      // Always call onRecordingComplete if we have a URI, even if duration is 0
      // The duration check should be done in the parent component
      if (uri) {
        const finalDuration = durationRef.current > 0 ? durationRef.current : duration > 0 ? duration : 1;
        console.log('stopRecording: Calling onRecordingComplete', { uri, duration: finalDuration });
        onRecordingComplete(uri, finalDuration);
      } else {
        console.error('stopRecording: No URI found');
        Alert.alert('Error', 'Recording file not found. Please try again.');
        onCancel();
      }

      setRecording(null);
      setIsRecording(false);
      setIsReady(true); // Return to ready state
      durationRef.current = 0;
      setDuration(0);
      setAudioLevel(0);
      scaleAnim.setValue(1);
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      recordingRef.current = null;
      setRecording(null);
      setIsRecording(false);
      setIsReady(true);
      Alert.alert('Error', error.message || 'Could not stop recording');
      onCancel();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show initial ready state - waiting for user to click start
  if (isReady && !isRecording) {
    return (
      <View style={styles.container}>
        <View style={styles.recorderContent}>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Ionicons name="close" size={24} color={COLORS.textMuted} />
          </Pressable>

          <View style={styles.readyInfo}>
            <Pressable
              style={styles.startButton}
              onPress={startRecording}
            >
              <Ionicons
                name="mic"
                size={32}
                color={COLORS.background}
              />
            </Pressable>
            <Text style={styles.readyText}>Tap to start recording</Text>
          </View>

          <View style={styles.placeholderButton} />
        </View>
      </View>
    );
  }

  // Show loading state while starting recording (not during preview)
  if (!isRecording && !recording && !isReady && !isPreviewing) {
    return (
      <View style={styles.container}>
        <View style={[styles.recorderContent, { justifyContent: 'center' }]}>
          <LoadingSpinner size="sm" />
          <Text style={{ marginLeft: SPACING.sm, color: COLORS.textMuted }}>Starting recording...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isRecording ? (
        <View style={styles.recorderContent}>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Ionicons name="close" size={24} color={COLORS.textMuted} />
          </Pressable>

          <View style={styles.recordingInfo}>
            <Pressable onPress={stopRecordingForPreview}>
              <Animated.View
                style={[
                  styles.recordButton,
                  {
                    transform: [{ scale: scaleAnim }],
                    backgroundColor: COLORS.error,
                  },
                ]}
              >
                <Ionicons
                  name="mic"
                  size={32}
                  color={COLORS.background}
                />
              </Animated.View>
            </Pressable>

            <View style={styles.durationContainer}>
              <View style={styles.waveform}>
                {Array.from({ length: 20 }).map((_, i) => {
                  // Create a wave pattern that responds to audio level
                  const baseHeight = 4;
                  const maxHeight = 24;
                  // Use index to create a wave pattern
                  const wavePhase = (i / 20) * Math.PI * 2;
                  const waveAmplitude = audioLevel;
                  // Create a sine wave pattern based on position
                  const waveValue = Math.sin(wavePhase);
                  const height = baseHeight + (maxHeight - baseHeight) * (0.3 + waveAmplitude * (0.5 + 0.5 * waveValue));
                  const opacity = 0.4 + audioLevel * 0.6;
                  
                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: Math.max(4, Math.min(maxHeight, height)),
                          opacity: opacity,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.duration}>{formatDuration(duration)}</Text>
            </View>
          </View>

          <View style={styles.placeholderButton} />
        </View>
      ) : isPreviewing ? (
        <View style={styles.recorderContent}>
          <Pressable
            style={styles.cancelButton}
            onPress={cancelRecording}
          >
            <Ionicons name="close" size={24} color={COLORS.textMuted} />
          </Pressable>

          <View style={styles.recordingInfo}>
            <Pressable onPress={togglePreviewPlayback}>
              <View
                style={[
                  styles.recordButton,
                  {
                    backgroundColor: isPlayingPreview ? COLORS.primary : COLORS.success,
                  },
                ]}
              >
                <Ionicons
                  name={isPlayingPreview ? 'pause' : 'play'}
                  size={32}
                  color={COLORS.background}
                />
              </View>
            </Pressable>

            <View style={styles.durationContainer}>
              <View style={styles.waveform}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const baseHeight = 4;
                  const maxHeight = 24;
                  const progress = durationRef.current > 0 ? (previewPosition / durationRef.current) : 0;
                  const isActive = i / 20 < progress;
                  const height = isActive ? maxHeight : baseHeight;
                  const opacity = isActive ? 1 : 0.3;
                  
                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: Math.max(4, Math.min(maxHeight, height)),
                          opacity: opacity,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.duration}>{formatDuration(previewPosition || durationRef.current)}</Text>
            </View>
          </View>

          <Pressable
            style={styles.sendButton}
            onPress={sendRecording}
          >
            <Ionicons
              name="send"
              size={20}
              color={COLORS.primary}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  recorderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationContainer: {
    flex: 1,
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
    marginBottom: SPACING.xs,
  },
  waveBar: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
  duration: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    borderColor: COLORS.glass.border,
    opacity: 0.5,
  },
  readyInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  startButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  readyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },
});

