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

// Animated Badge Component for University Logos
const AnimatedBadge = React.memo(({ badge, index, colors }: { badge: { name: string; logo: any }; index: number; colors: any }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    const entranceDelay = index * 200;
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay: entranceDelay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: entranceDelay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay: entranceDelay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous gentle pulse animation (starts after entrance)
    const startPulse = () => {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 2000 + index * 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 2000 + index * 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return pulseAnimation;
    };

    // Subtle rotation animation
    const rotationAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 5000 + index * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 5000 + index * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Start animations after entrance
    const timeoutId = setTimeout(() => {
      const pulseAnim = startPulse();
      rotationAnimation.start();
      
      return () => {
        pulseAnim.stop();
        rotationAnimation.stop();
      };
    }, entranceDelay + 600);

    return () => {
      clearTimeout(timeoutId);
      rotationAnimation.stop();
    };
  }, [index]);

  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  // Combine scale and pulse using interpolation
  const combinedScale = Animated.multiply(scale, pulse);

  return (
    <Animated.View
      style={[
        styles.badgeCard,
        {
          opacity,
          transform: [
            { scale: combinedScale },
            { translateY },
            { rotate: rotationInterpolate },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.95)',
          'rgba(255, 255, 255, 0.9)',
        ]}
        style={styles.badgeGradient}
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
      </LinearGradient>
    </Animated.View>
  );
});

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
        <AuroraCore state="idle" audioLevel={0} size={compact ? 80 : 120} />
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
  const { startOnboarding, finishOnboarding, nextStep, isActive, currentStep: onboardingStep } = useOnboardingStore();

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      setCurrentIndex(index);
      // Update onboarding step when slide changes
      if (index !== currentIndex) {
        // Step should match the slide index + 1 (since step 0 is initial state)
        // Slide 0 -> step 1, Slide 1 -> step 2, Slide 2 -> step 3
        const targetStep = index + 1;
        // Only update if we're moving forward
        if (targetStep > currentIndex + 1) {
          // This will be handled by handleNext, so we don't need to call nextStep here
        }
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onScrollToIndexFailed = useRef((info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    // If scrollToIndex fails, use scrollToOffset as fallback
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
    });
  }).current;

  useEffect(() => {
    // Start onboarding when component mounts
    startOnboarding();
  }, [startOnboarding]);

  const handleNext = () => {
    const currentSlide = onboardingSlides[currentIndex];
    
    // If slide has a route, navigate to it and update step
    if (currentSlide.route) {
      // Ensure we're at step 3 for the feed overlay
      // currentIndex is 2 (last slide), so we need step 3
      const targetStep = 3;
      
      // Directly set the state to step 3 instead of calling nextStep multiple times
      // This ensures the state is set synchronously before navigation
      useOnboardingStore.setState({ currentStep: targetStep, isActive: true });
      
      // Navigate after a short delay to ensure state is updated
      setTimeout(() => {
        router.replace(currentSlide.route as any);
      }, 100);
      return;
    }
    
    // Otherwise, go to next slide (for slides without routes)
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      // Use scrollToIndex with error handling
      try {
        flatListRef.current?.scrollToIndex({ 
          index: nextIndex, 
          animated: true,
          viewPosition: 0.5
        });
      } catch (error) {
        // Fallback to scrollToOffset if scrollToIndex fails
        flatListRef.current?.scrollToOffset({ 
          offset: nextIndex * SCREEN_WIDTH, 
          animated: true 
        });
      }
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

  const renderSlide = React.useCallback(({ item, index }: { item: OnboardingSlide; index: number }) => {
    const isLastSlide = item.id === onboardingSlides[onboardingSlides.length - 1].id;

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {/* Star field background for first and second slide - reduced for performance */}
        {(index === 0 || index === 1) && (
          <View style={styles.starField} pointerEvents="none">
            {Array.from({ length: 20 }).map((_, i) => (
              <AnimatedStar key={i} index={i} />
            ))}
          </View>
        )}

        {/* Floating sparkles background for third slide only */}
        {index === 2 && (
          <View pointerEvents="none">
            <FloatingSparkle delay={0} startX={30} startY={100} size={20} />
            <FloatingSparkle delay={300} startX={SCREEN_WIDTH - 50} startY={150} size={16} />
            <FloatingSparkle delay={500} startX={SCREEN_WIDTH / 2} startY={200} size={18} />
          </View>
        )}

        {index === 1 && item.badges ? (
          // Special redesigned layout for "Meet Your AI Companion" slide
          <View style={styles.companionSlideContent}>
            {/* Floating Aurora Sphere - Top Section */}
            <View style={styles.companionAuroraSection}>
              <AnimatedIconContainer 
                icon={item.icon} 
                delay={index * 100} 
                useAurora={true}
                compact={false}
              />
            </View>

            {/* Main Content Section */}
            <View style={styles.companionMainContent}>
              {/* Title with accent */}
              <View style={styles.companionTitleContainer}>
                <Text style={[styles.companionTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.companionTitleAccent, { backgroundColor: colors.primary }]} />
              </View>

              {/* Description with better styling */}
              <GlassCard padding="md" style={styles.companionDescriptionCard} variant="primary" gradient>
                <Text style={[styles.companionDescription, { color: colors.text }]}>
                  {item.description}
                </Text>
              </GlassCard>

              {/* Premium University Logos Section */}
              <View style={styles.companionBadgesSection}>
                <Text style={[styles.companionBadgesLabel, { color: colors.textMuted }]}>
                  Powered by leading institutions
                </Text>
                <View style={styles.companionBadgesContainer}>
                  {item.badges.map((badge, badgeIndex) => (
                    <AnimatedBadge
                      key={badge.name}
                      badge={badge}
                      index={badgeIndex}
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        ) : index === 2 ? (
          // Special redesigned layout for "Expert Therapists Available" slide
          <View style={styles.therapistSlideContent}>
            {/* Icon Section */}
            <View style={styles.therapistIconSection}>
              <AnimatedIconContainer 
                icon={item.icon} 
                delay={index * 100} 
                useAurora={false}
                compact={true}
              />
            </View>

            {/* Main Content */}
            <View style={styles.therapistMainContent}>
              {/* Title with accent */}
              <View style={styles.therapistTitleContainer}>
                <Text style={[styles.therapistTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.therapistTitleAccent, { backgroundColor: colors.primary }]} />
              </View>

              {/* Description */}
              <GlassCard padding="md" style={styles.therapistDescriptionCard} variant="primary" gradient>
                <Text style={[styles.therapistDescription, { color: colors.text }]}>
                  {item.description}
                </Text>
              </GlassCard>

              {/* Feature Highlights */}
              <View style={styles.therapistFeaturesContainer}>
                <View style={styles.therapistFeatureRow}>
                  <GlassCard padding="sm" style={styles.therapistFeatureCard} variant="light" gradient={false}>
                    <View style={styles.therapistFeatureContent}>
                      <View style={[styles.therapistFeatureIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      </View>
                      <Text style={styles.therapistFeatureText} allowFontScaling={true} numberOfLines={2}>Licensed{'\n'}Professionals</Text>
                    </View>
                  </GlassCard>
                  <GlassCard padding="sm" style={styles.therapistFeatureCard} variant="light" gradient={false}>
                    <View style={styles.therapistFeatureContent}>
                      <View style={[styles.therapistFeatureIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                        <Ionicons name="time" size={22} color={colors.primary} />
                      </View>
                      <Text style={styles.therapistFeatureText} numberOfLines={2} allowFontScaling={true}>Available to answer questions under posts</Text>
                    </View>
                  </GlassCard>
                </View>
              </View>
            </View>
          </View>
        ) : (
          // Standard layout for other slides
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
            <GlassCard padding="lg" style={styles.descriptionCard} variant="dark" gradient>
              <Text style={[styles.description, { color: colors.text }]} numberOfLines={0}>
                {item.description}
              </Text>
            </GlassCard>

            {/* University badges for slide 2 */}
            {item.badges && (
              <View style={styles.badgesContainer}>
                {item.badges.map((badge, badgeIndex) => (
                  <AnimatedBadge
                    key={badge.name}
                    badge={badge}
                    index={badgeIndex}
                    colors={colors}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }, [colors.text]);

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
        renderItem={({ item, index }) => {
          // Use React.memo pattern for better performance
          return renderSlide({ item, index });
        }}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={onScrollToIndexFailed}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        disableIntervalMomentum={true}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        updateCellsBatchingPeriod={50}
        legacyImplementation={false}
        disableVirtualization={false}
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
  slideContentCompact: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-start',
    paddingTop: SPACING.sm,
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
  titleCompact: {
    fontSize: 26,
    marginBottom: SPACING.sm,
  },
  descriptionCard: {
    marginBottom: SPACING.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  descriptionCardCompact: {
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.bodyLarge,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    flexWrap: 'wrap',
    fontWeight: '500',
  },
  descriptionCompact: {
    fontSize: 15,
    lineHeight: 22,
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
  badgesContainerCompact: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    gap: SPACING.xs / 2,
  },
  badgeCard: {
    marginHorizontal: SPACING.xs / 2,
    width: 105,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    overflow: 'hidden',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },
  badgeImageContainer: {
    width: 90,
    height: 55,
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
  // New companion slide styles
  companionSlideContent: {
    flex: 1,
    width: SCREEN_WIDTH,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-start',
    paddingTop: SPACING.md,
  },
  companionAuroraSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    height: 140,
  },
  companionMainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  companionTitleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: '100%',
  },
  companionTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  companionTitleAccent: {
    width: 60,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  companionDescriptionCard: {
    width: '100%',
    marginBottom: SPACING.lg,
    alignSelf: 'stretch',
  },
  companionDescription: {
    ...TYPOGRAPHY.bodyLarge,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  companionBadgesSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  companionBadgesLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    fontWeight: '600',
  },
  companionBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  // Therapist slide styles
  therapistSlideContent: {
    flex: 1,
    width: SCREEN_WIDTH,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-start',
    paddingTop: SPACING.xxl,
  },
  therapistIconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    height: 90,
  },
  therapistMainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  therapistTitleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    width: '100%',
  },
  therapistTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: SPACING.xs / 2,
  },
  therapistTitleAccent: {
    width: 50,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
  therapistDescriptionCard: {
    width: '100%',
    marginBottom: SPACING.md,
    alignSelf: 'stretch',
  },
  therapistDescription: {
    ...TYPOGRAPHY.bodyLarge,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  therapistFeaturesContainer: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: 0,
  },
  therapistFeatureRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  therapistFeatureCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: BORDER_RADIUS.lg,
  },
  therapistFeatureContent: {
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    flex: 1,
    zIndex: 100,
  },
  therapistFeatureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  therapistFeatureText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 18,
    color: '#FFFFFF',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
});
