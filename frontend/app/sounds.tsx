import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
  Slider,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { GlassCard, GlassButton, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';

// Sound categories and sounds
export interface Sound {
  id: string;
  name: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  // For now, we'll use placeholder URLs. In production, you'd host these audio files
  audioUrl?: string;
}

export const SOUND_CATEGORIES = [
  {
    id: 'nature',
    name: 'Nature',
    icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap,
    color: COLORS.accent,
  },
  {
    id: 'urban',
    name: 'Urban',
    icon: 'business-outline' as keyof typeof Ionicons.glyphMap,
    color: COLORS.primary,
  },
  {
    id: 'abstract',
    name: 'Abstract',
    icon: 'infinite-outline' as keyof typeof Ionicons.glyphMap,
    color: COLORS.secondary,
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'water-outline' as keyof typeof Ionicons.glyphMap,
    color: COLORS.primary,
  },
];

export const SOUNDS: Sound[] = [
  // Nature
  { id: 'rain', name: 'Rain', category: 'nature', icon: 'rainy-outline', color: COLORS.primary },
  { id: 'forest', name: 'Forest', category: 'nature', icon: 'leaf-outline', color: COLORS.accent },
  { id: 'birds', name: 'Birds', category: 'nature', icon: 'bird-outline', color: COLORS.accent },
  { id: 'wind', name: 'Wind', category: 'nature', icon: 'cloud-outline', color: COLORS.primary },
  { id: 'thunder', name: 'Thunder', category: 'nature', icon: 'flash-outline', color: COLORS.warning },
  
  // Urban
  { id: 'coffee', name: 'Coffee Shop', category: 'urban', icon: 'cafe-outline', color: COLORS.warning },
  { id: 'city', name: 'City', category: 'urban', icon: 'business-outline', color: COLORS.primary },
  { id: 'train', name: 'Train', category: 'urban', icon: 'train-outline', color: COLORS.secondary },
  { id: 'library', name: 'Library', category: 'urban', icon: 'library-outline', color: COLORS.primary },
  
  // Water
  { id: 'ocean', name: 'Ocean', category: 'water', icon: 'water-outline', color: COLORS.primary },
  { id: 'river', name: 'River', category: 'water', icon: 'water-outline', color: COLORS.accent },
  { id: 'waterfall', name: 'Waterfall', category: 'water', icon: 'water-outline', color: COLORS.accent },
  { id: 'waves', name: 'Waves', category: 'water', icon: 'water-outline', color: COLORS.primary },
  
  // Abstract
  { id: 'pink', name: 'Pink Noise', category: 'abstract', icon: 'radio-outline', color: COLORS.secondary },
  { id: 'brown', name: 'Brown Noise', category: 'abstract', icon: 'radio-outline', color: COLORS.warning },
  { id: 'white', name: 'White Noise', category: 'abstract', icon: 'radio-outline', color: COLORS.primary },
];

interface PlayingSound {
  sound: Sound;
  audio: Audio.Sound;
  volume: number;
  isPlaying: boolean;
}

export default function SoundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [playingSounds, setPlayingSounds] = useState<Map<string, PlayingSound>>(new Map());
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Configure audio mode on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
    });

    return () => {
      // Cleanup: stop all sounds
      playingSounds.forEach((playing) => {
        playing.audio.unloadAsync().catch(console.error);
      });
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timerMinutes === null && timerSeconds === 0) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 0) {
          if (timerMinutes === null || timerMinutes <= 0) {
            // Timer finished - stop all sounds
            stopAllSounds();
            setTimerMinutes(null);
            setTimerSeconds(0);
            return 0;
          }
          setTimerMinutes((prevMin) => (prevMin || 0) - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMinutes, timerSeconds]);

  const toggleSound = useCallback(async (sound: Sound) => {
    const existing = playingSounds.get(sound.id);

    if (existing) {
      // Sound is playing - stop it
      try {
        await existing.audio.stopAsync();
        await existing.audio.unloadAsync();
        setPlayingSounds((prev) => {
          const newMap = new Map(prev);
          newMap.delete(sound.id);
          return newMap;
        });
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    } else {
      // Sound is not playing - start it
      try {
        // For now, we'll use a placeholder. In production, you'd load actual audio files
        // You can use local files or hosted URLs
        const { sound: audioSound } = await Audio.Sound.createAsync(
          // Placeholder - replace with actual audio file URL or require()
          // For example: require('../../assets/sounds/rain.mp3')
          // Or: { uri: 'https://your-cdn.com/sounds/rain.mp3' }
          { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder
          {
            shouldPlay: true,
            isLooping: true,
            volume: 0.5,
          }
        );

        setPlayingSounds((prev) => {
          const newMap = new Map(prev);
          newMap.set(sound.id, {
            sound,
            audio: audioSound,
            volume: 0.5,
            isPlaying: true,
          });
          return newMap;
        });
      } catch (error) {
        console.error('Error playing sound:', error);
        // For now, just show that it would play
        // In production, handle the error properly
      }
    }
  }, [playingSounds]);

  const updateVolume = useCallback(async (soundId: string, volume: number) => {
    const playing = playingSounds.get(soundId);
    if (playing) {
      try {
        await playing.audio.setVolumeAsync(volume);
        setPlayingSounds((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(soundId);
          if (existing) {
            newMap.set(soundId, { ...existing, volume });
          }
          return newMap;
        });
      } catch (error) {
        console.error('Error updating volume:', error);
      }
    }
  }, [playingSounds]);

  const stopAllSounds = useCallback(async () => {
    const soundsToStop = Array.from(playingSounds.values());
    for (const playing of soundsToStop) {
      try {
        await playing.audio.stopAsync();
        await playing.audio.unloadAsync();
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
    setPlayingSounds(new Map());
  }, [playingSounds]);

  const formatTime = (minutes: number | null, seconds: number): string => {
    if (minutes === null) return '00:00';
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const setTimer = (minutes: number) => {
    setTimerMinutes(minutes);
    setTimerSeconds(0);
    setShowTimerModal(false);
  };

  const filteredSounds = selectedCategory
    ? SOUNDS.filter((s) => s.category === selectedCategory)
    : SOUNDS;

  const playingSoundsList = Array.from(playingSounds.values());

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sounds & Noises</Text>
        <Pressable style={styles.timerButton} onPress={() => setShowTimerModal(true)}>
          <Ionicons name="timer-outline" size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* Timer Display */}
      {(timerMinutes !== null || timerSeconds > 0) && (
        <View style={styles.timerDisplay}>
          <Ionicons name="timer" size={20} color={COLORS.primary} />
          <Text style={styles.timerText}>{formatTime(timerMinutes, timerSeconds)}</Text>
          <Pressable onPress={() => { setTimerMinutes(null); setTimerSeconds(0); }}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>
      )}

      {/* Currently Playing */}
      {playingSoundsList.length > 0 && (
        <View style={styles.playingSection}>
          <Text style={styles.sectionTitle}>Currently Playing</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playingScroll}>
            {playingSoundsList.map((playing) => (
              <GlassCard key={playing.sound.id} style={styles.playingCard} padding="md">
                <View style={styles.playingCardContent}>
                  <Pressable
                    style={[styles.soundIcon, { backgroundColor: `${playing.sound.color}20` }]}
                    onPress={() => toggleSound(playing.sound)}
                  >
                    <Ionicons name={playing.sound.icon} size={24} color={playing.sound.color} />
                  </Pressable>
                  <Text style={styles.playingSoundName} numberOfLines={1}>
                    {playing.sound.name}
                  </Text>
                  <Slider
                    style={styles.volumeSlider}
                    minimumValue={0}
                    maximumValue={1}
                    value={playing.volume}
                    onValueChange={(value) => updateVolume(playing.sound.id, value)}
                    minimumTrackTintColor={playing.sound.color}
                    maximumTrackTintColor={COLORS.glass.border}
                    thumbTintColor={playing.sound.color}
                  />
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <Pressable
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              All
            </Text>
          </Pressable>
          {SOUND_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={selectedCategory === category.id ? COLORS.white : COLORS.textMuted}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryChipText, selectedCategory === category.id && styles.categoryChipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sounds Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.soundsGrid}>
          {filteredSounds.map((sound) => {
            const isPlaying = playingSounds.has(sound.id);
            return (
              <Pressable
                key={sound.id}
                style={styles.soundCard}
                onPress={() => toggleSound(sound)}
              >
                <GlassCard
                  style={[styles.soundCardInner, isPlaying && styles.soundCardPlaying]}
                  padding="lg"
                >
                  <View style={[styles.soundIconLarge, { backgroundColor: `${sound.color}20` }]}>
                    <Ionicons name={sound.icon} size={32} color={sound.color} />
                  </View>
                  <Text style={styles.soundName}>{sound.name}</Text>
                  {isPlaying && (
                    <View style={styles.playingIndicator}>
                      <Ionicons name="pause" size={16} color={sound.color} />
                    </View>
                  )}
                </GlassCard>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Stop All Button */}
      {playingSoundsList.length > 0 && (
        <View style={[styles.stopAllContainer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <GlassButton
            title="Stop All"
            onPress={stopAllSounds}
            variant="secondary"
            icon={<Ionicons name="stop" size={20} color={COLORS.text} />}
          />
        </View>
      )}

      {/* Timer Modal */}
      <Modal
        visible={showTimerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} padding="lg">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Timer</Text>
              <Pressable onPress={() => setShowTimerModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>
            <View style={styles.timerOptions}>
              {[5, 10, 15, 30, 45, 60, 90, 120].map((minutes) => (
                <Pressable
                  key={minutes}
                  style={styles.timerOption}
                  onPress={() => setTimer(minutes)}
                >
                  <Text style={styles.timerOptionText}>{minutes} min</Text>
                </Pressable>
              ))}
            </View>
            <GlassButton
              title="Cancel Timer"
              onPress={() => {
                setTimerMinutes(null);
                setTimerSeconds(0);
                setShowTimerModal(false);
              }}
              variant="secondary"
              style={styles.cancelTimerButton}
            />
          </GlassCard>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  timerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    backgroundColor: COLORS.glass.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  timerText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  playingSection: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  playingScroll: {
    paddingHorizontal: SPACING.md,
  },
  playingCard: {
    marginRight: SPACING.sm,
    minWidth: 120,
  },
  playingCardContent: {
    alignItems: 'center',
  },
  soundIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  soundIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  playingSoundName: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  volumeSlider: {
    width: '100%',
    height: 20,
  },
  categoriesSection: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  categoriesScroll: {
    paddingHorizontal: SPACING.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    marginRight: SPACING.xs,
  },
  categoryChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  soundCard: {
    width: '47%',
  },
  soundCardInner: {
    alignItems: 'center',
    minHeight: 140,
  },
  soundCardPlaying: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  soundName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    textAlign: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  stopAllContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  timerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  timerOption: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    alignItems: 'center',
  },
  timerOptionText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  cancelTimerButton: {
    marginTop: SPACING.sm,
  },
});

