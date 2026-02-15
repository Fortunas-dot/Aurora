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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.sectionText}>
              Welcome to Aurora. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect information that you provide directly to us, including:
            </Text>
            <Text style={styles.bulletPoint}>• Account information (username, email, display name)</Text>
            <Text style={styles.bulletPoint}>• Profile information (bio, avatar, health information)</Text>
            <Text style={styles.bulletPoint}>• Journal entries and content you create</Text>
            <Text style={styles.bulletPoint}>• Messages and communications</Text>
            <Text style={styles.bulletPoint}>• Usage data and analytics</Text>
            <Text style={[styles.sectionText, { marginTop: SPACING.md }]}>
              <Text style={{ fontWeight: '600' }}>How we collect data:</Text> We collect this information directly from you when you:
            </Text>
            <Text style={styles.bulletPoint}>• Create an account or update your profile</Text>
            <Text style={styles.bulletPoint}>• Use features like journaling, chat, or voice support</Text>
            <Text style={styles.bulletPoint}>• Interact with the app (usage analytics are collected automatically)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              We use the information we collect to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
            <Text style={styles.bulletPoint}>• Process your requests and transactions</Text>
            <Text style={styles.bulletPoint}>• Send you technical notices and support messages</Text>
            <Text style={styles.bulletPoint}>• Respond to your comments and questions</Text>
            <Text style={styles.bulletPoint}>• Monitor and analyze usage patterns</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. AI Features and Third-Party Services</Text>
            <Text style={styles.sectionText}>
              Aurora offers AI-powered features such as AI chat, voice support, and AI-generated journal insights. 
              When you use these features, we may send the following information to our servers and to our AI technology provider (currently OpenAI):
            </Text>
            <Text style={styles.bulletPoint}>• The text you type in chats and journal entries</Text>
            <Text style={styles.bulletPoint}>• Voice recordings and transcripts when you use voice support</Text>
            <Text style={styles.bulletPoint}>• Optional health information you choose to store in Aurora (for example, mental health conditions, medications, or therapies), when you choose to include this context</Text>
            <Text style={styles.sectionText}>
              This information is used only to generate supportive responses, journaling prompts, and insights within Aurora. 
              It is not used for advertising, and we do not sell your data to data brokers.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={{ fontWeight: '600' }}>Third-Party Data Sharing:</Text> We share the data listed above with OpenAI, our AI technology provider, 
              solely for the purpose of generating AI-powered responses and insights. OpenAI is contractually obligated to protect your data 
              and provides the same or equal protection of personal data as we do. OpenAI does not use your data to train their models 
              (when using their API with appropriate settings) and is bound by their privacy policy and our data processing agreement. 
              You can review OpenAI's privacy policy at https://openai.com/privacy.
            </Text>
            <Text style={styles.sectionText}>
              We ask for your explicit permission in the app before enabling these AI features. 
              You can continue to use Aurora without AI features if you prefer not to share this data.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Data Security</Text>
            <Text style={styles.sectionText}>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Your Privacy Rights</Text>
            <Text style={styles.sectionText}>
              You have the right to:
            </Text>
            <Text style={styles.bulletPoint}>• Access your personal data</Text>
            <Text style={styles.bulletPoint}>• Request correction of inaccurate data</Text>
            <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
            <Text style={styles.bulletPoint}>• Export your data</Text>
            <Text style={styles.bulletPoint}>• Opt-out of certain data processing</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Anonymous Mode</Text>
            <Text style={styles.sectionText}>
              Aurora offers an anonymous mode that allows you to participate in the community without revealing your identity. When enabled, your posts and comments will not display your username or profile information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have any questions about this Privacy Policy, please contact us at info@aurora.nl
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
