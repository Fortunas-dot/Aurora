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

  // Normalize URI to ensure it's always absolute
  const normalizedUri = useMemo(() => {
    if (!uri) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceMessagePlayer.tsx:25',message:'VoiceMessagePlayer - Empty URI',data:{uri},timestamp:Date.now(),runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      return uri;
    }
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceMessagePlayer.tsx:28',message:'VoiceMessagePlayer - URI received',data:{uri, isAbsolute:uri.startsWith('http'), startsWithSlash:uri.startsWith('/')},timestamp:Date.now(),runId:'run1',hypothesisId:'P'})}).catch(()=>{});
    // #endregion
    // If already absolute, return as-is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceMessagePlayer.tsx:32',message:'VoiceMessagePlayer - URI is already absolute',data:{uri},timestamp:Date.now(),runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
      // #endregion
      return uri;
    }
    // If relative, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    let normalized: string;
    if (uri.startsWith('/')) {
      normalized = `${baseUrl}${uri}`;
    } else {
      // If it doesn't start with /, add it
      normalized = `${baseUrl}/${uri}`;
    }
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceMessagePlayer.tsx:42',message:'VoiceMessagePlayer - URI normalized',data:{original:uri, normalized},timestamp:Date.now(),runId:'run1',hypothesisId:'R'})}).catch(()=>{});
    // #endregion
    return normalized;
  }, [uri]);

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

  // Unload sound when component unmounts or when URI changes
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
        setSound(null);
        setIsPlaying(false);
        setPosition(0);
      }
    };
  }, [sound, normalizedUri]);

  const playSound = async () => {
    try {
      if (sound) {
        // Check if the sound is still valid before trying to play
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (isPlaying) {
              await sound.pauseAsync();
              setIsPlaying(false);
            } else {
              // Check if audio finished - if so, reset to beginning
              const currentPos = status.positionMillis / 1000;
              const totalDuration = status.durationMillis ? status.durationMillis / 1000 : duration;
              if (totalDuration > 0 && currentPos >= totalDuration - 0.1) {
                await sound.setPositionAsync(0);
                setPosition(0);
              }
              await sound.playAsync();
              setIsPlaying(true);
            }
            return;
          } else {
            // Sound is not loaded, unload it and create a new one
            console.log('VoiceMessagePlayer: Sound not loaded, creating new sound');
            await sound.unloadAsync().catch(console.error);
            setSound(null);
          }
        } catch (statusError) {
          // Sound object is invalid, unload it and create a new one
          console.warn('VoiceMessagePlayer: Error checking sound status, creating new sound:', statusError);
          try {
            await sound.unloadAsync().catch(console.error);
          } catch (unloadError) {
            // Ignore unload errors
          }
          setSound(null);
        }
      }

      // Ensure audio plays even when iPhone is in silent mode, and configure session safely
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (modeError) {
        console.warn('VoiceMessagePlayer: Failed to set audio mode, continuing anyway:', modeError);
      }

      // Always create a fresh sound object to ensure the URI is valid
      console.log('VoiceMessagePlayer: Creating new sound with URI:', normalizedUri);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceMessagePlayer.tsx:131',message:'VoiceMessagePlayer - Attempting to create sound',data:{normalizedUri, uriLength:normalizedUri?.length},timestamp:Date.now(),runId:'run1',hypothesisId:'S'})}).catch(()=>{});
      // #endregion
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: normalizedUri },
        { shouldPlay: true }
      );
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceMessagePlayer.tsx:137',message:'VoiceMessagePlayer - Sound created successfully',data:{normalizedUri},timestamp:Date.now(),runId:'run1',hypothesisId:'T'})}).catch(()=>{});
      // #endregion

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
        } else if (status.error) {
          // Handle playback errors
          console.error('VoiceMessagePlayer: Playback error:', status.error);
          setIsPlaying(false);
          setPosition(0);
        }
      });
    } catch (error: any) {
      console.error('Error playing audio:', error);
      // #region agent log
      const errorMessage = error?.message || error?.localizedDescription || error?.error || 'Unknown error';
      const errorCode = error?.code || error?.nativeEvent?.code;
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceMessagePlayer.tsx:156',message:'VoiceMessagePlayer - Error playing audio',data:{errorMessage, errorCode, normalizedUri, uriLength:normalizedUri?.length, fullError:JSON.stringify(error)},timestamp:Date.now(),runId:'run1',hypothesisId:'U'})}).catch(()=>{});
      // #endregion
      // Reset state on error
      setIsPlaying(false);
      setPosition(0);
      setSound(null);
      // Show user-friendly error (optional - you might want to show an alert here)
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Clamp progress between 0% and 100% so the bar never overflows its container
  const progress = duration > 0
    ? Math.min(Math.max((position / duration) * 100, 0), 100)
    : 0;

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

