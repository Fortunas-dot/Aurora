import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface TagChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const TagChip: React.FC<TagChipProps> = ({
  label,
  onPress,
  selected = false,
  removable = false,
  onRemove,
  size = 'md',
  style,
}) => {
  const isSmall = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        isSmall && styles.containerSmall,
        selected && styles.containerSelected,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          selected && styles.labelSelected,
        ]}
      >
        #{label}
      </Text>
      
      {removable && (
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeIcon}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  containerSmall: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
  },
  containerSelected: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  label: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  labelSmall: {
    ...TYPOGRAPHY.caption,
  },
  labelSelected: {
    color: COLORS.primary,
  },
  removeButton: {
    marginLeft: SPACING.xs,
    padding: 2,
  },
  removeIcon: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});

