import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = COLORS.primary,
  style,
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  const getSize = (): number => {
    switch (size) {
      case 'sm': return 24;
      case 'lg': return 48;
      default: return 32;
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spinValue = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeValue = getSize();
  const borderWidth = sizeValue * 0.1;

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
            borderWidth,
            borderColor: COLORS.glass.border,
            borderTopColor: color,
            transform: [{ rotate: spinValue }],
          },
        ]}
      />
    </View>
  );
};

// Full screen loading overlay
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <LoadingSpinner size="lg" />
        {message && (
          <Animated.Text style={styles.message}>{message}</Animated.Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderStyle: 'solid',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: COLORS.glass.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: 32,
    alignItems: 'center',
  },
  message: {
    color: COLORS.text,
    marginTop: 16,
    fontSize: 16,
  },
});

