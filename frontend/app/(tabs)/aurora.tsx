import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Platform, Animated, Dimensions, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../../src/components/common';
// import { AuroraCore } from '../../src/components/voice/AuroraCore'; // Bewaard voor later gebruik
import { SPACING, TYPOGRAPHY, COLORS } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { OnboardingOverlay } from '../../src/components/onboarding/OnboardingOverlay';
import { journalService, JournalInsights } from '../../src/services/journal.service';

const { width, height } = Dimensions.get('window');

// Daily quotes - selected based on day of the year
const DAILY_QUOTES = [
  "You are stronger than you think. Every day is a new chance to grow.",
  "It's okay to not be okay. Your feelings are valid and important.",
  "Small steps lead to big changes. Be proud of your progress.",
  "You are not alone in your journey. There are people who care about you.",
  "Self-care is not selfish, it's necessary. Take time for yourself.",
  "Every challenge you overcome makes you stronger. Keep going.",
  "You deserve happiness and peace. Don't let anyone tell you otherwise.",
  "It's never too late to make a fresh start. Today is a perfect moment.",
  "You are valuable, exactly as you are. You don't need to be perfect.",
  "Remember: you've already survived so many difficult moments. You can do this too.",
  "Breathe in, breathe out. You are exactly where you need to be right now.",
  "Your journey is unique. Don't compare yourself to others - you're on your own path.",
  "It's okay to ask for help. Being strong doesn't mean doing everything alone.",
  "Every day you get up and keep going is a victory. Celebrate those moments.",
  "Your thoughts are not always true. You are more than your fears.",
  "Self-love is a journey, not a destination. Be patient with yourself.",
  "You deserve rest, peace, and happiness. Don't let anything take that away.",
  "Every step forward, no matter how small, is progress. Keep moving.",
  "You are enough, exactly as you are. You don't need to prove anything.",
  "Remember: these difficult moments are temporary. Better days are coming.",
];

