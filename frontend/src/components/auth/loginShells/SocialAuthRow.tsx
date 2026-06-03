import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useTranslation } from '../../../hooks/useTranslation';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../constants/theme';

type Props = {
  textColor?: string;
  mutedColor?: string;
  dividerColor?: string;
  /** Sheet background — used to softly tint pressed states on the white Google button. */
  surfaceColor?: string;
  style?: any;
  /** When true (default), labels show 'Continue with X'. When false, only icons (compact). */
  showLabels?: boolean;
};

export function SocialAuthRow({
  textColor = '#1F2937',
  mutedColor = '#6B7280',
  dividerColor = '#E5E7EB',
  surfaceColor = '#FFFFFF',
  style,
  showLabels = true,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { loginWithFacebook, loginWithGoogle, authSubmitting } = useAuthStore();

  const handleFacebook = async () => {
    const ok = await loginWithFacebook();
    if (ok) router.replace('/(tabs)');
  };

  const handleGoogle = async () => {
    const ok = await loginWithGoogle();
    if (ok) router.replace('/(tabs)');
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
        <Text style={[styles.dividerText, { color: mutedColor }]}>{t('or_continue_with')}</Text>
        <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
      </View>

      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.googleBtn,
            { borderColor: dividerColor },
            pressed && { backgroundColor: '#F8FAFC' },
          ]}
          onPress={handleGoogle}
          disabled={authSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('continue_with_google')}
        >
          {authSubmitting ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <>
              <GoogleGLogo size={18} />
              {showLabels && (
                <Text style={[styles.btnText, { color: '#3C4043' }]}>{t('continue_with_google')}</Text>
              )}
            </>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, styles.fbBtn, pressed && { backgroundColor: '#166FE5' }]}
          onPress={handleFacebook}
          disabled={authSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('continue_with_facebook')}
        >
          {authSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
              {showLabels && (
                <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{t('continue_with_facebook')}</Text>
              )}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Official Google "G" mark (4-color) per Google's Sign-In branding guidelines.
 * Inline SVG so we don't ship an extra asset.
 */
function GoogleGLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#34A853"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#FBBC05"
        d="M12.717 28.054C12.252 26.778 12 25.418 12 24s.252-2.778.71-4.054l-6.522-5.025C4.79 17.748 4 20.79 4 24s.79 6.252 2.188 9.079l6.529-5.025z"
      />
      <Path
        fill="#EA4335"
        d="M24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.227 4 9.505 8.444 6.188 14.921l6.529 5.025C14.381 15.317 18.798 12 24 12z"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: SPACING.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginHorizontal: SPACING.sm,
    textTransform: 'lowercase',
  },
  btnRow: {
    gap: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  fbBtn: {
    backgroundColor: '#1877F2',
  },
  btnText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
