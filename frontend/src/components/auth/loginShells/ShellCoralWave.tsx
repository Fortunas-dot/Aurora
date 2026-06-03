import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../constants/theme';
import type { ShellProps } from './shellTypes';
import loginCoralHero from '../../../../assets/images/login-coral-hero.png';
import { SocialAuthRow } from './SocialAuthRow';

/** Hero: `frontend/assets/images/login-coral-hero.png` — swap file + import to change. */
export const CORAL_LOGIN_HERO_IMAGE: ImageSourcePropType = loginCoralHero;

/** Taller than the hero band so `resizeMode="cover"` can pan vertically inside the clip. */
const HERO_IMAGE_HEIGHT_FACTOR = 1.88;
/**
 * Negative `top` moves the image view up; the hero clips from above, so the visible band shows a
 * lower slice of the photo (use a larger magnitude to show more of the bottom of the asset).
 */
const HERO_IMAGE_TOP_OFFSET_FACTOR = -0.78;

/** Height of the SVG that draws the wavy transition from hero into the sheet */
const WAVE_SVG_H = 56;
/** How far the sheet overlaps upward into the hero so the wave sits on the coral */
const WAVE_OVERLAP = 34;

/** Filled white path: wavy top edge, flat bottom — matches “soft wave” sheet tops */
function coralSheetWavePath(width: number, svgHeight: number): string {
  const w = width;
  const h = svgHeight;
  // y values are “wave” undulations along the top (higher y = lower on screen)
  const y0 = 14;
  const y1 = 28;
  const y2 = 12;
  const y3 = 32;
  const y4 = 18;
  const y5 = 26;
  return [
    `M 0 ${y0}`,
    `C ${w * 0.12} ${y2}, ${w * 0.28} ${y1}, ${w * 0.42} ${y3}`,
    `S ${w * 0.58} ${y4}, ${w * 0.72} ${y1}`,
    `S ${w * 0.88} ${y2}, ${w} ${y5}`,
    `L ${w} ${h}`,
    `L 0 ${h}`,
    'Z',
  ].join(' ');
}

function CoralWaveTop({ width, fill }: { width: number; fill: string }) {
  const d = coralSheetWavePath(width, WAVE_SVG_H);
  return (
    <Svg
      width={width}
      height={WAVE_SVG_H}
      style={styles.waveSvg}
      pointerEvents="none"
    >
      <Path d={d} fill={fill} />
    </Svg>
  );
}

