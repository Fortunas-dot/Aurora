import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getSizeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
          text: { fontSize: 14 },
        };
      case 'lg':
        return {
          container: { paddingVertical: SPACING.md + 4, paddingHorizontal: SPACING.xl },
          text: { fontSize: 18 },
        };
      default:
        return {
          container: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
          text: { fontSize: 16 },
        };
    }
  };

  const getVariantStyle = (): { container: ViewStyle; text: TextStyle; gradient?: string[] } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            borderColor: 'rgba(96, 165, 250, 0.4)',
          },
          text: { color: COLORS.primary },
          gradient: ['rgba(96, 165, 250, 0.3)', 'rgba(96, 165, 250, 0.1)'],
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: 'rgba(167, 139, 250, 0.2)',
            borderColor: 'rgba(167, 139, 250, 0.4)',
          },
          text: { color: COLORS.secondary },
          gradient: ['rgba(167, 139, 250, 0.3)', 'rgba(167, 139, 250, 0.1)'],
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: COLORS.glass.borderLight,
          },
          text: { color: COLORS.text },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: { color: COLORS.textSecondary },
        };
      default:
        return {
          container: {
            backgroundColor: COLORS.glass.backgroundLight,
            borderColor: COLORS.glass.border,
          },
          text: { color: COLORS.text },
        };
    }
  };

  const sizeStyle = getSizeStyle();
  const variantStyle = getVariantStyle();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        sizeStyle.container,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {variantStyle.gradient && (
        <LinearGradient
          colors={variantStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />
      )}
      
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              sizeStyle.text,
              variantStyle.text,
              icon && iconPosition === 'left' && { marginLeft: SPACING.sm },
              icon && iconPosition === 'right' && { marginRight: SPACING.sm },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

