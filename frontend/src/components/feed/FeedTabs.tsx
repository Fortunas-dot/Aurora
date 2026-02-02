import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

export type FeedTab = 'home' | 'popular' | 'all' | 'saved';

interface TabConfig {
  id: FeedTab;
  label: string;
  labelEn: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { id: 'home', label: 'Home', labelEn: 'Home', icon: 'home-outline' },
  { id: 'popular', label: 'Populair', labelEn: 'Popular', icon: 'trending-up-outline' },
  { id: 'all', label: 'Alles', labelEn: 'All', icon: 'apps-outline' },
  { id: 'saved', label: 'Opgeslagen', labelEn: 'Saved', icon: 'bookmark-outline' },
];

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isAuthenticated?: boolean;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({
  activeTab,
  onTabChange,
  isAuthenticated = false,
}) => {
  const filteredTabs = TABS.filter((tab) => {
    // Hide "home" and "saved" tabs for non-authenticated users
    if (!isAuthenticated && (tab.id === 'home' || tab.id === 'saved')) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab.id)}
            >
              <Ionicons
                name={isActive ? (tab.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : tab.icon}
                size={18}
                color={isActive ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'transparent',
    marginRight: SPACING.xs,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  tabText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: SPACING.md,
    right: SPACING.md,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
});

export default FeedTabs;

