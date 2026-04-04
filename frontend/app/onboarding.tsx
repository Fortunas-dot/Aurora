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
import { Asset } from 'expo-asset';
import { GlassCard, GlassButton } from '../src/components/common';
import { PaginationDots } from '../src/components/onboarding/PaginationDots';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';
import { useOnboardingStore } from '../src/store/onboardingStore';

// Import university logos
const harvardLogo = require('../assets/Harvard_University_logo.svg.png');
const stanfordLogo = require('../assets/stanford-logo-660x330.png');
const mitLogo = require('../assets/mit-university-logo-vector-free-11574209211h7atqdgxtm.png');

// Hero images for onboarding slides
const onboardingHero = require('../assets/onboarding-hero.jpg');
const onboardingUniversity = require('../assets/onboarding-university.jpg');
const onboardingTherapist = require('../assets/onboarding-therapist.jpg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated Badge Component for University Logos
const AnimatedBadge = React.memo(({ badge, index, colors, logosReady }: { badge: { name: string; logo: any }; index: number; colors: any; logosReady: boolean }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simplified entrance animation - faster
    const entranceDelay = index * 100;
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: entranceDelay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: entranceDelay,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: entranceDelay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Simplified pulse animation - less frequent
    const startPulse = () => {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.05,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return pulseAnimation;
    };

    // Simplified rotation - slower and less frequent
    const rotationAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 8000,
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
    }, entranceDelay + 300);

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
          {logosReady ? (
            <Image
              source={badge.logo}
              style={styles.badgeLogo}
              resizeMode="contain"
              fadeDuration={0}
              onError={(error) => {
                console.error(`Error loading ${badge.name} logo:`, error);
              }}
            />
          ) : (
            <Text style={styles.badgeFallbackText}>{badge.name}</Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// Animated star component for background - optimized for performance
const AnimatedStar = React.memo(({ index }: { index: number }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.3)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;
  const direction = Math.random() * Math.PI * 2;
  const distance = 20 + Math.random() * 30; // Reduced distance

  useEffect(() => {
    const duration = 4000 + Math.random() * 3000; // Longer, smoother animations

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
          ],
        },
      ]}
    />
  );
});

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Simplified rotation - only if not using Aurora
    if (!useAurora) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [delay, useAurora]);

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
    title: 'Meet your AI\nMental Health\ncompanion',
    description: 'Someone to talk to whenever you need it.\nHelping you reflect and grow',
    route: null,
  },
  {
    id: '2',
    icon: 'brain',
    title: 'Built with the best\nExperts in Mental\nHealth',
    description: 'Trained on comprehensive psychology and behavioral science. Developed with the best in their fields.',
    route: null,
  },
  {
    id: '3',
    icon: 'medical',
    title: 'Real Therapists\nReady to Help',
    description: 'Licensed professionals are available in the app. They respond under your posts and question posts to provide real, professional guidance when you need it most.',
    route: '/(tabs)',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logosReady, setLogosReady] = useState(false);
  const { startOnboarding, finishOnboarding, nextStep, setStep, isActive, currentStep: onboardingStep } = useOnboardingStore();

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

  useEffect(() => {
    // Preload logo assets so badges don't appear as blank white squares.
    let isMounted = true;
    Asset.loadAsync([harvardLogo, stanfordLogo, mitLogo])
      .then(() => {
        if (isMounted) {
          setLogosReady(true);
        }
      })
      .catch((error) => {
        console.warn('Failed to preload onboarding logos:', error);
        if (isMounted) {
          // Still render badges with fallback text if preload fails.
          setLogosReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNext = () => {
    const currentSlide = onboardingSlides[currentIndex];
    
    // If slide has a route, navigate to it and update step
    if (currentSlide.route) {
      // Ensure we're at step 3 for the feed overlay
      // currentIndex is 2 (last slide), so we need step 3
      const targetStep = 3;
      
      // Set the step using the store method - this will persist automatically
      setStep(targetStep);
      
      // Double-check the state was set correctly
      const stateAfterSet = useOnboardingStore.getState();
      console.log('🔵 Onboarding - State after setStep:', {
        currentStep: stateAfterSet.currentStep,
        isActive: stateAfterSet.isActive,
        targetStep,
      });
      
      // Use a small delay to ensure state is persisted before navigation
      setTimeout(() => {
        // Navigate to the feed tab
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

  const renderSlide = React.useCallback(({ item, index }: { item: OnboardingSlide; index: number }) => {
    // Early return optimization - don't render if not visible
    if (Math.abs(index - currentIndex) > 1) {
      return <View style={[styles.slide, { width: SCREEN_WIDTH }]} />;
    }
    const isLastSlide = item.id === onboardingSlides[onboardingSlides.length - 1].id;

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {index === 1 ? (
          // University/experts slide - hero image style
          <View style={styles.welcomeSlide}>
            <View style={styles.welcomeImageContainer}>
              <Image
                source={onboardingUniversity}
                style={styles.welcomeHeroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)']}
                style={styles.credentialOverlayGradient}
              />
              {/* Credential tags overlaid on the image */}
              <View style={styles.credentialTagsContainer}>
                <View style={styles.credentialTag}>
                  <Ionicons name="school-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.credentialTagText}>Harvard</Text>
                </View>
                <View style={styles.credentialTag}>
                  <Ionicons name="school-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.credentialTagText}>Oxford</Text>
                </View>
                <View style={styles.credentialTag}>
                  <Ionicons name="school-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.credentialTagText}>Stanford</Text>
                </View>
              </View>
              <LinearGradient
                colors={['transparent', '#FFF5F1']}
                style={styles.welcomeImageFade}
              />
            </View>

            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                <Text style={styles.welcomeTitleDark}>Built with </Text>
                <Text style={styles.welcomeTitleAccent1}>the best{'\n'}</Text>
                <Text style={styles.welcomeTitleDark}>Experts in </Text>
                <Text style={styles.welcomeTitleAccent2}>Mental{'\n'}</Text>
                <Text style={styles.welcomeTitleAccent2}>Health</Text>
              </Text>

              <Text style={styles.welcomeSubtitle}>
                {item.description}
              </Text>
            </View>
          </View>
        ) : index === 2 ? (
          // Therapist slide - hero image style
          <View style={styles.welcomeSlide}>
            <View style={styles.welcomeImageContainer}>
              <Image
                source={onboardingTherapist}
                style={styles.welcomeHeroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)']}
                style={styles.credentialOverlayGradient}
              />
              {/* Therapist feature tags overlaid on the image */}
              <View style={styles.credentialTagsContainer}>
                <View style={styles.credentialTag}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.credentialTagText}>Licensed</Text>
                </View>
                <View style={styles.credentialTag}>
                  <Ionicons name="chatbubbles-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.credentialTagText}>Respond on Posts</Text>
                </View>
                <View style={styles.credentialTag}>
                  <Ionicons name="help-circle-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.credentialTagText}>Answer Questions</Text>
                </View>
              </View>
              <LinearGradient
                colors={['transparent', '#FFF5F1']}
                style={styles.welcomeImageFade}
              />
            </View>

            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                <Text style={styles.welcomeTitleDark}>Real </Text>
                <Text style={styles.welcomeTitleAccent1}>Therapists{'\n'}</Text>
                <Text style={styles.welcomeTitleDark}>Ready to </Text>
                <Text style={styles.welcomeTitleAccent2}>Help</Text>
              </Text>

              <Text style={styles.welcomeSubtitle}>
                {item.description}
              </Text>
            </View>
          </View>

        ) : index === 0 ? (
          // Welcome slide - matching screenshot style
          <View style={styles.welcomeSlide}>
            {/* Hero image - top portion */}
            <View style={styles.welcomeImageContainer}>
              <Image
                source={onboardingHero}
                style={styles.welcomeHeroImage}
                resizeMode="cover"
              />
              {/* Gradient fade at bottom of image */}
              <LinearGradient
                colors={['transparent', '#FFF5F1']}
                style={styles.welcomeImageFade}
              />
            </View>

            {/* Text content */}
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                <Text style={styles.welcomeTitleDark}>Meet </Text>
                <Text style={styles.welcomeTitleAccent1}>your </Text>
                <Text style={styles.welcomeTitleDark}>AI{'\n'}</Text>
                <Text style={styles.welcomeTitleDark}>Mental </Text>
                <Text style={styles.welcomeTitleAccent2}>Health{'\n'}</Text>
                <Text style={styles.welcomeTitleDark}>companion</Text>
              </Text>

              <Text style={styles.welcomeSubtitle}>
                {item.description}
              </Text>
            </View>
          </View>
        ) : (
          // Standard layout for other slides
          <View style={styles.slideContent}>
            <AnimatedIconContainer 
              icon={item.icon} 
              delay={index * 100} 
              useAurora={index === 1 || (item.id === '5' && item.title === 'Aurora')}
              compact={index === 1}
            />

            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>

            <GlassCard padding="lg" style={styles.descriptionCard} variant="dark" gradient>
              <Text style={[styles.description, { color: colors.text }]} numberOfLines={0}>
                {item.description}
              </Text>
            </GlassCard>

            {item.badges && (
              <View style={styles.badgesContainer}>
                {item.badges.map((badge, badgeIndex) => (
                  <AnimatedBadge
                    key={badge.name}
                    badge={badge}
                    index={badgeIndex}
                    colors={colors}
                    logosReady={logosReady}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }, [colors.text, currentIndex]);

  const isHeroSlide = true;

  return (
    <View style={[styles.container, isHeroSlide && styles.welcomeContainer]}>
      {!isHeroSlide && (
        <LinearGradient
          colors={colors.backgroundGradient as readonly [string, string, string]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {!isHeroSlide && (
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]} />
      )}

      {/* Slides FlatList */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={onScrollToIndexFailed}
        scrollEventThrottle={32}
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
        windowSize={2}
        updateCellsBatchingPeriod={100}
        legacyImplementation={false}
        disableVirtualization={false}
      />

      {!isHeroSlide && (
        <View style={styles.paginationContainer}>
          <PaginationDots total={onboardingSlides.length} currentIndex={currentIndex} />
        </View>
      )}

      {/* Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        {isHeroSlide ? (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.welcomeButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.welcomeButtonText}>{currentIndex === 1 ? "Next" : "Get Started"}</Text>
          </Pressable>
        ) : (
          <GlassButton
            title={currentIndex === onboardingSlides.length - 1 ? "Get Started" : "Next"}
            onPress={handleNext}
            variant="primary"
            size="lg"
            style={styles.nextButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContainer: {
    backgroundColor: '#FFF5F1',
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
  badgeFallbackText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  // Welcome slide styles
  welcomeSlide: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#FFF5F1',
  },
  welcomeImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.52,
    overflow: 'hidden',
  },
  welcomeHeroImage: {
    width: '100%',
    height: '100%',
  },
  welcomeImageFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  welcomeTitleDark: {
    color: '#1A1A2E',
    fontSize: 36,
    fontWeight: '700',
  },
  welcomeTitleAccent1: {
    color: '#E8956D',
    fontSize: 36,
    fontWeight: '700',
  },
  welcomeTitleAccent2: {
    color: '#D4878F',
    fontSize: 36,
    fontWeight: '700',
  },
  welcomeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#7A7A8E',
    fontWeight: '500',
  },
  welcomeButton: {
    width: '100%',
    backgroundColor: '#1A1A2E',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Credential tags overlaid on the image
  credentialOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  credentialTagsContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  credentialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 7,
    paddingHorizontal: 13,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  credentialTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
