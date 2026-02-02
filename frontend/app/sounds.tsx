import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { BlurView } from 'expo-blur';
import { GlassCard, GlassButton } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scene-based sounds inspired by Headspace
export interface SoundScene {
  id: string;
  name: string;
  description: string;
  category: 'focus' | 'sleep' | 'meditate' | 'breath';
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  sounds: {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    audioUrl?: string;
  }[];
  duration?: number; // in minutes
}

export const SOUND_SCENES: SoundScene[] = [
  // Focus Scenes
  {
    id: 'rainy-day',
    name: 'Rainy Day',
    description: 'Gentle rain for deep focus',
    category: 'focus',
    icon: 'rainy',
    gradient: ['#1E3A5F', '#2C5282', '#1E293B'],
    sounds: [
      { id: 'rain', name: 'Rain', icon: 'rainy' },
      { id: 'thunder', name: 'Thunder', icon: 'flash' },
    ],
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    description: 'Ambient café sounds',
    category: 'focus',
    icon: 'cafe',
    gradient: ['#78350F', '#92400E', '#5C2D0A'],
    sounds: [
      { id: 'coffee', name: 'Coffee Shop', icon: 'cafe' },
      { id: 'conversation', name: 'Conversation', icon: 'chatbubbles' },
    ],
  },
  {
    id: 'library',
    name: 'Library',
    description: 'Quiet study atmosphere',
    category: 'focus',
    icon: 'library',
    gradient: ['#1E293B', '#334155', '#0F172A'],
    sounds: [
      { id: 'pages', name: 'Pages', icon: 'document-text' },
      { id: 'silence', name: 'Silence', icon: 'volume-mute' },
    ],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Nature sounds for concentration',
    category: 'focus',
    icon: 'leaf',
    gradient: ['#14532D', '#166534', '#0A3D1F'],
    sounds: [
      { id: 'birds', name: 'Birds', icon: 'bird' },
      { id: 'wind', name: 'Wind', icon: 'cloud' },
      { id: 'leaves', name: 'Leaves', icon: 'leaf' },
    ],
  },
  // Sleep Scenes
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Calming waves for sleep',
    category: 'sleep',
    icon: 'water',
    gradient: ['#0C4A6E', '#075985', '#082F49'],
    sounds: [
      { id: 'waves', name: 'Waves', icon: 'water' },
      { id: 'seagulls', name: 'Seagulls', icon: 'bird' },
    ],
  },
  {
    id: 'campfire',
    name: 'Campfire',
    description: 'Crackling fire for relaxation',
    category: 'sleep',
    icon: 'flame',
    gradient: ['#7C2D12', '#9A3412', '#5C1F0A'],
    sounds: [
      { id: 'fire', name: 'Fire', icon: 'flame' },
      { id: 'crackling', name: 'Crackling', icon: 'radio' },
    ],
  },
  {
    id: 'night-rain',
    name: 'Night Rain',
    description: 'Soothing rain for bedtime',
    category: 'sleep',
    icon: 'moon',
    gradient: ['#1E1B4B', '#312E81', '#0F0A2E'],
    sounds: [
      { id: 'rain', name: 'Rain', icon: 'rainy' },
      { id: 'wind', name: 'Wind', icon: 'cloud' },
    ],
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    description: 'Consistent sound for deep sleep',
    category: 'sleep',
    icon: 'radio',
    gradient: ['#374151', '#4B5563', '#1F2937'],
    sounds: [
      { id: 'white', name: 'White Noise', icon: 'radio' },
      { id: 'pink', name: 'Pink Noise', icon: 'radio' },
      { id: 'brown', name: 'Brown Noise', icon: 'radio' },
    ],
  },
  // Meditate Scenes
  {
    id: 'temple',
    name: 'Temple',
    description: 'Peaceful temple ambiance',
    category: 'meditate',
    icon: 'flower',
    gradient: ['#581C87', '#6B21A8', '#3B0764'],
    sounds: [
      { id: 'bells', name: 'Bells', icon: 'notifications' },
      { id: 'chanting', name: 'Chanting', icon: 'musical-notes' },
    ],
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Flowing water for mindfulness',
    category: 'meditate',
    icon: 'water',
    gradient: ['#0E7490', '#0891B2', '#164E63'],
    sounds: [
      { id: 'waterfall', name: 'Waterfall', icon: 'water' },
      { id: 'stream', name: 'Stream', icon: 'water' },
    ],
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    description: 'Serene garden sounds',
    category: 'meditate',
    icon: 'leaf',
    gradient: ['#166534', '#15803D', '#0F4A1F'],
    sounds: [
      { id: 'wind-chimes', name: 'Wind Chimes', icon: 'notifications' },
      { id: 'nature', name: 'Nature', icon: 'leaf' },
    ],
  },
  {
    id: 'crystal',
    name: 'Crystal',
    description: 'Harmonious crystal tones',
    category: 'meditate',
    icon: 'diamond',
    gradient: ['#7C3AED', '#8B5CF6', '#5B21B6'],
    sounds: [
      { id: 'crystal', name: 'Crystal', icon: 'diamond' },
      { id: 'singing-bowl', name: 'Singing Bowl', icon: 'radio' },
    ],
  },
  // Breath Scenes
  {
    id: 'ocean-breath',
    name: 'Ocean Breath',
    description: 'Rhythmic waves for breathing',
    category: 'breath',
    icon: 'water',
    gradient: ['#0891B2', '#06B6D4', '#0E7490'],
    sounds: [
      { id: 'waves', name: 'Waves', icon: 'water' },
      { id: 'tide', name: 'Tide', icon: 'water' },
    ],
  },
  {
    id: 'forest-breath',
    name: 'Forest Breath',
    description: 'Nature rhythm for breathing',
    category: 'breath',
    icon: 'leaf',
    gradient: ['#059669', '#10B981', '#047857'],
    sounds: [
      { id: 'wind', name: 'Wind', icon: 'cloud' },
      { id: 'leaves', name: 'Leaves', icon: 'leaf' },
    ],
  },
  {
    id: 'desert',
    name: 'Desert',
    description: 'Calm desert breeze',
    category: 'breath',
    icon: 'sunny',
    gradient: ['#D97706', '#F59E0B', '#B45309'],
    sounds: [
      { id: 'wind', name: 'Wind', icon: 'cloud' },
      { id: 'sand', name: 'Sand', icon: 'radio' },
    ],
  },
  {
    id: 'mountain',
    name: 'Mountain',
    description: 'Fresh mountain air',
    category: 'breath',
    icon: 'mountain',
    gradient: ['#475569', '#64748B', '#334155'],
    sounds: [
      { id: 'wind', name: 'Wind', icon: 'cloud' },
      { id: 'birds', name: 'Birds', icon: 'bird' },
    ],
  },
];

