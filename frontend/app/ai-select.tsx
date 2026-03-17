import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/hooks/useTheme';
import { SPACING, TYPOGRAPHY } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function AiSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Entrance animations
  const titleAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(titleAnim, {
        toValue: 1,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(card1Anim, {
        toValue: 1,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const titleStyle = {
    opacity: titleAnim,
    transform: [
      {
        translateY: titleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };

  const card1Style = {
    opacity: card1Anim,
    transform: [
      {
        translateY: card1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
      {
        scale: card1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  };

  const card2Style = {
    opacity: card2Anim,
    transform: [
      {
        translateY: card2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
      {
        scale: card2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle ambient glow — Claude side */}
      <View style={styles.glowClaudeContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(251, 146, 60, 0.08)', 'transparent']}
          style={styles.glowCircle}
        />
      </View>

      {/* Subtle ambient glow — OpenAI side */}
      <View style={styles.glowOpenAIContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(52, 211, 153, 0.08)', 'transparent']}
          style={styles.glowCircle}
        />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={[
            styles.backButton,
            {
              backgroundColor: colors.glass.background,
              borderColor: colors.glass.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title block */}
        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
            Choose your AI
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Who would you like{'\n'}to chat with?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Compare responses from two different AI models
          </Text>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          {/* Claude card */}
          <Animated.View style={card1Style}>
            <Pressable
              style={({ pressed }) => [
                styles.providerCard,
                {
                  backgroundColor: colors.glass.background,
                  borderColor: colors.glass.border,
                  opacity: pressed ? 0.85 : 1,
                  transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                },
              ]}
              onPress={() => router.push('/text-chat?provider=claude')}
            >
              {/* Card gradient overlay */}
              <LinearGradient
                colors={['rgba(251, 146, 60, 0.12)', 'rgba(239, 68, 68, 0.06)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.cardInner}>
                {/* Icon */}
                <View style={styles.iconWrapper}>
                  <LinearGradient
                    colors={['rgba(251, 146, 60, 0.25)', 'rgba(239, 68, 68, 0.20)']}
                    style={styles.iconGradient}
                  >
                    <Text style={styles.iconEmoji}>✦</Text>
                  </LinearGradient>
                </View>

                {/* Text */}
                <View style={styles.cardText}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Claude</Text>
                    <View style={[styles.activeBadge, { backgroundColor: 'rgba(251, 146, 60, 0.2)', borderColor: 'rgba(251, 146, 60, 0.4)' }]}>
                      <Text style={[styles.activeBadgeText, { color: '#fb923c' }]}>Current</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardProvider, { color: 'rgba(251, 146, 60, 0.9)' }]}>
                    Anthropic · claude-3-haiku
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
                    Empathetic, thoughtful and nuanced. Strong at deep emotional conversations.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="rgba(251, 146, 60, 0.7)"
                />
              </View>
            </Pressable>
          </Animated.View>

          {/* OpenAI card */}
          <Animated.View style={card2Style}>
            <Pressable
              style={({ pressed }) => [
                styles.providerCard,
                {
                  backgroundColor: colors.glass.background,
                  borderColor: colors.glass.border,
                  opacity: pressed ? 0.85 : 1,
                  transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                },
              ]}
              onPress={() => router.push('/text-chat?provider=openai')}
            >
              {/* Card gradient overlay */}
              <LinearGradient
                colors={['rgba(52, 211, 153, 0.12)', 'rgba(16, 185, 129, 0.06)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.cardInner}>
                {/* Icon */}
                <View style={styles.iconWrapper}>
                  <LinearGradient
                    colors={['rgba(52, 211, 153, 0.25)', 'rgba(16, 185, 129, 0.20)']}
                    style={styles.iconGradient}
                  >
                    <Text style={styles.iconEmoji}>◈</Text>
                  </LinearGradient>
                </View>

                {/* Text */}
                <View style={styles.cardText}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>GPT-4o mini</Text>
                    <View style={[styles.newBadge, { backgroundColor: 'rgba(52, 211, 153, 0.2)', borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
                      <Text style={[styles.newBadgeText, { color: '#34d399' }]}>Compare</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardProvider, { color: 'rgba(52, 211, 153, 0.9)' }]}>
                    OpenAI · gpt-4o-mini
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
                    Versatile and fast. Clear, structured and direct in its responses.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="rgba(52, 211, 153, 0.7)"
                />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Footer note */}
        <Animated.View style={[styles.footerNote, titleStyle]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
            Both models use the same Aurora therapeutic system prompt
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  glowClaudeContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    pointerEvents: 'none',
  },
  glowOpenAIContainer: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 400,
    height: 400,
    pointerEvents: 'none',
  },
  glowCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    paddingBottom: SPACING.xxl,
  },
  titleBlock: {
    marginBottom: SPACING.xl,
  },
  eyebrow: {
    ...TYPOGRAPHY.caption,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  title: {
    fontFamily: 'Unbounded-Regular',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: SPACING.md,
  },
  providerCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 22,
    color: '#fff',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  cardTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardProvider: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    ...TYPOGRAPHY.small,
    lineHeight: 18,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
    justifyContent: 'center',
  },
  footerNoteText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    flex: 1,
  },
});
