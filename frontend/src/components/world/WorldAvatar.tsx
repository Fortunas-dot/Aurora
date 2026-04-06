import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCharacterForUser } from '../../utils/characters';
import { getColorByValue, getDefaultGradientColors } from '../../utils/avatarColors';

type Props = {
  uri?: string | null;
  name?: string;
  userId: string;
  avatarCharacter?: string | null;
  avatarBackgroundColor?: string | null;
  size: number;
  label?: string;
};

export const WorldAvatar: React.FC<Props> = ({
  uri,
  name,
  userId,
  avatarCharacter,
  avatarBackgroundColor,
  size,
  label,
}) => {
  const normalizedUri = useMemo(() => {
    if (!uri) return null;
    if (uri.startsWith('file://')) return uri;
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = uri.startsWith('/') ? uri : `/${uri}`;
    return `${baseUrl}${relativeUrl}`;
  }, [uri]);

  const character = (): string => {
    if (avatarCharacter) return avatarCharacter;
    return getCharacterForUser(userId);
  };

  const gradientPair = (): [string, string] => {
    if (avatarBackgroundColor) {
      const info = getColorByValue(avatarBackgroundColor);
      if (info) return [info.gradient[0], info.gradient[1] ?? info.gradient[0]];
      return [avatarBackgroundColor, avatarBackgroundColor];
    }
    const g = getDefaultGradientColors(name);
    return [g[0], g[1] ?? g[0]];
  };

  const fontSize = Math.max(10, Math.floor(size * 0.42));
  const pair = gradientPair();

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { maxWidth: size + 48 }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.pixelFrame, { width: size + 4, height: size + 4 }]}>
        <View style={[styles.innerShadow, { width: size, height: size }]}>
          {normalizedUri ? (
            <Image
              source={{ uri: normalizedUri }}
              style={{ width: size, height: size }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient colors={[pair[0], pair[1]]} style={[styles.gradient, { width: size, height: size }]}>
              <Text style={[styles.emoji, { fontSize }]}>{character()}</Text>
            </LinearGradient>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E8EDF5',
    marginBottom: 2,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  pixelFrame: {
    borderWidth: 2,
    borderColor: '#1a1f2e',
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
    // crisp pixel look
    borderRadius: 0,
  },
  innerShadow: {
    overflow: 'hidden',
    borderRadius: 0,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  emoji: {
    textAlign: 'center',
  },
});
