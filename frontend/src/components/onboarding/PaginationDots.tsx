import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../constants/theme';

interface PaginationDotsProps {
  total: number;
  currentIndex: number;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({ total, currentIndex }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? colors.primary : colors.glass.border,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
});
