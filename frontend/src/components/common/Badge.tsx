import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface BadgeProps {
  count: number;
  max?: number;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ count, max = 99, size = 'md' }) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, isSmall && styles.textSmall]}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeSmall: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    top: -4,
    right: -4,
    borderWidth: 1.5,
  },
  text: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 9,
  },
});

export default Badge;

