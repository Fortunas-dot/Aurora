import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { useSettingsStore } from '../src/store/settingsStore';
import { getFontFamily } from '../src/utils/fontHelper';

// Available fonts that work cross-platform
const AVAILABLE_FONTS = [
  { id: 'system', name: 'System Default', family: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) },
  { id: 'sfpro', name: 'SF Pro', family: Platform.select({ ios: 'SF Pro Display', android: 'Roboto', default: 'SF Pro Display' }) },
  { id: 'roboto', name: 'Roboto', family: 'Roboto' },
  { id: 'arial', name: 'Arial', family: 'Arial' },
  { id: 'helvetica', name: 'Helvetica', family: 'Helvetica' },
  { id: 'georgia', name: 'Georgia', family: 'Georgia' },
  { id: 'times', name: 'Times New Roman', family: 'Times New Roman' },
  { id: 'courier', name: 'Courier New', family: 'Courier New' },
  { id: 'verdana', name: 'Verdana', family: 'Verdana' },
  { id: 'trebuchet', name: 'Trebuchet MS', family: 'Trebuchet MS' },
  { id: 'comic', name: 'Comic Sans MS', family: 'Comic Sans MS' },
  { id: 'impact', name: 'Impact', family: 'Impact' },
  { id: 'palatino', name: 'Palatino', family: 'Palatino' },
];

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog. 1234567890';

export default function FontSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fontFamily, setFontFamily } = useSettingsStore();
  const [selectedFont, setSelectedFont] = useState(fontFamily || 'system');

  const handleSelectFont = async (fontId: string) => {
    setSelectedFont(fontId);
    await setFontFamily(fontId);
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
        <Text style={styles.headerTitle}>Font</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Section */}
        <GlassCard style={styles.previewCard} padding="lg">
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={[styles.previewText, { fontFamily: getFontFamily(selectedFont) }]}>
              {SAMPLE_TEXT}
            </Text>
            <Text style={[styles.previewHeading, { fontFamily: getFontFamily(selectedFont) }]}>
              Heading Example
            </Text>
            <Text style={[styles.previewBody, { fontFamily: getFontFamily(selectedFont) }]}>
              This is how body text will look with this font. It should be comfortable to read for longer periods of time.
            </Text>
          </View>
        </GlassCard>

        {/* Font List */}
        <GlassCard style={styles.fontListCard} padding="lg">
          <Text style={styles.sectionTitle}>Choose Font</Text>
          <Text style={styles.sectionSubtitle}>
            Select a font that you find most comfortable to read
          </Text>

          {AVAILABLE_FONTS.map((font) => (
            <Pressable
              key={font.id}
              style={[
                styles.fontItem,
                selectedFont === font.id && styles.fontItemSelected,
              ]}
              onPress={() => handleSelectFont(font.id)}
            >
              <View style={styles.fontItemContent}>
                <Text
                  style={[
                    styles.fontName,
                    { fontFamily: getFontFamily(font.id) },
                    selectedFont === font.id && styles.fontNameSelected,
                  ]}
                >
                  {font.name}
                </Text>
                <Text
                  style={[
                    styles.fontSample,
                    { fontFamily: getFontFamily(font.id) },
                    selectedFont === font.id && styles.fontSampleSelected,
                  ]}
                >
                  {SAMPLE_TEXT}
                </Text>
              </View>
              {selectedFont === font.id && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </Pressable>
          ))}
        </GlassCard>
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
  previewCard: {
    marginBottom: SPACING.md,
  },
  previewLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  previewContainer: {
    gap: SPACING.md,
  },
  previewText: {
    fontSize: 18,
    color: COLORS.text,
    lineHeight: 26,
  },
  previewHeading: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 32,
  },
  previewBody: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  fontListCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  fontItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.sm,
  },
  fontItemSelected: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: COLORS.primary,
  },
  fontItemContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  fontName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontSize: 16,
  },
  fontNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  fontSample: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  fontSampleSelected: {
    color: COLORS.textSecondary,
  },
});
