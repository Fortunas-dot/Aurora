import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'light' | 'dark' | 'primary';
  blur?: boolean;
  blurIntensity?: number;
  onPress?: () => void;
  padding?: keyof typeof SPACING | number;
  gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  blur = false,
  blurIntensity = 20,
  onPress,
  padding = 'md',
  gradient = false,
}) => {
  const paddingValue = typeof padding === 'number' ? padding : SPACING[padding];

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'light':
        return {
          backgroundColor: COLORS.glass.backgroundLight,
          borderColor: COLORS.glass.borderLight,
        };
      case 'dark':
        return {
          backgroundColor: COLORS.glass.backgroundDark,
          borderColor: COLORS.glass.border,
        };
      case 'primary':
        return {
          backgroundColor: 'rgba(96, 165, 250, 0.15)',
          borderColor: 'rgba(96, 165, 250, 0.3)',
        };
      default:
        return {
          backgroundColor: COLORS.glass.background,
          borderColor: COLORS.glass.border,
        };
    }
  };

  const content = (
    <View style={[styles.innerContainer, { padding: paddingValue }]}>
      {gradient && (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />
      )}
      {children}
    </View>
  );

  const cardStyle: ViewStyle = {
    ...styles.container,
    ...getVariantStyle(),
    ...(style as ViewStyle),
  };

  if (blur) {
    const Container = onPress ? Pressable : View;
    return (
      <Container
        style={[cardStyle, SHADOWS.md]}
        onPress={onPress}
      >
        <BlurView intensity={blurIntensity} style={styles.blur} tint="dark">
          {content}
        </BlurView>
      </Container>
    );
  }

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          SHADOWS.md,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, SHADOWS.md]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  innerContainer: {
    position: 'relative',
    flex: 1,
  },
  blur: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.xl,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

