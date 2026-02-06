import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { GlassCard, GlassButton, GlassInput } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Fields required', 'Please fill in both subject and message.');
      return;
    }

    const email = 'info@aurora.nl';
    const subjectEncoded = encodeURIComponent(subject);
    const bodyEncoded = encodeURIComponent(message);
    const mailtoUrl = `mailto:${email}?subject=${subjectEncoded}&body=${bodyEncoded}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Email not available',
          'No email app is installed. You can reach us at: info@aurora.nl'
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        'Error',
        'Could not open email app. You can reach us at: info@aurora.nl'
      );
    }
  };

  const handleCopyEmail = async () => {
    await Clipboard.setStringAsync('info@aurora.nl');
    Alert.alert('Copied', 'Email address copied to clipboard');
  };

  const faqItems = [
    {
      question: 'How do I use Aurora?',
      answer: 'Aurora is an A.I. mental health companion that helps you with your mental health. You can chat, create journal entries, and participate in support groups.',
    },
    {
      question: 'Is my data private?',
      answer: 'Yes, we take privacy very seriously. You can stay anonymous and all data is encrypted and securely stored.',
    },
    {
      question: 'How can I delete my account?',
      answer: 'Go to your profile settings and select "Delete Account". You can also contact us via email.',
    },
    {
      question: 'Does Aurora work offline?',
      answer: 'No, Aurora needs an internet connection to function, as the A.I. mental health support happens in real-time.',
    },
  ];

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <GlassCard padding="lg">
            <Text style={styles.contactText}>
              Have questions or problems? Send us an email and we'll be happy to help.
            </Text>

            <View style={styles.emailContainer}>
              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                <Text style={styles.emailText}>info@aurora.nl</Text>
              </View>
              <Pressable
                style={styles.copyButton}
                onPress={handleCopyEmail}
              >
                <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
                <Text style={styles.copyButtonText}>Copy</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <Text style={styles.formLabel}>Subject</Text>
            <GlassInput
              placeholder="E.g. Question about account"
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your question or problem..."
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <GlassButton
              title="Open Email App"
              onPress={handleSendEmail}
              variant="primary"
              style={styles.sendButton}
            />
          </GlassCard>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((item, index) => (
            <GlassCard key={index} padding="md" style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Support Info */}
        <View style={styles.section}>
          <GlassCard padding="lg">
            <View style={styles.supportInfo}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
              <View style={styles.supportInfoText}>
                <Text style={styles.supportInfoTitle}>Response Time</Text>
                <Text style={styles.supportInfoDescription}>
                  We try to respond to your email within 24-48 hours.
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>
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
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  contactText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.md,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  emailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  copyButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glass.border,
    marginVertical: SPACING.md,
  },
  formLabel: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    marginBottom: SPACING.md,
  },
  textArea: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.md,
    minHeight: 120,
    marginBottom: SPACING.md,
  },
  sendButton: {
    marginTop: SPACING.sm,
  },
  faqCard: {
    marginBottom: SPACING.md,
  },
  faqQuestion: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  faqAnswer: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  supportInfoText: {
    flex: 1,
  },
  supportInfoTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  supportInfoDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});

