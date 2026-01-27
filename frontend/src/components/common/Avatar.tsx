import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  showBorder?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  style,
  showBorder = true,
}) => {
  const getSize = (): number => {
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 56;
      case 'xl': return 80;
      default: return 44;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm': return 12;
      case 'lg': return 22;
      case 'xl': return 32;
      default: return 16;
    }
  };

  const sizeValue = getSize();
  const fontSize = getFontSize();

  const getInitials = (): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate consistent color based on name
  const getGradientColors = (): string[] => {
    if (!name) return ['#60A5FA', '#3B82F6'];
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const gradients = [
      ['#60A5FA', '#3B82F6'], // Blue
      ['#A78BFA', '#8B5CF6'], // Purple
      ['#5EEAD4', '#14B8A6'], // Teal
      ['#F472B6', '#EC4899'], // Pink
      ['#FBBF24', '#F59E0B'], // Yellow
      ['#34D399', '#10B981'], // Green
    ];

    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
        },
        showBorder && styles.border,
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: sizeValue - (showBorder ? 4 : 0),
              height: sizeValue - (showBorder ? 4 : 0),
              borderRadius: (sizeValue - (showBorder ? 4 : 0)) / 2,
            },
          ]}
        />
      ) : (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.placeholder,
            {
              width: sizeValue - (showBorder ? 4 : 0),
              height: sizeValue - (showBorder ? 4 : 0),
              borderRadius: (sizeValue - (showBorder ? 4 : 0)) / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>
            {getInitials()}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  border: {
    borderWidth: 2,
    borderColor: COLORS.glass.border,
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

