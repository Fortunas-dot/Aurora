import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { getCharacterForUser } from '../../utils/characters';
import { getColorByValue, getDefaultGradientColors } from '../../utils/avatarColors';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  userId?: string;
  avatarCharacter?: string | null;
  avatarBackgroundColor?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  showBorder?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  userId,
  avatarCharacter,
  avatarBackgroundColor,
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

  // Normalize avatar URL to ensure it's always absolute
  const normalizedUri = useMemo(() => {
    if (!uri) return null;
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    // If relative URL, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = uri.startsWith('/') ? uri : `/${uri}`;
    return `${baseUrl}${relativeUrl}`;
  }, [uri]);

  // Get character to display (prefer avatarCharacter, fallback to user-based character, then initials)
  const getDisplayCharacter = (): string => {
    if (avatarCharacter) {
      return avatarCharacter;
    }
    if (userId) {
      return getCharacterForUser(userId);
    }
    // Fallback to initials if no userId or character
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get gradient colors - use custom background color if provided, otherwise use default
  const getGradientColors = (): string[] => {
    if (avatarBackgroundColor) {
      const colorInfo = getColorByValue(avatarBackgroundColor);
      if (colorInfo) {
        return colorInfo.gradient;
      }
      // If color value exists but not in our palette, create a gradient from it
      return [avatarBackgroundColor, avatarBackgroundColor];
    }
    // Fallback to default gradient based on name
    return getDefaultGradientColors(name);
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
      {normalizedUri ? (
        <Image
          source={{ uri: normalizedUri }}
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
          <Text style={[styles.character, { fontSize: sizeValue * 0.5 }]}>
            {getDisplayCharacter()}
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
  character: {
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});

