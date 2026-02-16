import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, GlassButton, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { userService } from '../src/services/user.service';
import { useAuthStore } from '../src/store/authStore';
import { COUNTRIES, Country } from '../src/constants/countries';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user?.phoneNumber) {
      // Parse existing phone number to extract country code and local number
      const fullNumber = user.phoneNumber;
      const country = COUNTRIES.find(c => fullNumber.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneLocal(fullNumber.replace(country.dialCode, ''));
      } else {
        // If no matching country found, try to extract manually
        const match = fullNumber.match(/^(\+\d{1,3})(.+)$/);
        if (match) {
          const dialCode = match[1];
          const local = match[2];
          const foundCountry = COUNTRIES.find(c => c.dialCode === dialCode);
          if (foundCountry) {
            setSelectedCountry(foundCountry);
            setPhoneLocal(local);
          } else {
            setPhoneLocal(fullNumber);
          }
        } else {
          setPhoneLocal(fullNumber);
        }
      }
    }
  }, [user?.phoneNumber]);

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

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async () => {
    setEmailError('');
    setPhoneError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    // Validate phone number if provided
    const fullPhone = buildFullPhoneNumber();
    if (phoneLocal.trim() && !fullPhone) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    if (phoneLocal.trim() && !/^\+[1-9]\d{1,14}$/.test(fullPhone)) {
      setPhoneError('Phone number must be in E.164 format (e.g., +31612345678)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await userService.updateProfile({
        email: email.trim(),
        phoneNumber: phoneLocal.trim() ? fullPhone : undefined,
      });

      if (response.success && response.data) {
        updateUser({
          email: email.trim(),
          phoneNumber: phoneLocal.trim() ? fullPhone : undefined,
        });
        Alert.alert('Success', 'Account settings updated successfully');
        router.back();
      } else {
        const errorMsg = response.message || 'Could not update account settings';
        if (errorMsg.includes('Email already registered')) {
          setEmailError('Email already registered');
        } else if (errorMsg.includes('Phone number')) {
          setPhoneError(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Error updating account settings:', error);
      Alert.alert('Error', 'Something went wrong while updating your account settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <Pressable
            style={[styles.headerIconButton, isSubmitting && styles.headerIconButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Ionicons name="checkmark" size={24} color={COLORS.primary} />
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Email */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Email</Text>
            <GlassInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail-outline"
              textContentType="emailAddress"
              autoComplete="email"
              error={emailError}
            />
          </GlassCard>

          {/* Phone Number */}
          <GlassCard style={styles.inputCard} padding="lg">
            <Text style={styles.label}>Phone Number</Text>
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
                  onChangeText={(text) => {
                    setPhoneLocal(text);
                    if (phoneError) setPhoneError('');
                  }}
                  placeholder="612345678"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon="call-outline"
                  error={phoneError}
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

            <Text style={styles.hintText}>
              Select your country on the left and enter your phone number without the leading zero.
            </Text>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  inputCard: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.sm,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.background,
    height: 52,
    justifyContent: 'center',
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
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
});
