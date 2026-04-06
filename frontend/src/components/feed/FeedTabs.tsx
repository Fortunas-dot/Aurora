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
import { useTranslation } from '../../hooks/useTranslation';

export type FeedTab = 'all' | 'post' | 'question' | 'story' | 'saved';

interface TabConfig {
  id: FeedTab;
  labelKey: 'feed_tab_all' | 'feed_tab_posts' | 'feed_tab_questions' | 'feed_tab_stories' | 'feed_tab_saved';
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { id: 'all', labelKey: 'feed_tab_all', icon: 'apps-outline' },
  { id: 'post', labelKey: 'feed_tab_posts', icon: 'chatbubbles-outline' },
  { id: 'question', labelKey: 'feed_tab_questions', icon: 'help-circle-outline' },
  { id: 'story', labelKey: 'feed_tab_stories', icon: 'book-outline' },
  { id: 'saved', labelKey: 'feed_tab_saved', icon: 'bookmark-outline' },
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
  const { t } = useTranslation();
  const filteredTabs = TABS.filter((tab) => {
    // Hide "saved" tab for non-authenticated users
    if (!isAuthenticated && tab.id === 'saved') {
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
                {t(tab.labelKey)}
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

