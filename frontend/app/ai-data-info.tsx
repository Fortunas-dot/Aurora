import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../src/constants/theme';
import { useTheme } from '../src/hooks/useTheme';

export default function AiDataInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={colors.backgroundGradient as readonly [string, string, string]}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.glass.background }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI Data Sharing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* What Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              What data is shared?
            </Text>
          </View>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
              <Text style={[styles.listText, { color: colors.textSecondary }]}>
                Text you type in AI chat conversations
              </Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="book" size={20} color={colors.primary} />
              <Text style={[styles.listText, { color: colors.textSecondary }]}>
                Journal entries (for AI-generated prompts and insights)
              </Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="mic" size={20} color={colors.primary} />
              <Text style={[styles.listText, { color: colors.textSecondary }]}>
                Voice recordings and transcripts (for voice therapy)
              </Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="heart" size={20} color={colors.primary} />
              <Text style={[styles.listText, { color: colors.textSecondary }]}>
                Health information from your profile (if applicable)
              </Text>
            </View>
          </View>
        </View>

        {/* Who Receives Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Who receives this data?
            </Text>
          </View>
          <GlassCard style={styles.recipientCard} padding="md">
            <Text style={[styles.recipientName, { color: colors.text }]}>OpenAI</Text>
            <Text style={[styles.recipientDesc, { color: colors.textSecondary }]}>
              Our AI technology provider. OpenAI processes your data to generate supportive 
              responses and insights for your mental health journey.
            </Text>
            <Text style={[styles.recipientHighlight, { color: colors.success }]}>
              ✓ OpenAI does NOT use your data to train their AI models
            </Text>
            <Pressable
              style={styles.externalLink}
              onPress={() => Linking.openURL('https://openai.com/privacy')}
            >
              <Text style={[styles.externalLinkText, { color: colors.primary }]}>
                View OpenAI's Privacy Policy
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </Pressable>
          </GlassCard>
        </View>

        {/* Data Protection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              How is your data protected?
            </Text>
          </View>
          <View style={styles.protectionList}>
            <View style={styles.protectionItem}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                Encrypted in transit and at rest
              </Text>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                OpenAI is contractually obligated to protect your data
              </Text>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                Your data is NOT used for advertising
              </Text>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                Your data is NOT sold to third parties
              </Text>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
                You can revoke consent anytime in Settings
              </Text>
            </View>
          </View>
        </View>

        {/* Why We Need This Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Why do we need this data?
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Aurora's AI features are designed to provide personalized mental health support. 
            To generate helpful, contextual responses, we need to share your conversations 
            and relevant health information with our AI provider.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Without this data sharing, AI features like chat support, voice therapy, and 
            journal insights cannot function. However, you can still use Aurora's community 
            features, groups, and manual journaling without enabling AI.
          </Text>
        </View>

        {/* Privacy Policy Link */}
        <Pressable
          style={[styles.privacyButton, { borderColor: colors.glass.border }]}
          onPress={() => router.push('/privacy-policy')}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[styles.privacyButtonText, { color: colors.primary }]}>
            Read our full Privacy Policy
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>

        {/* Optional Note */}
        <Text style={[styles.optionalNote, { color: colors.textMuted }]}>
          AI features are optional. You can use Aurora's community, journaling, and other 
          features without enabling AI data sharing.
        </Text>
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
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    flex: 1,
  },
  list: {
    gap: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  listText: {
    ...TYPOGRAPHY.body,
    flex: 1,
    lineHeight: 22,
  },
  recipientCard: {
    marginTop: SPACING.xs,
  },
  recipientName: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.xs,
  },
  recipientDesc: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  recipientHighlight: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  externalLinkText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '500',
  },
  protectionList: {
    gap: SPACING.md,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  protectionText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  paragraph: {
    ...TYPOGRAPHY.body,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  privacyButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  optionalNote: {
    ...TYPOGRAPHY.small,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
