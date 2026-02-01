import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Zoeken...',
  isExpanded: controlledExpanded,
  onExpandChange,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const widthAnim = useRef(new Animated.Value(0)).current;
  
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  const handleExpand = () => {
    const newExpanded = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newExpanded);
    }
    onExpandChange?.(newExpanded);
  };

  const handleClose = () => {
    setQuery('');
    Keyboard.dismiss();
    if (controlledExpanded === undefined) {
      setInternalExpanded(false);
    }
    onExpandChange?.(false);
  };

  const handleSubmit = () => {
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    // Debounced search could be implemented here
  };

  if (!isExpanded) {
    return (
      <Pressable style={styles.iconButton} onPress={handleExpand}>
        <Ionicons name="search" size={24} color={COLORS.text} />
      </Pressable>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>
      <Pressable style={styles.cancelButton} onPress={handleClose}>
        <Text style={styles.cancelText}>Annuleer</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.sm,
    height: 40,
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  cancelButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
});

export default SearchBar;

