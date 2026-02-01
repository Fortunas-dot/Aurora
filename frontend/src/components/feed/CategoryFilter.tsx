import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

export interface Category {
  id: string;
  label: string;
  labelEn: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', label: 'Alles', labelEn: 'All' },
  { id: 'angst', label: 'Angst', labelEn: 'Anxiety', icon: 'alert-circle-outline' },
  { id: 'depressie', label: 'Depressie', labelEn: 'Depression', icon: 'cloudy-outline' },
  { id: 'stress', label: 'Stress', labelEn: 'Stress', icon: 'flash-outline' },
  { id: 'therapie', label: 'Therapie', labelEn: 'Therapy', icon: 'heart-outline' },
  { id: 'mindfulness', label: 'Mindfulness', labelEn: 'Mindfulness', icon: 'leaf-outline' },
  { id: 'relaties', label: 'Relaties', labelEn: 'Relationships', icon: 'people-outline' },
  { id: 'slaap', label: 'Slaap', labelEn: 'Sleep', icon: 'moon-outline' },
  { id: 'zelfzorg', label: 'Zelfzorg', labelEn: 'Self-care', icon: 'fitness-outline' },
];

interface CategoryFilterProps {
  categories?: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories = DEFAULT_CATEGORIES,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <Pressable
              key={category.id}
              style={[styles.chip, isSelected && styles.selectedChip]}
              onPress={() => onCategoryChange(category.id)}
            >
              {category.icon && (
                <Ionicons
                  name={category.icon}
                  size={14}
                  color={isSelected ? COLORS.white : COLORS.textMuted}
                  style={styles.chipIcon}
                />
              )}
              <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                {category.id === 'all' ? category.label : `#${category.label.toLowerCase()}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginRight: SPACING.xs,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipIcon: {
    marginRight: SPACING.xs,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  selectedChipText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default CategoryFilter;

