import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { GlassCard, GlassButton } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useVoiceTherapy } from '../src/hooks/useVoiceTherapy';
import { useAuthStore } from '../src/store/authStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { useConsentStore } from '../src/store/consentStore';
import { AiConsentCard } from '../src/components/legal/AiConsentCard';

export default function VoiceTherapyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const { aiConsentStatus, loadConsent, grantAiConsent, denyAiConsent } = useConsentStore();

  // Load consent status once
  useEffect(() => {
    loadConsent().catch(console.error);
  }, [loadConsent]);

  const {
    state,
    audioLevel,
    error,
    isMuted,
    transcript,
    toggleMute,
  } = useVoiceTherapy({ enabled: aiConsentStatus === 'granted' });

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        t('Login Required'),
        t('Please log in to use voice therapy'),
        [
          { text: t('Cancel'), style: 'cancel', onPress: () => router.back() },
          { text: t('Login'), onPress: () => router.push('/(auth)/login') },
        ]
      );
    }
  }, [isAuthenticated, router, t]);

  const getStateLabel = () => {
    switch (state) {
      case 'listening':
        return t('Listening...');
      case 'speaking':
        return t('Aurora is speaking...');
      case 'processing':
        return t('Processing...');
      default:
        return t('Ready to talk');
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'listening':
        return 'mic';
      case 'speaking':
        return 'volume-high';
      case 'processing':
        return 'hourglass';
      default:
        return 'mic-outline';
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

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
        <Text style={styles.headerTitle}>{t('Voice Therapy')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Consent */}
        {aiConsentStatus !== 'granted' && (
          <AiConsentCard
            onAccept={grantAiConsent}
            onDecline={denyAiConsent}
          />
        )}

        {/* Aurora Core */}
        <View style={styles.coreContainer}>
          <AuroraCore 
            state={state === 'idle' || state === 'processing' ? 'idle' : state === 'speaking' ? 'speaking' : 'listening'} 
            audioLevel={audioLevel} 
          />
        </View>

        {/* State Indicator */}
        <GlassCard style={styles.stateCard} padding="md">
          <View style={styles.stateContainer}>
            <Ionicons 
              name={getStateIcon() as keyof typeof Ionicons.glyphMap} 
              size={24} 
              color={state === 'listening' ? COLORS.primary : state === 'speaking' ? COLORS.success : COLORS.textMuted} 
            />
            <Text style={styles.stateText}>{getStateLabel()}</Text>
          </View>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <GlassCard style={styles.errorCard} padding="md">
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </GlassCard>
        )}

        {/* Transcript */}
        {transcript && (
          <GlassCard style={styles.transcriptCard} padding="md">
            <Text style={styles.transcriptLabel}>{t('Transcript')}</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </GlassCard>
        )}

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <Pressable
            style={[
              styles.controlButton,
              styles.muteButton,
              isMuted && styles.muteButtonActive,
            ]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color={isMuted ? COLORS.error : COLORS.primary}
            />
            <Text style={[
              styles.controlButtonText,
              isMuted && styles.controlButtonTextActive,
            ]}>
              {isMuted ? t('Unmute') : t('Mute')}
            </Text>
          </Pressable>
        </View>

        {/* Info Card */}
        <GlassCard style={styles.infoCard} padding="md">
          <Text style={styles.infoTitle}>{t('How it works')}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="mic" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{t('Speak naturally - Aurora listens in real-time')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="chatbubbles" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{t('Aurora responds with empathy and understanding')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{t('Your conversations are private and secure')}</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  coreContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  stateCard: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  stateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  errorCard: {
    width: '100%',
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.error}20`,
    borderColor: COLORS.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    flex: 1,
  },
  transcriptCard: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  transcriptLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  controlsContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.background,
    borderWidth: 2,
    borderColor: COLORS.glass.border,
  },
  muteButton: {
    borderColor: COLORS.primary,
  },
  muteButtonActive: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}15`,
  },
  controlButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  controlButtonTextActive: {
    color: COLORS.error,
  },
  infoCard: {
    width: '100%',
    marginTop: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoList: {
    gap: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
