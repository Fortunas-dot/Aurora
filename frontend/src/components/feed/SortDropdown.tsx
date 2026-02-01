import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

export type SortOption = 'newest' | 'popular' | 'discussed';

interface SortConfig {
  id: SortOption;
  label: string;
  labelEn: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SORT_OPTIONS: SortConfig[] = [
  { id: 'newest', label: 'Nieuwste', labelEn: 'Newest', icon: 'time-outline' },
  { id: 'popular', label: 'Populairste', labelEn: 'Most Popular', icon: 'heart-outline' },
  { id: 'discussed', label: 'Meest besproken', labelEn: 'Most Discussed', icon: 'chatbubbles-outline' },
];

interface SortDropdownProps {
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  selectedSort,
  onSortChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = SORT_OPTIONS.find((opt) => opt.id === selectedSort) || SORT_OPTIONS[0];

  const handleSelect = (sort: SortOption) => {
    onSortChange(sort);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => setIsOpen(true)}>
        <Ionicons name={selectedOption.icon} size={18} color={COLORS.textSecondary} />
        <Text style={styles.buttonText}>{selectedOption.label}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Sorteren op</Text>
            {SORT_OPTIONS.map((option) => {
              const isSelected = selectedSort === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.option, isSelected && styles.selectedOption]}
                  onPress={() => handleSelect(option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  buttonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  dropdown: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.md,
  },
  dropdownTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  selectedOption: {
    backgroundColor: COLORS.glass.backgroundLight,
  },
  optionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default SortDropdown;

