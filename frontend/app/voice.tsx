import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { WaveformVisualizer } from '../src/components/voice/WaveformVisualizer';
import { useVoiceTherapy } from '../src/hooks/useVoiceTherapy';
import { useVoiceTherapyPersonaPlex } from '../src/hooks/useVoiceTherapyPersonaPlex';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/constants/theme';

type ModelType = 'openai' | 'personaplex';

export default function VoiceTherapyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modelType, setModelType] = useState<ModelType>('personaplex');

  // Conditionally initialize hooks based on selected model
  // Only the active hook will be initialized to avoid conflicts
  const openaiTherapy = useVoiceTherapy({ enabled: modelType === 'openai' });
  const personaplexTherapy = useVoiceTherapyPersonaPlex({ enabled: modelType === 'personaplex' });

  // Use the selected model's state
  const therapy = modelType === 'openai' ? openaiTherapy : personaplexTherapy;
  
  // Handle model switching - cleanup previous model when switching
  const handleModelSwitch = (newModel: ModelType) => {
    if (newModel !== modelType) {
      // The hooks will handle cleanup automatically via useEffect cleanup
      setModelType(newModel);
    }
  };
  
  const {
    state,
    audioLevel,
    error,
    isMuted,
    toggleMute,
  } = therapy;

  const getStateText = () => {
    switch (state) {
      case 'initializing':
        return 'Verbinding maken...';
      case 'listening':
        return isMuted ? 'Gepauzeerd' : 'Ik luister naar je...';
      case 'processing':
        return 'Even nadenken...';
      case 'speaking':
        return 'Aurora spreekt...';
      case 'error':
        return 'Er is een fout opgetreden';
      default:
        return 'Welkom bij voice therapy';
    }
  };

  const getAuroraCoreState = () => {
    if (state === 'speaking') return 'speaking';
    if (state === 'listening' && !isMuted) return 'listening';
    return 'idle';
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Voice Therapy</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Model Selector */}
      <View style={styles.modelSelector}>
        <Pressable
          style={[
            styles.modelButton,
            modelType === 'openai' && styles.modelButtonActive
          ]}
          onPress={() => handleModelSwitch('openai')}
        >
          <Text style={[
            styles.modelButtonText,
            modelType === 'openai' && styles.modelButtonTextActive
          ]}>
            OpenAI
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modelButton,
            modelType === 'personaplex' && styles.modelButtonActive
          ]}
          onPress={() => handleModelSwitch('personaplex')}
        >
          <Text style={[
            styles.modelButtonText,
            modelType === 'personaplex' && styles.modelButtonTextActive
          ]}>
            PersonaPlex 7B
          </Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Aurora Core */}
        <View style={styles.coreContainer}>
          <AuroraCore state={getAuroraCoreState()} audioLevel={audioLevel} />
        </View>

        {/* Waveform */}
        {(state === 'listening' || state === 'speaking') && (
          <View style={styles.waveformContainer}>
            <WaveformVisualizer
              audioLevel={audioLevel}
              isActive={state === 'listening' || state === 'speaking'}
            />
          </View>
        )}

        {/* State Text */}
        <Text style={styles.stateText}>{getStateText()}</Text>
        
        {/* Model Indicator */}
        <Text style={styles.modelIndicator}>
          {modelType === 'openai' ? 'OpenAI Realtime' : 'NVIDIA PersonaPlex 7B'}
        </Text>

        {/* Hint */}
        {state === 'listening' && !isMuted && (
          <Text style={styles.hintText}>
            Spreek je gedachten uit. Ik stop automatisch wanneer je klaar bent.
          </Text>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <Pressable
          style={[styles.muteButton, isMuted && styles.muteButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={32}
            color={isMuted ? COLORS.error : COLORS.primary}
          />
        </Pressable>
        <Text style={styles.muteHint}>
          {isMuted ? 'Tik om te hervatten' : 'Tik om te pauzeren'}
        </Text>
      </View>
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  coreContainer: {
    marginBottom: SPACING.xl,
  },
  waveformContainer: {
    marginBottom: SPACING.lg,
  },
  stateText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  hintText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorGlass,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  bottomContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  muteButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.glass.background,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButtonActive: {
    backgroundColor: COLORS.errorGlass,
    borderColor: COLORS.error,
  },
  muteHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  modelSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass.background,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  modelButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modelButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  modelButtonTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  modelIndicator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
});