function CoralHeroArt({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Path
        d={`M0 ${height * 0.22} C ${width * 0.2} ${height * 0.08}, ${width * 0.35} ${height * 0.32}, ${width * 0.5} ${height * 0.18} S ${width * 0.85} ${height * 0.28}, ${width} ${height * 0.12}`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.5}
        fill="none"
      />
      <Path
        d={`M0 ${height * 0.42} C ${width * 0.25} ${height * 0.3}, ${width * 0.45} ${height * 0.55}, ${width * 0.65} ${height * 0.38} S ${width * 0.9} ${height * 0.48}, ${width} ${height * 0.35}`}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1.2}
        fill="none"
      />
      <Path
        d={`M0 ${height * 0.62} Q ${width * 0.3} ${height * 0.52} ${width * 0.55} ${height * 0.68} T ${width} ${height * 0.58}`}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1}
        fill="none"
      />
      <Path
        d={`M0 ${height * 0.78} Q ${width * 0.35} ${height * 0.68} ${width * 0.7} ${height * 0.82} T ${width} ${height * 0.72}`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

export function ShellCoralWave(p: ShellProps) {
  const insets = useSafeAreaInsets();
  const {
    primary,
    primaryLight,
    primaryDark,
    secondary,
    background,
    text,
    textMuted,
    textSecondary,
    error: errorColor,
    glass,
  } = p.colors;
  const { width: winW, height: winH } = useMemo(() => Dimensions.get('window'), []);
  /** Share of window height for the hero image band (sheet + wave sit below). */
  const heroH = Math.round(winH * 0.46);

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const hero = (
    <View style={[styles.hero, { width: winW, height: heroH }]}>
      {CORAL_LOGIN_HERO_IMAGE ? (
        <Image
          source={CORAL_LOGIN_HERO_IMAGE}
          style={{
            position: 'absolute',
            left: 0,
            width: winW,
            height: Math.round(heroH * HERO_IMAGE_HEIGHT_FACTOR),
            top: Math.round(heroH * HERO_IMAGE_TOP_OFFSET_FACTOR),
          }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient
          colors={[primaryLight, primary, secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          <CoralHeroArt width={winW} height={heroH} />
        </LinearGradient>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { width: winW, minHeight: winH, backgroundColor: background }]}>
      {hero}

      <View
        style={[
          styles.sheet,
          {
            width: winW,
            flex: 1,
            backgroundColor: background,
            marginTop: -WAVE_OVERLAP,
            paddingBottom: insets.bottom + SPACING.md,
            paddingHorizontal: SPACING.xl,
            paddingTop: SPACING.lg + 4,
          },
        ]}
      >
        <CoralWaveTop width={winW} fill={background} />

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: text }]}>{p.t('sign_in_heading')}</Text>
          <View style={[styles.titleAccent, { backgroundColor: primary }]} />
        </View>

        <Text style={[styles.fieldLabel, { color: textMuted }]}>{p.t('email_label')}</Text>
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={20} color={textMuted} style={styles.inputIcon} />
          <TextInput
            value={p.email}
            onChangeText={p.setEmail}
            placeholder="you@example.com"
            placeholderTextColor={textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="username"
            returnKeyType="next"
            style={[styles.input, { color: text }]}
            selectionColor={primary}
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={[styles.inputLine, { backgroundColor: glass.border }]} />

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: textMuted }]}>
          {p.t('password_label')}
        </Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color={textMuted} style={styles.inputIcon} />
          <TextInput
            value={p.password}
            onChangeText={p.setPassword}
            placeholder={p.t('password_label')}
            placeholderTextColor={textMuted}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={p.onSubmit}
            style={[styles.input, styles.inputFlex, { color: text }]}
            selectionColor={primary}
            underlineColorAndroid="transparent"
          />
          <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={12} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={textMuted} />
          </Pressable>
        </View>
        <View style={[styles.inputLine, { backgroundColor: glass.border }]} />

        {p.displayError ? <Text style={[styles.error, { color: errorColor }]}>{p.displayError}</Text> : null}

        <View style={styles.rowBetween}>
          <Pressable style={styles.rememberRow} onPress={() => setRememberMe((v) => !v)} hitSlop={8}>
            <View
              style={[
                styles.checkbox,
                { backgroundColor: background, borderColor: glass.border },
                rememberMe && { backgroundColor: primary, borderColor: primary },
              ]}
            >
              {rememberMe ? <View style={styles.checkboxDot} /> : null}
            </View>
            <Text style={[styles.rememberText, { color: text }]}>{p.t('remember_me')}</Text>
          </Pressable>
          <Pressable onPress={() => p.router.push('/forgot-password')} hitSlop={8}>
            <Text style={[styles.forgotLink, { color: primary }]}>{p.t('forgot_password')}</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.loginBtn,
            { backgroundColor: primaryDark },
            pressed && { opacity: 0.92 },
          ]}
          onPress={p.onSubmit}
          disabled={p.authSubmitting}
        >
          {p.authSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginBtnText}>{p.t('log_in')}</Text>
          )}
        </Pressable>

        <SocialAuthRow textColor={text} mutedColor={textMuted} dividerColor={glass.border} />

        <View style={styles.footer}>
          <Text style={[styles.footerMuted, { color: textSecondary }]}>{p.t('no_account')}</Text>
          <Pressable onPress={() => p.router.push('/(auth)/register')} hitSlop={8}>
            <Text style={[styles.footerAccent, { color: primary }]}>{p.t('sign_up')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'visible',
  },
  hero: {
    overflow: 'hidden',
  },
  sheet: {
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  waveSvg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -WAVE_SVG_H + 2,
    zIndex: 2,
  },
  titleBlock: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  titleAccent: {
    width: 52,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldLabelSpaced: {
    marginTop: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    paddingHorizontal: 0,
  },
  inputFlex: {
    paddingRight: SPACING.sm,
  },
  eyeBtn: {
    padding: SPACING.xs,
  },
  inputLine: {
    height: 1,
    marginTop: 4,
  },
  error: {
    ...TYPOGRAPHY.small,
    marginTop: SPACING.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  rememberText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },
  forgotLink: {
    ...TYPOGRAPHY.bodyMedium,
  },
  loginBtn: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  loginBtnText: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: 4,
  },
  footerMuted: {
    ...TYPOGRAPHY.body,
  },
  footerAccent: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
});
