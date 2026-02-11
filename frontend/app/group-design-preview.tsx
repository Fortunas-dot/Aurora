import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { secureStorage } from '../src/utils/secureStorage';

const { width } = Dimensions.get('window');

type GroupDesignVariant = 'reddit' | 'facebook' | 'modern' | 'current';

interface DesignPreview {
  id: GroupDesignVariant;
  name: string;
  description: string;
  features: string[];
  previewColor: string[];
}

const DESIGN_VARIANTS: DesignPreview[] = [
  {
    id: 'current',
    name: 'Current Design',
    description: 'The current Reddit/Facebook-inspired design with cover image and overlapping avatar',
    features: [
      'Cover image section',
      'Overlapping avatar',
      'Stats row (members, country, health)',
      'Admin badge',
      'Action buttons',
    ],
    previewColor: ['rgba(96, 165, 250, 0.4)', 'rgba(167, 139, 250, 0.4)'],
  },
  {
    id: 'reddit',
    name: 'Reddit Style',
    description: 'Clean, minimal design inspired by Reddit communities with sidebar info',
    features: [
      'Compact header with icon',
      'Sidebar with rules and info',
      'Member count widget',
      'Join/Leave button prominent',
      'Clean post list',
    ],
    previewColor: ['rgba(255, 69, 0, 0.3)', 'rgba(255, 140, 0, 0.3)'],
  },
  {
    id: 'facebook',
    name: 'Facebook Style',
    description: 'Social media focused design with large cover photo and detailed profile',
    features: [
      'Large cover photo',
      'Profile picture overlay',
      'About section',
      'Photos and events tabs',
      'Social engagement features',
    ],
    previewColor: ['rgba(24, 119, 242, 0.3)', 'rgba(66, 103, 178, 0.3)'],
  },
  {
    id: 'modern',
    name: 'Modern Hybrid',
    description: 'Contemporary design combining best elements with glassmorphism',
    features: [
      'Gradient header',
      'Floating action button',
      'Card-based layout',
      'Smooth animations',
      'Modern glass effects',
    ],
    previewColor: ['rgba(96, 165, 250, 0.3)', 'rgba(139, 92, 246, 0.3)'],
  },
];

export default function GroupDesignPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDesign, setSelectedDesign] = useState<GroupDesignVariant>('current');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved design preference
  useEffect(() => {
    const loadSavedDesign = async () => {
      try {
        const saved = await secureStorage.getItemAsync('group_design_variant');
        if (saved && (saved === 'current' || saved === 'reddit' || saved === 'facebook' || saved === 'modern')) {
          setSelectedDesign(saved as GroupDesignVariant);
        }
      } catch (error) {
        console.error('Error loading saved design:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedDesign();
  }, []);

  const handleSelectDesign = async (designId: GroupDesignVariant) => {
    setSelectedDesign(designId);
    try {
      await secureStorage.setItemAsync('group_design_variant', designId);
    } catch (error) {
      console.error('Error saving design:', error);
    }
  };

  const handleApply = async () => {
    try {
      await secureStorage.setItemAsync('group_design_variant', selectedDesign);
      router.back();
    } catch (error) {
      console.error('Error applying design:', error);
    }
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Group Page Design</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.infoCard} padding="lg">
          <Text style={styles.infoTitle}>Choose Your Design</Text>
          <Text style={styles.infoText}>
            Select a design style for group detail pages. You can preview each option below and choose the one that best fits your preferences.
          </Text>
        </GlassCard>

        {DESIGN_VARIANTS.map((design) => (
          <Pressable
            key={design.id}
            style={[
              styles.designCard,
              selectedDesign === design.id && styles.designCardSelected,
            ]}
            onPress={() => handleSelectDesign(design.id)}
          >
            <GlassCard
              style={styles.previewCard}
              padding={0}
            >
              {/* Preview Header */}
              <LinearGradient
                colors={design.previewColor}
                style={styles.previewHeader}
              >
                <View style={styles.previewContent}>
                  <View style={styles.previewAvatar}>
                    <Ionicons name="people" size={32} color={COLORS.primary} />
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>Sample Group</Text>
                    <Text style={styles.previewStats}>1,234 members</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Preview Body */}
              <View style={styles.previewBody}>
                <Text style={styles.designName}>{design.name}</Text>
                <Text style={styles.designDescription}>{design.description}</Text>
                
                <View style={styles.featuresList}>
                  {design.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Selection Indicator */}
              {selectedDesign === design.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </GlassCard>
          </Pressable>
        ))}

        <GlassButton
          title="Apply Design"
          onPress={handleApply}
          variant="primary"
          style={styles.applyButton}
          icon="checkmark"
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  designCard: {
    marginBottom: SPACING.md,
  },
  designCardSelected: {
    opacity: 1,
  },
  previewCard: {
    overflow: 'hidden',
  },
  previewHeader: {
    height: 100,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 3,
    borderColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -20,
  },
  previewInfo: {
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
  },
  previewName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  previewStats: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  previewBody: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  designName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  designDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  featuresList: {
    gap: SPACING.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  featureText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  selectedText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.primary,
  },
  applyButton: {
    marginTop: SPACING.md,
  },
});
