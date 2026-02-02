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
      Alert.alert('Velden vereist', 'Vul alstublieft zowel onderwerp als bericht in.');
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
          'Email niet beschikbaar',
          'Er is geen email app geïnstalleerd. Je kunt ons bereiken op: info@aurora.nl'
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        'Fout',
        'Kon email app niet openen. Je kunt ons bereiken op: info@aurora.nl'
      );
    }
  };

  const handleCopyEmail = async () => {
    await Clipboard.setStringAsync('info@aurora.nl');
    Alert.alert('Gekopieerd', 'Email adres gekopieerd naar klembord');
  };

  const faqItems = [
    {
      question: 'Hoe gebruik ik Aurora?',
      answer: 'Aurora is een A.I. mentale gezondheid companion die je helpt met je mentale gezondheid. Je kunt chatten, journal entries maken, en deelnemen aan support groepen.',
    },
    {
      question: 'Is mijn data privé?',
      answer: 'Ja, we nemen privacy zeer serieus. Je kunt anoniem blijven en alle data is versleuteld en veilig opgeslagen.',
    },
    {
      question: 'Hoe kan ik mijn account verwijderen?',
      answer: 'Ga naar je profiel instellingen en selecteer "Account verwijderen". Je kunt ook contact met ons opnemen via email.',
    },
    {
      question: 'Werkt Aurora offline?',
      answer: 'Nee, Aurora heeft een internetverbinding nodig om te functioneren, omdat de A.I. mentale gezondheid ondersteuning real-time plaatsvindt.',
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
          <Text style={styles.sectionTitle}>Neem contact op</Text>
          <GlassCard padding="lg">
            <Text style={styles.contactText}>
              Heb je vragen of problemen? Stuur ons een email en we helpen je graag verder.
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
                <Text style={styles.copyButtonText}>Kopieer</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <Text style={styles.formLabel}>Onderwerp</Text>
            <GlassInput
              placeholder="Bijv. Vraag over account"
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Bericht</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Beschrijf je vraag of probleem..."
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
          <Text style={styles.sectionTitle}>Veelgestelde vragen</Text>
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
                <Text style={styles.supportInfoTitle}>Response tijd</Text>
                <Text style={styles.supportInfoDescription}>
                  We proberen binnen 24-48 uur te reageren op je email.
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