const getDailyQuote = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Animated star component
const AnimatedStar = ({ index }: { index: number }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;
  const speed = 20 + Math.random() * 30; // Different speeds for each star
  const direction = Math.random() * Math.PI * 2; // Random direction
  const distance = 30 + Math.random() * 50; // How far the star moves

  useEffect(() => {
    const duration = 3000 + Math.random() * 4000; // 3-7 seconds

    // Create a looping animation
    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: Math.cos(direction) * distance,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: Math.sin(direction) * distance,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.1,
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3 + Math.random() * 0.4,
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 0.5,
              duration: duration * 0.6,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.6,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${initialX}%`,
          top: `${initialY}%`,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    />
  );
};

export default function AuroraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const { isActive: isOnboardingActive, currentStep, nextStep } = useOnboardingStore();
  const [insights, setInsights] = useState<JournalInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Aurora background animation
  const auroraAnim1 = useRef(new Animated.Value(0)).current;
  const auroraAnim2 = useRef(new Animated.Value(0)).current;
  const auroraAnim3 = useRef(new Animated.Value(0)).current;

  const loadInsights = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await journalService.getInsights(30);
      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Animate aurora background - optimized for performance
  useEffect(() => {
    const createAuroraAnimation = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            delay: delay,
            useNativeDriver: false, // Cannot use native driver with percentage-based transforms
            easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Smoother easing
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: false,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Smoother easing
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      createAuroraAnimation(auroraAnim1, 15000, 0), // Slower for better performance
      createAuroraAnimation(auroraAnim2, 18000, 2000),
      createAuroraAnimation(auroraAnim3, 20000, 4000),
    ]);
    
    animations.start();
    
    return () => {
      animations.stop();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInsights();
  }, [loadInsights]);

  const dailyQuote = getDailyQuote();
  const greeting = getGreeting();
  const userName = user?.displayName || user?.username || 'Friend';

  // Interpolate aurora positions - memoized for performance
  const aurora1X = useMemo(() => auroraAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['-20%', '20%'],
  }), [auroraAnim1]);
  const aurora1Y = useMemo(() => auroraAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10%', '10%'],
  }), [auroraAnim1]);
  const aurora2X = useMemo(() => auroraAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '-10%'],
  }), [auroraAnim2]);
  const aurora2Y = useMemo(() => auroraAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15%', '15%'],
  }), [auroraAnim2]);
  const aurora3X = useMemo(() => auroraAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15%', '15%'],
  }), [auroraAnim3]);
  const aurora3Y = useMemo(() => auroraAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '-10%'],
  }), [auroraAnim3]);

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Aurora layers - optimized for performance */}
      <Animated.View
        style={[
          styles.auroraLayer,
          {
            transform: [{ translateX: aurora1X }, { translateY: aurora1Y }],
          },
        ]}
        renderToHardwareTextureAndroid={true}
        collapsable={false}
      >
        <LinearGradient
          colors={['rgba(96, 165, 250, 0.12)', 'rgba(167, 139, 250, 0.10)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.auroraLayer,
          {
            transform: [{ translateX: aurora2X }, { translateY: aurora2Y }],
          },
        ]}
        renderToHardwareTextureAndroid={true}
        collapsable={false}
      >
        <LinearGradient
          colors={['transparent', 'rgba(94, 234, 212, 0.08)', 'rgba(139, 92, 246, 0.12)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.auroraLayer,
          {
            transform: [{ translateX: aurora3X }, { translateY: aurora3Y }],
          },
        ]}
        renderToHardwareTextureAndroid={true}
        collapsable={false}
      >
        <LinearGradient
          colors={['rgba(167, 139, 250, 0.08)', 'transparent', 'rgba(96, 165, 250, 0.10)', 'rgba(94, 234, 212, 0.06)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      {/* Star field effect - Reduced for better performance */}
      <View style={styles.starField} pointerEvents="none" collapsable={false}>
        {Array.from({ length: 20 }).map((_, i) => (
          <AnimatedStar key={`star-${i}`} index={i} />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (Platform.OS === 'ios' ? 120 : 100) + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        scrollEventThrottle={32}
        decelerationRate="normal"
        nestedScrollEnabled={true}
        overScrollMode="never"
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, { paddingTop: insets.top + SPACING.xl + SPACING.md }]}>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}, {userName} 👋</Text>
          {dailyQuote && (
            <GlassCard style={styles.quoteCard} padding="md" gradient>
              <View style={styles.quoteContainer}>
                <Ionicons name="quote" size={24} color={colors.primary} style={styles.quoteIcon} />
                <Text style={[styles.quoteText, { color: colors.text }]}>{dailyQuote}</Text>
              </View>
            </GlassCard>
          )}
        </View>

        {/* Quick Stats */}
        {isAuthenticated && insights && insights.totalEntries > 0 && (
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <GlassCard style={styles.statCard} padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="flame" size={24} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{insights.streakDays}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>day streak</Text>
                </View>
              </GlassCard>
              
              <GlassCard style={styles.statCard} padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="journal" size={24} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{insights.totalEntries}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>entries</Text>
                </View>
              </GlassCard>
              
              <GlassCard style={styles.statCard} padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="happy" size={24} color={colors.accent} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {insights.averageMood ? insights.averageMood.toFixed(1) : '-'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>avg. mood</Text>
                </View>
              </GlassCard>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {isAuthenticated && (
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <Pressable
                style={styles.quickActionButton}
                onPress={() => router.push('/journal/create')}
              >
                <GlassCard style={styles.quickActionCard} padding="md">
                  <View style={styles.quickActionContent}>
                  <Ionicons name="add-circle" size={28} color={colors.primary} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Quick Entry</Text>
                  </View>
                </GlassCard>
              </Pressable>
              
              <Pressable
                style={styles.quickActionButton}
                onPress={() => router.push('/journal/insights')}
              >
                <GlassCard style={styles.quickActionCard} padding="md">
                  <View style={styles.quickActionContent}>
                  <Ionicons name="analytics" size={28} color={colors.accent} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Insights</Text>
                  </View>
                </GlassCard>
              </Pressable>
              
              <Pressable
                style={styles.quickActionButton}
                onPress={() => router.push('/ideas')}
              >
                <GlassCard style={styles.quickActionCard} padding="md">
                  <View style={styles.quickActionContent}>
                  <Ionicons name="bulb" size={28} color={colors.warning} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Submit Idea</Text>
                  </View>
                </GlassCard>
              </Pressable>
            </View>
          </View>
        )}

        {/* Options - How can I help you? */}
        <View style={styles.optionsContainer}>
          <Text style={[styles.optionsTitle, { color: colors.text }]}>How can I help you?</Text>
          
          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/text-chat')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(94, 234, 212, 0.3)', 'rgba(52, 211, 153, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="chatbubble-ellipses" size={28} color={colors.accent} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Chat with Aurora</Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  Chat with Aurora via text at your own pace
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/journal')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(251, 191, 36, 0.3)', 'rgba(245, 158, 11, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="journal" size={28} color={colors.warning} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Journal</Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  Write your thoughts with AI guidance
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/journal/insights')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="analytics" size={28} color={colors.secondary} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Insights</Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  View patterns and insights from your journal
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            onPress={() => router.push('/health-info')}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.3)', 'rgba(248, 113, 113, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="heart" size={28} color={colors.error} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Health Check</Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  Manage your health information
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="mic" size={28} color={colors.primary} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Voice Sessions</Text>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                    Talk with Aurora via voice in a safe environment
                  </Text>
                  <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.comingSoonText, { color: colors.background }]}>Coming Soon</Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="musical-notes" size={28} color={colors.secondary} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Discover the power of noises & sounds</Text>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                    Mix ambient sounds for focus, sleep, and relaxation
                  </Text>
                  <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.comingSoonText, { color: colors.background }]}>Coming Soon</Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>

          <GlassCard
            style={styles.optionCard}
            padding="lg"
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <LinearGradient
                  colors={['rgba(236, 72, 153, 0.3)', 'rgba(244, 114, 182, 0.3)']}
                  style={styles.optionIconGradient}
                >
                  <Ionicons name="calendar" size={28} color={colors.error} />
                </LinearGradient>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Events</Text>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                    Join community events, workshops, and support groups
                  </Text>
                  <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.comingSoonText, { color: colors.background }]}>Coming Soon</Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      {/* Onboarding Overlay for Aurora */}
      {isOnboardingActive && currentStep === 4 && (
        <OnboardingOverlay
          visible={true}
          title="Aurora"
          description="Chat with your AI companion through voice or text. Get personalized support, insights, and guidance tailored to your mental health needs."
          onNext={() => {
            nextStep();
            // Navigate to Connect tab after a short delay to ensure state is updated
            setTimeout(() => {
              router.push('/(tabs)/groups');
            }, 100);
          }}
          showSkip={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  auroraLayer: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    top: -height * 0.25,
    left: -width * 0.25,
    borderRadius: width,
    opacity: 0.5, // Slightly reduced for better performance
    overflow: 'hidden',
    pointerEvents: 'none',
    ...(Platform.OS === 'android' && { renderToHardwareTextureAndroid: true }),
  },
  starField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    ...(Platform.OS === 'ios' && { shouldRasterizeIOS: true }),
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'android' && { nestedScrollEnabled: true }),
  },
  scrollContent: {
    paddingBottom: SPACING.xxl, // Base padding, wordt dynamisch aangepast met safe area
  },
  // Aurora Visualization - bewaard voor later gebruik
  // auroraContainer: {
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingVertical: SPACING.lg,
  // },
  optionsContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  optionsTitle: {
    fontFamily: 'Unbounded-Regular',
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  optionCard: {
    marginBottom: SPACING.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: SPACING.md,
    minWidth: 0,
  },
  optionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: 4,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  optionDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
    flexShrink: 1,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  comingSoonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 10,
  },
  welcomeSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    // paddingTop is set inline to include safe area insets
  },
  greeting: {
    fontFamily: 'Unbounded-Regular',
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  quoteCard: {
    marginTop: SPACING.sm,
    width: '100%',
    maxWidth: '100%',
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  quoteIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
    flexShrink: 0,
  },
  quoteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 24,
    flexShrink: 1,
  },
  statsSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: 'Unbounded-Regular',
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '30%',
  },
  quickActionCard: {
    minHeight: 100,
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  quickActionText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.text,
    marginTop: SPACING.xs,
    textAlign: 'center',
    width: '100%',
  },
});

