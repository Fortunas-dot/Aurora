import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../common';
import { SPACING, TYPOGRAPHY, COLORS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface OnboardingOverlayProps {
  visible: boolean;
  title: string;
  description: string;
  onNext: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  visible,
  title,
  description,
  onNext,
  onSkip,
  showSkip = false,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Debug logging
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {}} // Prevent back button from closing during onboarding
      presentationStyle="overFullScreen"
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Backdrop */}
        <Pressable 
          style={styles.backdrop}
          onPress={() => {}} // Prevent closing by tapping backdrop
          activeOpacity={1}
        />

        {/* Content Card */}
        <View style={[styles.contentContainer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <GlassCard padding="lg" style={styles.card} gradient>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>
            <Text style={[styles.description, { color: '#FFFFFF' }]}>
              {description}
            </Text>
            
            <View style={styles.buttonContainer}>
              {showSkip && onSkip && (
                <GlassButton
                  title="Skip"
                  onPress={onSkip}
                  variant="outline"
                  style={styles.skipButton}
                />
              )}
              <GlassButton
                title="Next"
                onPress={onNext}
                variant="primary"
                style={styles.nextButton}
              />
            </View>
          </GlassCard>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  card: {
    width: '100%',
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    marginBottom: SPACING.md,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    ...TYPOGRAPHY.bodyLarge,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});
