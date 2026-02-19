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
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const durationRef = useRef(0);

  // Auto-start recording when component mounts
  useEffect(() => {
    let mounted = true;
    
    // Start recording automatically when component is shown
    const initRecording = async () => {
      if (mounted) {
        await startRecording();
      }
    };
    
    initRecording();
    
    return () => {
      mounted = false;
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    };
  }, []); // Only run on mount

  const startRecording = async () => {
    try {
      // Request permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (!permissionResponse.granted) {
        console.error('Audio recording permission denied');
        onCancel();
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

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
        onCancel();
        return;
      }

      setRecording(newRecording);
      setIsRecording(true);
      durationRef.current = 0;
      setDuration(0);
      setAudioLevel(0);

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
      console.error('Failed to start recording:', error);
      Alert.alert('Error', error.message || 'Could not start recording');
      onCancel();
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Clear intervals first
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Stop and unload recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && durationRef.current > 0) {
        onRecordingComplete(uri, durationRef.current);
      } else if (uri) {
        // If duration is 0 but we have a URI, use minimum 1 second
        onRecordingComplete(uri, 1);
      } else {
        Alert.alert('Error', 'Recording file not found. Please try again.');
        onCancel();
      }

      setRecording(null);
      setIsRecording(false);
      durationRef.current = 0;
      setDuration(0);
      setAudioLevel(0);
      scaleAnim.setValue(1);
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', error.message || 'Could not stop recording');
      onCancel();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading state while starting recording
  if (!isRecording && !recording) {
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

          <Pressable
            style={[
              styles.sendButton,
              duration === 0 && styles.sendButtonDisabled,
            ]}
            onPress={stopRecording}
            disabled={duration === 0}
          >
            <Ionicons
              name="send"
              size={20}
              color={duration === 0 ? COLORS.textMuted : COLORS.primary}
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
});