interface PlayingSound {
  sceneId: string;
  soundId: string;
  audio: Audio.Sound;
  volume: number;
  isPlaying: boolean;
}

export default function SoundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<'focus' | 'sleep' | 'meditate' | 'breath' | 'all'>('all');
  const [playingSounds, setPlayingSounds] = useState<Map<string, PlayingSound>>(new Map());
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  // Configure audio mode on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
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

  const toggleSound = useCallback(async (sceneId: string, soundId: string) => {
    const key = `${sceneId}-${soundId}`;
    const existing = playingSounds.get(key);

    if (existing) {
      // Sound is playing - stop it
      try {
        await existing.audio.stopAsync();
        await existing.audio.unloadAsync();
        setPlayingSounds((prev) => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    } else {
      // Sound is not playing - start it
      try {
        // Placeholder audio - replace with actual audio files in production
        const { sound: audioSound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
          {
            shouldPlay: true,
            isLooping: true,
            volume: 0.5,
          }
        );

        setPlayingSounds((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, {
            sceneId,
            soundId,
            audio: audioSound,
            volume: 0.5,
            isPlaying: true,
          });
          return newMap;
        });
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  }, [playingSounds]);

  const updateVolume = useCallback(async (key: string, volume: number) => {
    const playing = playingSounds.get(key);
    if (playing) {
      try {
        await playing.audio.setVolumeAsync(volume);
        setPlayingSounds((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(key);
          if (existing) {
            newMap.set(key, { ...existing, volume });
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

  const filteredScenes = selectedCategory === 'all'
    ? SOUND_SCENES
    : SOUND_SCENES.filter((s) => s.category === selectedCategory);

  const playingSoundsList = Array.from(playingSounds.values());
  const hasPlayingSounds = playingSoundsList.length > 0;

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
        <Text style={styles.headerTitle}>Sounds & Scenes</Text>
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

      {/* Category Filter */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <Pressable
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
              All
            </Text>
          </Pressable>
          <Pressable
            style={[styles.categoryChip, selectedCategory === 'meditate' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('meditate')}
          >
            <Ionicons
              name="flower-outline"
              size={18}
              color={selectedCategory === 'meditate' ? COLORS.white : COLORS.textMuted}
              style={styles.categoryIcon}
            />
            <Text style={[styles.categoryChipText, selectedCategory === 'meditate' && styles.categoryChipTextActive]}>
              Meditate
            </Text>
          </Pressable>
          <Pressable
            style={[styles.categoryChip, selectedCategory === 'sleep' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('sleep')}
          >
            <Ionicons
              name="moon-outline"
              size={18}
              color={selectedCategory === 'sleep' ? COLORS.white : COLORS.textMuted}
              style={styles.categoryIcon}
            />
            <Text style={[styles.categoryChipText, selectedCategory === 'sleep' && styles.categoryChipTextActive]}>
              Sleep
            </Text>
          </Pressable>
          <Pressable
            style={[styles.categoryChip, selectedCategory === 'breath' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('breath')}
          >
            <Ionicons
              name="pulse-outline"
              size={18}
              color={selectedCategory === 'breath' ? COLORS.white : COLORS.textMuted}
              style={styles.categoryIcon}
            />
            <Text style={[styles.categoryChipText, selectedCategory === 'breath' && styles.categoryChipTextActive]}>
              Breath
            </Text>
          </Pressable>
          <Pressable
            style={[styles.categoryChip, selectedCategory === 'focus' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('focus')}
          >
            <Ionicons
              name="bulb-outline"
              size={18}
              color={selectedCategory === 'focus' ? COLORS.white : COLORS.textMuted}
              style={styles.categoryIcon}
            />
            <Text style={[styles.categoryChipText, selectedCategory === 'focus' && styles.categoryChipTextActive]}>
              Focus
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Currently Playing - Compact View */}
      {hasPlayingSounds && (
        <View style={styles.playingSection}>
          <View style={styles.playingHeader}>
            <Text style={styles.playingTitle}>Now Playing</Text>
            <Pressable onPress={stopAllSounds} style={styles.stopAllButton}>
              <Ionicons name="stop-circle-outline" size={20} color={COLORS.error} />
              <Text style={styles.stopAllText}>Stop All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playingScroll}>
            {playingSoundsList.map((playing) => {
              const scene = SOUND_SCENES.find((s) => s.id === playing.sceneId);
              const sound = scene?.sounds.find((s) => s.id === playing.soundId);
              if (!scene || !sound) return null;
              
              const key = `${playing.sceneId}-${playing.soundId}`;
              return (
                <GlassCard key={key} style={styles.playingCard} padding="sm">
                  <View style={styles.playingCardContent}>
                    <Pressable
                      style={[styles.playingIcon, { backgroundColor: `${COLORS.primary}20` }]}
                      onPress={() => toggleSound(playing.sceneId, playing.soundId)}
                    >
                      <Ionicons name={sound.icon} size={20} color={COLORS.primary} />
                    </Pressable>
                    <Text style={styles.playingSoundName} numberOfLines={1}>
                      {sound.name}
                    </Text>
                    <Slider
                      style={styles.volumeSlider}
                      minimumValue={0}
                      maximumValue={1}
                      value={playing.volume}
                      onValueChange={(value) => updateVolume(key, value)}
                      minimumTrackTintColor={COLORS.primary}
                      maximumTrackTintColor={COLORS.glass.border}
                      thumbTintColor={COLORS.primary}
                    />
                  </View>
                </GlassCard>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Scenes Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredScenes.map((scene) => {
          const scenePlayingSounds = Array.from(playingSounds.values()).filter(
            (p) => p.sceneId === scene.id
          );
          const isSceneActive = scenePlayingSounds.length > 0;
          const isExpanded = expandedScene === scene.id;

          return (
            <Pressable
              key={scene.id}
              style={styles.sceneCard}
              onPress={() => setExpandedScene(isExpanded ? null : scene.id)}
            >
              <LinearGradient
                colors={scene.gradient}
                style={styles.sceneCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <BlurView intensity={20} style={styles.sceneCardBlur}>
                  <View style={styles.sceneCardContent}>
                    <View style={styles.sceneHeader}>
                      <View style={[styles.sceneIcon, { backgroundColor: `${COLORS.white}20` }]}>
                        <Ionicons name={scene.icon} size={32} color={COLORS.white} />
                      </View>
                      <View style={styles.sceneInfo}>
                        <Text style={styles.sceneName}>{scene.name}</Text>
                        <Text style={styles.sceneDescription}>{scene.description}</Text>
                      </View>
                      {isSceneActive && (
                        <View style={styles.activeIndicator}>
                          <View style={styles.activeDot} />
                        </View>
                      )}
                    </View>

                    {isExpanded && (
                      <View style={styles.soundsList}>
                        {scene.sounds.map((sound) => {
                          const key = `${scene.id}-${sound.id}`;
                          const isPlaying = playingSounds.has(key);
                          const playing = playingSounds.get(key);

                          return (
                            <View key={sound.id} style={styles.soundItem}>
                              <Pressable
                                style={[styles.soundItemButton, isPlaying && styles.soundItemButtonActive]}
                                onPress={() => toggleSound(scene.id, sound.id)}
                              >
                                <Ionicons
                                  name={isPlaying ? 'pause' : 'play'}
                                  size={20}
                                  color={isPlaying ? COLORS.white : COLORS.text}
                                />
                                <Text style={[styles.soundItemName, isPlaying && styles.soundItemNameActive]}>
                                  {sound.name}
                                </Text>
                              </Pressable>
                              {isPlaying && playing && (
                                <Slider
                                  style={styles.soundVolumeSlider}
                                  minimumValue={0}
                                  maximumValue={1}
                                  value={playing.volume}
                                  onValueChange={(value) => updateVolume(key, value)}
                                  minimumTrackTintColor={COLORS.white}
                                  maximumTrackTintColor={COLORS.glass.border}
                                  thumbTintColor={COLORS.white}
                                />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </BlurView>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>

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
  playingSection: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  playingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  playingTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  stopAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  stopAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
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
  playingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  sceneCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    height: 140,
  },
  sceneCardGradient: {
    flex: 1,
  },
  sceneCardBlur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sceneCardContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  sceneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sceneIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sceneInfo: {
    flex: 1,
  },
  sceneName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    marginBottom: SPACING.xs / 2,
  },
  sceneDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  soundsList: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  soundItem: {
    marginBottom: SPACING.xs,
  },
  soundItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    gap: SPACING.sm,
  },
  soundItemButtonActive: {
    backgroundColor: `${COLORS.white}30`,
  },
  soundItemName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  soundItemNameActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  soundVolumeSlider: {
    marginTop: SPACING.xs,
    height: 20,
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
