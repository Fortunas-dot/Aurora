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

  // Always show the 4 analyzing items regardless of available context
  // Build list of analyzing items - always show 4 items
  const analyzingItems: AnalyzingItem[] = [
    {
      label: 'Analyzing health information',
      icon: 'snow-outline',
      iconColor: '#60A5FA', // Light blue
    },
    {
      label: 'Analyzing journal',
      icon: 'book-outline',
      iconColor: '#5EEAD4', // Teal
    },
    {
      label: 'Analyzing emotional patterns',
      icon: 'heart-outline',
      iconColor: '#F87171', // Light red/pink
    },
    {
      label: 'Analyzing psychology & behavior findings',
      icon: 'help-circle-outline',
      iconColor: '#A78BFA', // Light purple
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
            <Ionicons name={item.icon} size={14} color={item.iconColor} />
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    width: '100%',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    width: '100%',
    minHeight: 36,
    maxHeight: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs + 2,
    flexShrink: 0,
  },
  itemText: {
    ...TYPOGRAPHY.small,
    fontSize: 10.5,
    textAlign: 'left',
    lineHeight: 13,
    flex: 1,
    fontWeight: '500',
  },
});
