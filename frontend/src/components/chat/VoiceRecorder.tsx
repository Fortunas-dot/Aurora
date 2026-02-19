import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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
  const levelInterval = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (levelInterval.current) {
        clearInterval(levelInterval.current);
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start audio level monitoring
      levelInterval.current = setInterval(async () => {
        if (newRecording) {
          try {
            const status = await newRecording.getStatusAsync();
            if (status.isRecording && status.metering !== undefined) {
              const level = Math.max(0, Math.min(1, (status.metering + 60) / 60));
              setAudioLevel(level);
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }, 100);

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
    } catch (error) {
      console.error('Failed to start recording:', error);
      onCancel();
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      if (levelInterval.current) {
        clearInterval(levelInterval.current);
        levelInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && duration > 0) {
        onRecordingComplete(uri, duration);
      } else {
        onCancel();
      }

      setRecording(null);
      setIsRecording(false);
      setDuration(0);
      setAudioLevel(0);
      scaleAnim.setValue(1);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onCancel();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
                {Array.from({ length: 20 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: 4 + audioLevel * 20 * Math.random(),
                        opacity: 0.3 + audioLevel * 0.7,
                      },
                    ]}
                  />
                ))}
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
      ) : (
        <View style={styles.startRecordingContainer}>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Ionicons name="close" size={24} color={COLORS.textMuted} />
          </Pressable>

          <Pressable style={styles.startButton} onPress={startRecording}>
            <Ionicons name="mic" size={24} color={COLORS.background} />
            <Text style={styles.startButtonText}>Tap to start recording</Text>
          </Pressable>

          <View style={styles.placeholderButton} />
        </View>
      )}
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
  startRecordingContainer: {
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
  placeholderButton: {
    width: 44,
    height: 44,
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
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  startButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.background,
    fontWeight: '600',
  },
});

