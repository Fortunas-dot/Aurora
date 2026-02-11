import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface ContextIndicatorProps {
  hasHealthInfo: boolean;
  hasJournalEntries: boolean;
}

interface AnalyzingItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

export const ContextIndicator: React.FC<ContextIndicatorProps> = ({
  hasHealthInfo,
  hasJournalEntries,
}) => {
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Always show the indicator if at least one context is available
  if (!hasHealthInfo && !hasJournalEntries) {
    return null;
  }

  // Build list of analyzing items - always show 4 items
  const analyzingItems: AnalyzingItem[] = [
    {
      label: 'Analyzing health information',
      icon: 'medical-outline',
      iconColor: '#60A5FA', // Blue
    },
    {
      label: 'Analyzing journal',
      icon: 'book-outline',
      iconColor: '#5EEAD4', // Teal
    },
    {
      label: 'Analyzing emotional patterns',
      icon: 'heart-outline',
      iconColor: '#F87171', // Red/Pink
    },
    {
      label: 'Analyzing latest psychology, behavior findings',
      icon: 'brain-outline',
      iconColor: '#A78BFA', // Purple
    },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {analyzingItems.map((item, index) => (
        <View
          key={index}
          style={[
            styles.itemCard,
            {
              backgroundColor: colors.glass.backgroundLight,
              borderColor: colors.glass.borderLight,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
            <Ionicons name={item.icon} size={16} color={item.iconColor} />
          </View>
          <Text style={[styles.itemText, { color: colors.text }]} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    width: '100%',
    minHeight: 45,
    maxHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    flexShrink: 0,
  },
  itemText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    textAlign: 'left',
    lineHeight: 14,
    flex: 1,
  },
});
