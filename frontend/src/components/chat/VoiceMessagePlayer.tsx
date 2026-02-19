import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface VoiceMessagePlayerProps {
  uri: string;
  duration?: number;
  isOwn?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  uri,
  duration = 0,
  isOwn = false,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  // Calculate container width based on duration
  // Message bubble has maxWidth: 75% and paddingHorizontal: SPACING.md
  // Audio player container width (which includes its padding) must fit within bubble
  // So max container width = (screenWidth * 0.75) - (SPACING.md * 2)
  const containerWidth = useMemo(() => {
    const baseWidth = 120;
    const pixelsPerSecond = 8;
    const calculatedWidth = baseWidth + (duration * pixelsPerSecond);
    
    // Max width = bubble max width - bubble padding (left and right)
    // The container width includes its own padding, so this is the total width
    const bubbleMaxWidth = screenWidth * 0.75;
    const bubblePadding = SPACING.md * 2; // Left and right padding of message bubble
    const maxWidth = bubbleMaxWidth - bubblePadding;
    
    return Math.min(Math.max(calculatedWidth, baseWidth), maxWidth);
  }, [duration, screenWidth]);

  // Calculate progress container width
  // Container has padding: SPACING.sm on all sides
  // So available width = containerWidth - (SPACING.sm * 2) - playButtonWidth - gap
  const progressContainerWidth = useMemo(() => {
    const playButtonWidth = 40;
    const gap = SPACING.sm;
    const containerPadding = SPACING.sm * 2; // Left and right padding of container
    return containerWidth - containerPadding - playButtonWidth - gap;
  }, [containerWidth]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, [sound]);

  const playSound = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          // Check if audio finished - if so, reset to beginning
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            // If position is at or near the end (within 0.1 seconds), reset to beginning
            const currentPos = status.positionMillis / 1000;
            const totalDuration = status.durationMillis ? status.durationMillis / 1000 : duration;
            if (totalDuration > 0 && currentPos >= totalDuration - 0.1) {
              await sound.setPositionAsync(0);
              setPosition(0);
            }
          }
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis / 1000);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            // Reset sound position to beginning for next play
            newSound.setPositionAsync(0).catch(console.error);
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Pressable
      style={[
        styles.container,
        { width: containerWidth },
        isOwn && styles.containerOwn,
      ]}
      onPress={playSound}
    >
      <View style={[
        styles.playButton,
        isOwn && styles.playButtonOwn,
      ]}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={isOwn ? COLORS.primary : COLORS.white}
        />
      </View>
      <View style={[styles.progressContainer, { width: progressContainerWidth }]}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
              isOwn && styles.progressFillOwn,
            ]}
          />
        </View>
        <Text style={[
          styles.duration,
          isOwn && styles.durationOwn,
        ]}>
          {formatTime(position || duration)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  containerOwn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonOwn: {
    backgroundColor: COLORS.white,
  },
  progressContainer: {
    // Width is set dynamically via inline style
    minWidth: 0, // Allow shrinking if needed
  },
  progressBar: {
    height: 2,
    backgroundColor: COLORS.glass.border,
    borderRadius: 1,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  progressFillOwn: {
    backgroundColor: COLORS.background,
  },
  duration: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  durationOwn: {
    color: COLORS.background,
  },
});

