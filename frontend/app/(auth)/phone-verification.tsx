import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton, GlassInput, LoadingOverlay } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { apiService } from '../../src/services/api.service';
import { COUNTRIES, Country } from '../../src/constants/countries';

type Params = {
  from?: string;
};

export default function PhoneVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'enter_phone' | 'enter_code'>('enter_phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const filteredCountries = COUNTRIES.filter((country) => {
    if (!countrySearch.trim()) return true;
    const term = countrySearch.toLowerCase();
    return (
      country.name.toLowerCase().includes(term) ||
      country.dialCode.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term)
    );
  });

  const buildFullPhoneNumber = () => {
    const digitsOnly = phoneLocal.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return `${selectedCountry.dialCode}${digitsOnly}`;
  };

  const handleSendCode = async () => {
    setError(null);
    setInfoMessage(null);

    if (!phoneLocal.trim()) {
      setError('Phone number is required');
      return;
    }

    const fullNumber = buildFullPhoneNumber();
    if (!fullNumber) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.post('/auth/send-verification-code', {
        phone_number: fullNumber,
      });

      if ((response as any).success) {
        setStep('enter_code');
        setInfoMessage('We sent you a verification code via SMS.');
      } else {
        setError((response as any).message || 'Failed to send verification code');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);

    if (!code.trim()) {
      setError('Verification code is required');
      return;
    }

    const fullNumber = buildFullPhoneNumber();
    if (!fullNumber) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.post('/auth/verify-phone', {
        phone_number: fullNumber,
        code: code.trim(),
      });

      if ((response as any).success) {
        const goTo = params.from === 'register' ? '/(tabs)' : '/(tabs)/profile';
        router.replace(goTo);
      } else {
        setError((response as any).message || 'Verification failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <View style={styles.headerRow}>
            <GlassButton
              title=""
              variant="secondary"
              size="md"
              style={styles.backButton}
              onPress={() => router.back()}
              leftIcon={<Ionicons name="arrow-back" size={22} color={COLORS.text} />}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(96, 165, 250, 0.3)', 'rgba(167, 139, 250, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Ionicons name="call" size={32} color={COLORS.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Verify your phone</Text>
            <Text style={styles.subtitle}>
              We use your phone number to keep your account secure. It will never be shared publicly.
            </Text>
          </View>

          <GlassCard style={styles.card} padding="lg" gradient>
            {step === 'enter_phone' && (
              <>
                <Text style={styles.label}>Phone number</Text>

                <View style={styles.phoneRow}>
                  <Pressable
                    style={styles.countrySelector}
                    onPress={() => setIsCountryPickerOpen((prev) => !prev)}
                  >
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
                    <Ionicons
                      name={isCountryPickerOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.textSecondary}
                      style={styles.countryChevron}
                    />
                  </Pressable>

                  <View style={styles.phoneInputContainer}>
                    <GlassInput
                      value={phoneLocal}
                      onChangeText={setPhoneLocal}
                      placeholder="612345678"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      icon="call-outline"
                    />
                  </View>
                </View>

                {isCountryPickerOpen && (
                  <View style={styles.countryList}>
                    <View style={styles.countrySearchContainer}>
                      <GlassInput
                        value={countrySearch}
                        onChangeText={setCountrySearch}
                        placeholder="Search country or code"
                        icon="search-outline"
                      />
                    </View>
                    <ScrollView style={styles.countryScroll}>
                      {filteredCountries.map((country) => (
                        <Pressable
                          key={country.code}
                          style={[
                            styles.countryItem,
                            country.code === selectedCountry.code && styles.countryItemActive,
                          ]}
                          onPress={() => {
                            setSelectedCountry(country);
                            setIsCountryPickerOpen(false);
                          }}
                        >
                          <Text style={styles.countryItemFlag}>{country.flag}</Text>
                          <View style={styles.countryItemTextContainer}>
                            <Text style={styles.countryItemName}>{country.name}</Text>
                            <Text style={styles.countryItemDial}>{country.dialCode}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.helperRow}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.helperText}>
                    Select your country on the left and enter your phone number without the leading zero.
                  </Text>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <GlassButton
                  title="Send verification code"
                  onPress={handleSendCode}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  style={styles.primaryButton}
                />
              </>
            )}

            {step === 'enter_code' && (
              <>
                <GlassInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  label="Verification code"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon="key-outline"
                  maxLength={6}
                />

                {infoMessage && !error && (
                  <View style={styles.infoContainer}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.infoText}>{infoMessage}</Text>
                  </View>
                )}

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <GlassButton
                  title="Verify phone"
                  onPress={handleVerifyCode}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  style={styles.primaryButton}
                />

                <GlassButton
                  title="Resend code"
                  onPress={handleSendCode}
                  variant="secondary"
                  size="md"
                  fullWidth
                  style={styles.secondaryButton}
                  disabled={isLoading}
                />
              </>
            )}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message={step === 'enter_phone' ? 'Sending code...' : 'Verifying...'} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
  },
  backButton: {
    paddingHorizontal: SPACING.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.sm,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.background,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  countryDialCode: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  countryChevron: {
    marginLeft: SPACING.xs,
  },
  phoneInputContainer: {
    flex: 1,
  },
  countryList: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.backgroundDark,
    overflow: 'hidden',
  },
  countrySearchContainer: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  countryScroll: {
    maxHeight: 260,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  countryItemActive: {
    backgroundColor: COLORS.glass.background,
  },
  countryItemFlag: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  countryItemTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  countryItemName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  countryItemDial: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorGlass,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successGlass,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  infoText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  primaryButton: {
    marginTop: SPACING.lg,
  },
  secondaryButton: {
    marginTop: SPACING.sm,
  },
});

