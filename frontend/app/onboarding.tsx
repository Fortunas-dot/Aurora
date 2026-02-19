import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  ViewToken,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../src/components/common';
import { PaginationDots } from '../src/components/onboarding/PaginationDots';
import { OnboardingOverlay } from '../src/components/onboarding/OnboardingOverlay';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useOnboardingStore } from '../src/store/onboardingStore';

// Import university logos
const harvardLogo = require('../assets/Harvard_University_logo.svg.png');
const stanfordLogo = require('../assets/stanford-logo-660x330.png');
const mitLogo = require('../assets/mit-university-logo-vector-free-11574209211h7atqdgxtm.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated star component for background
const AnimatedStar = ({ index }: { index: number }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;
  const speed = 20 + Math.random() * 30;
  const direction = Math.random() * Math.PI * 2;
  const distance = 30 + Math.random() * 50;

  useEffect(() => {
    const duration = 3000 + Math.random() * 4000;

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

// Floating sparkle component
const FloatingSparkle = React.memo(({ delay, startX, startY, size }: { delay: number; startX: number; startY: number; size: number }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <Animated.View
      style={[
        styles.floatingSparkle,
        {
          left: startX,
          top: startY,
          opacity: opacityAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name="sparkles" size={size} color="rgba(96, 165, 250, 0.4)" />
    </Animated.View>
  );
});

// Animated icon container
const AnimatedIconContainer = ({ icon, delay = 0, useAurora = false, compact = false }: { icon: keyof typeof Ionicons.glyphMap; delay?: number; useAurora?: boolean; compact?: boolean }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 20000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (useAurora) {
    return (
      <Animated.View
        style={[
          styles.auroraContainer,
          compact && styles.auroraContainerCompact,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <AuroraCore state="idle" audioLevel={0} size={compact ? 100 : 120} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          backgroundColor: colors.glass.backgroundLight,
          transform: [{ scale: scaleAnim }, { rotate }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primaryGlow, 'transparent']}
        style={styles.iconGradient}
      />
      <Ionicons name={icon} size={64} color={colors.primary} />
    </Animated.View>
  );
};

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  visual?: React.ReactNode;
  badges?: Array<{ name: string; logo: any }>;
  features?: Array<{ icon: keyof typeof Ionicons.glyphMap; title: string }>;
  route?: string | null; // Route to navigate to, null means stay on onboarding screen
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'sparkles',
    title: 'Welcome to Aurora',
    description: 'Your personal mental health companion, designed to support you on your journey to better wellbeing.',
    route: null, // Stay on onboarding screen
  },
  {
    id: '2',
    icon: 'brain',
    title: 'Meet Your AI Companion',
    description: 'Aurora is trained on comprehensive psychology and behavior science knowledge from leading institutions. Get evidence-based support whenever you need it.',
    badges: [
      { name: 'Harvard', logo: harvardLogo },
      { name: 'Stanford', logo: stanfordLogo },
      { name: 'MIT', logo: mitLogo },
    ],
    route: null, // Stay on onboarding screen
  },
  {
    id: '3',
    icon: 'medical',
    title: 'Expert Therapists Available',
    description: 'Real licensed therapists are online in the app. They can answer questions on posts and provide professional guidance when you need it most.',
    route: '/(tabs)', // Navigate to Feed tab after this slide
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { startOnboarding, finishOnboarding, nextStep, isActive } = useOnboardingStore();

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      setCurrentIndex(index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    // Start onboarding when component mounts
    startOnboarding();
  }, [startOnboarding]);

  const handleNext = () => {
    const currentSlide = onboardingSlides[currentIndex];
    
    // If slide has a route, navigate to it and update step
    if (currentSlide.route) {
      // Update step first, then navigate
      nextStep();
      // Navigate to the route (this will show overlay on the target page)
      router.replace(currentSlide.route as any);
      return;
    }
    
    // Otherwise, go to next slide (for slides without routes)
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    finishOnboarding();
    router.push('/subscription');
  };
  
  const handleSkip = () => {
    finishOnboarding();
    router.back();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const isLastSlide = item.id === onboardingSlides[onboardingSlides.length - 1].id;

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {/* Star field background for first and second slide */}
        {(index === 0 || index === 1) && (
          <View style={styles.starField}>
            {Array.from({ length: 50 }).map((_, i) => (
              <AnimatedStar key={i} index={i} />
            ))}
          </View>
        )}

        {/* Floating sparkles background for third slide only */}
        {index === 2 && (
          <>
            <FloatingSparkle delay={0} startX={30} startY={100} size={20} />
            <FloatingSparkle delay={300} startX={SCREEN_WIDTH - 50} startY={150} size={16} />
            <FloatingSparkle delay={500} startX={SCREEN_WIDTH / 2} startY={200} size={18} />
          </>
        )}

        <View style={styles.slideContent}>
          {/* Icon with animation - use Aurora for first, second, and Aurora page slide */}
          <AnimatedIconContainer 
            icon={item.icon} 
            delay={index * 100} 
            useAurora={index === 0 || index === 1 || (item.id === '5' && item.title === 'Aurora')}
            compact={index === 1}
          />

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>

          {/* Description in GlassCard */}
          <GlassCard padding="md" style={styles.descriptionCard} gradient>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={0}>
              {item.description}
            </Text>
          </GlassCard>

          {/* University badges for slide 2 */}
          {item.badges && (
            <View style={styles.badgesContainer}>
              {item.badges.map((badge, badgeIndex) => (
                <View
                  key={badge.name}
                  style={styles.badgeCard}
                >
                  <View style={styles.badgeImageContainer}>
                    <Image
                      source={badge.logo}
                      style={styles.badgeLogo}
                      resizeMode="contain"
                      onError={(error) => {
                        console.error(`Error loading ${badge.name} logo:`, error);
                      }}
                      onLoad={() => {
                        console.log(`${badge.name} logo loaded successfully`);
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}


        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient as readonly [string, string, string]}
      style={styles.container}
    >
      {/* Header with Skip button */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Slides FlatList */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={({ item, index }) => renderSlide({ item, index })}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        <PaginationDots total={onboardingSlides.length} currentIndex={currentIndex} />
      </View>

      {/* Next/Get Started Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <GlassButton
          title={currentIndex === onboardingSlides.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          variant="primary"
          size="lg"
          style={styles.nextButton}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingSparkle: {
    position: 'absolute',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.bodyMedium,
    fontSize: 16,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: SCREEN_WIDTH * 0.9,
    zIndex: 1,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  iconGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  descriptionCard: {
    marginBottom: SPACING.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  description: {
    ...TYPOGRAPHY.bodyLarge,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  badgeCard: {
    marginHorizontal: SPACING.xs / 2,
    width: 100,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeImageContainer: {
    width: 90,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLogo: {
    width: '100%',
    height: '100%',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  featureCard: {
    width: (SCREEN_WIDTH * 0.9 - SPACING.xl * 2 - SPACING.md) / 2,
    minWidth: 140,
    maxWidth: 160,
    minHeight: 120,
  },
  featureContent: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  getStartedButton: {
    width: '100%',
  },
  paginationContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    zIndex: 10,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    zIndex: 10,
  },
  nextButton: {
    width: '100%',
  },
  starField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  auroraContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  auroraContainerCompact: {
    marginBottom: SPACING.md,
    width: 100,
    height: 100,
  },
});
