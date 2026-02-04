import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/constants/theme';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.contentCard} padding="lg">
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By accessing and using Aurora, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Use License</Text>
            <Text style={styles.sectionText}>
              Permission is granted to temporarily use Aurora for personal, non-commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </Text>
            <Text style={styles.bulletPoint}>• Modify or copy the materials</Text>
            <Text style={styles.bulletPoint}>• Use the materials for any commercial purpose</Text>
            <Text style={styles.bulletPoint}>• Attempt to reverse engineer any software</Text>
            <Text style={styles.bulletPoint}>• Remove any copyright or proprietary notations</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.sectionText}>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
            <Text style={styles.bulletPoint}>• Keep your account information updated</Text>
            <Text style={styles.bulletPoint}>• Not share your account with others</Text>
            <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Conduct</Text>
            <Text style={styles.sectionText}>
              You agree not to use Aurora to:
            </Text>
            <Text style={styles.bulletPoint}>• Post harmful, abusive, or offensive content</Text>
            <Text style={styles.bulletPoint}>• Harass, threaten, or harm others</Text>
            <Text style={styles.bulletPoint}>• Violate any applicable laws or regulations</Text>
            <Text style={styles.bulletPoint}>• Infringe on intellectual property rights</Text>
            <Text style={styles.bulletPoint}>• Spread misinformation or false information</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Content Ownership</Text>
            <Text style={styles.sectionText}>
              You retain ownership of any content you create and post on Aurora. By posting content, you grant us a license to use, display, and distribute your content within the application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Disclaimer</Text>
            <Text style={styles.sectionText}>
              Aurora is provided for informational and support purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions you may have regarding a medical condition.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              In no event shall Aurora or its suppliers be liable for any damages arising out of the use or inability to use the application, even if Aurora has been notified of the possibility of such damage.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of Aurora after such modifications constitutes acceptance of the updated terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Contact Information</Text>
            <Text style={styles.sectionText}>
              If you have any questions about these Terms of Service, please contact us at info@aurora.nl
            </Text>
          </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  contentCard: {
    marginBottom: SPACING.md,
  },
  lastUpdated: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  bulletPoint: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
    lineHeight: 24,
  },
});
