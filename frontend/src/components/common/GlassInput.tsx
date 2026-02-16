import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface GlassInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  textContentType?: 'none' | 'username' | 'password' | 'emailAddress' | 'newPassword' | 'oneTimeCode' | 'telephoneNumber' | 'name' | 'familyName' | 'givenName' | 'streetAddressLine1' | 'streetAddressLine2' | 'addressCity' | 'addressState' | 'postalCode' | 'countryName' | 'creditCardNumber' | 'organizationName' | 'jobTitle' | 'URL';
  autoComplete?: 'off' | 'username' | 'password' | 'email' | 'name' | 'tel' | 'street-address' | 'postal-code' | 'cc-number' | 'cc-csc' | 'cc-exp' | 'cc-exp-month' | 'cc-exp-year';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  passwordRules?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  textContentType,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  passwordRules,
  onBlur,
  onFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry && !rightIcon;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.container,
          multiline && styles.containerMultiline,
          isFocused && styles.containerFocused,
          error && styles.containerError,
          !editable && styles.containerDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textMuted}
            style={styles.icon}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          textContentType={textContentType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          passwordRules={passwordRules}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) {
              onFocus();
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) {
              onBlur();
            }
          }}
          style={[
            styles.input,
            !multiline && styles.inputSingleLine,
            multiline && styles.inputMultiline,
            icon && styles.inputWithIcon,
            (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
            inputStyle,
          ]}
        />

        {showPasswordToggle && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
        )}

        {rightIcon && !showPasswordToggle && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      
      {maxLength && (
        <Text style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    minHeight: 52,
  },
  containerFocused: {
    backgroundColor: COLORS.glass.background,
    borderColor: COLORS.primary,
  },
  containerError: {
    borderColor: COLORS.error,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  containerMultiline: {
    alignItems: 'flex-start',
    paddingTop: SPACING.sm,
  },
  icon: {
    marginLeft: SPACING.md,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    fontWeight: '400' as const,
  },
  inputSingleLine: {
    height: 52,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: Platform.OS === 'android' ? 20 : 20,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingVertical: SPACING.md,
  },
  inputWithIcon: {
    paddingLeft: SPACING.sm,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.sm,
  },
  rightIconContainer: {
    padding: SPACING.md,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
    marginRight: SPACING.xs,
  },
});

