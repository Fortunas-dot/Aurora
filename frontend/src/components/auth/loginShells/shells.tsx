import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuroraCore } from '../../voice/AuroraCore';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../constants/theme';
import type { LoginScreenVariant } from '../../../constants/loginScreenVariant';
import { LoginFormBlock } from './LoginFormBlock';
import type { ShellProps } from './shellTypes';
import { ShellCoralWave } from './ShellCoralWave';

const { height: SCREEN_H } = Dimensions.get('window');

/** Teal accent from the reference minimalist outdoor auth UI */
const SUMMIT_TEAL = '#4FD1D9';

function SummitSilhouette() {
  return (
    <View style={styles.summitSilhouette} pointerEvents="none">
      <View
        style={[
          styles.summitTriangle,
          {
            left: '-18%',
            borderLeftWidth: 120,
            borderRightWidth: 120,
            borderBottomWidth: 260,
            borderBottomColor: '#060e18',
          },
        ]}
      />
      <View
        style={[
          styles.summitTriangle,
          {
            left: '14%',
            borderLeftWidth: 150,
            borderRightWidth: 150,
            borderBottomWidth: 230,
            borderBottomColor: '#0a1422',
          },
        ]}
      />
      <View
        style={[
          styles.summitTriangle,
          {
            left: '44%',
            borderLeftWidth: 110,
            borderRightWidth: 110,
            borderBottomWidth: 300,
            borderBottomColor: '#040a12',
          },
        ]}
      />
      <View
        style={[
          styles.summitTriangle,
          {
            right: '-12%',
            borderLeftWidth: 100,
            borderRightWidth: 100,
            borderBottomWidth: 250,
            borderBottomColor: '#071018',
          },
        ]}
      />
    </View>
  );
}

function MeshOrbs() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(a, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a]);

  const o1 = a.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.38] });
  const o2 = a.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.1] });
  const o3 = a.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.32] });

  return (
    <>
      <Animated.View style={[styles.orb, styles.orb1, { opacity: o1 }]} />
      <Animated.View style={[styles.orb, styles.orb2, { opacity: o2 }]} />
      <Animated.View style={[styles.orb, styles.orb3, { opacity: o3 }]} />
      <Animated.View style={[styles.orb, styles.orb4, { opacity: o2 }]} />
    </>
  );
}

function PulseRing({ delay }: { delay: number }) {
  const s = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(s, {
          toValue: 1,
          duration: 2800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(s, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, s]);

  const scale = s.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.14] });
  /** Brighter peak and a short plateau so the sweep reads clearly */
  const opacity = s.interpolate({
    inputRange: [0, 0.22, 0.42, 0.62, 1],
    outputRange: [0, 0.75, 0.92, 0.55, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export function ShellAuroraGlass({ colors, ...p }: ShellProps) {
  return (
    <LinearGradient colors={[...colors.backgroundGradient]} style={styles.fillFlex}>
      <View style={styles.headerCenter}>
        <View style={styles.logoWrap}>
          <AuroraCore state="idle" audioLevel={0} size={180} />
        </View>
        <Text style={[styles.titleCenter, { color: colors.text }]}>{p.t('login_welcome_back')}</Text>
        <Text style={[styles.subCenter, { color: colors.textSecondary }]}>{p.t('login_subtitle')}</Text>
      </View>
      <LoginFormBlock {...p} />
    </LinearGradient>
  );
}

export function ShellPrismSplit({ colors, ...p }: ShellProps) {
  return (
    <LinearGradient colors={['#050816', '#121a3a', '#1a0f2e']} style={styles.fillFlex}>
      <View style={styles.prismSlab} pointerEvents="none" />
      <View style={styles.prismGlow} pointerEvents="none" />

      <View style={styles.prismHeader}>
        <View style={styles.prismBadge}>
          <Ionicons name="planet-outline" size={18} color={colors.primary} />
          <Text style={[styles.prismBadgeText, { color: colors.textSecondary }]}>Aurora</Text>
        </View>
        <Text style={[styles.prismTitle, { color: colors.text }]}>{p.t('login_welcome_back')}</Text>
        <Text style={[styles.prismSub, { color: colors.textMuted }]}>{p.t('login_subtitle')}</Text>
      </View>

      <LoginFormBlock
        {...p}
        cardStyle={{
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.22)',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.25,
          shadowRadius: 24,
          elevation: Platform.OS === 'android' ? 12 : 0,
        }}
      />
    </LinearGradient>
  );
}

export function ShellNocturneBloom({ colors, ...p }: ShellProps) {
  return (
    <LinearGradient colors={['#030510', '#14082a', '#071a28']} style={styles.fillFlex}>
      <View style={[styles.nocturneBackdrop, { minHeight: SCREEN_H }]} pointerEvents="none">
        <MeshOrbs />
        <LinearGradient
          colors={['transparent', 'rgba(96,165,250,0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.nocturneHeader}>
        <Text style={[styles.nocturneEyebrow, { color: colors.primary }]}>Sign in</Text>
        <Text style={[styles.nocturneTitle, { color: colors.text }]}>{p.t('login_welcome_back')}</Text>
        <Text style={[styles.nocturneSub, { color: colors.textMuted }]}>{p.t('login_subtitle')}</Text>
      </View>

      <LoginFormBlock {...p} />
    </LinearGradient>
  );
}

export function ShellHorizonSweep({ colors, ...p }: ShellProps) {
  return (
    <View style={styles.horizonWrap}>
      <LinearGradient
        colors={['#0f2847', '#4c1d95', '#312e81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.horizonHero}
      >
        <View style={styles.horizonBlobA} />
        <View style={styles.horizonBlobB} />
        <Text style={styles.horizonBrand}>AURORA</Text>
        <Text style={styles.horizonHeroTitle}>{p.t('login_welcome_back')}</Text>
        <Text style={styles.horizonHeroSub}>{p.t('login_subtitle')}</Text>
      </LinearGradient>

      <View style={[styles.horizonSheet, { borderColor: colors.glass.border }]}>
        <View style={styles.horizonHandle} />
        <LoginFormBlock {...p} cardStyle={{ marginBottom: 0 }} />
      </View>
    </View>
  );
}

function CornerBracket({ edge }: { edge: 'tl' | 'tr' | 'bl' | 'br' }) {
  const w = 22;
  const t = 2;
  const arm = 14;
  const color = 'rgba(96, 165, 250, 0.55)';
  if (edge === 'tl') {
    return (
      <View style={[styles.bracket, { top: 0, left: 0 }]}>
        <View style={{ width: w, height: t, backgroundColor: color }} />
        <View style={{ width: t, height: arm, backgroundColor: color }} />
      </View>
    );
  }
  if (edge === 'tr') {
    return (
      <View style={[styles.bracket, { top: 0, right: 0, alignItems: 'flex-end' }]}>
        <View style={{ width: w, height: t, backgroundColor: color }} />
        <View style={{ width: t, height: arm, backgroundColor: color, alignSelf: 'flex-end' }} />
      </View>
    );
  }
  if (edge === 'bl') {
    return (
      <View style={[styles.bracket, { bottom: 0, left: 0 }]}>
        <View style={{ width: t, height: arm, backgroundColor: color }} />
        <View style={{ width: w, height: t, backgroundColor: color }} />
      </View>
    );
  }
  return (
    <View style={[styles.bracket, { bottom: 0, right: 0, alignItems: 'flex-end' }]}>
      <View style={{ width: t, height: arm, backgroundColor: color, alignSelf: 'flex-end' }} />
      <View style={{ width: w, height: t, backgroundColor: color }} />
    </View>
  );
}

export function ShellCipherFrame({ colors, ...p }: ShellProps) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = Dimensions.get('window');

  return (
    <View style={[styles.cipherScreenRoot, { width: winW, minHeight: winH }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={['#04060c', '#0a1020', '#060912']} style={StyleSheet.absoluteFill} />
        <View style={StyleSheet.absoluteFill}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={`cv-${i}`} style={[styles.gridLineV, { left: `${8 + i * 12}%` }]} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={`ch-${i}`} style={[styles.gridLineH, { top: `${10 + i * 16}%` }]} />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.cipherForeground,
          {
            paddingTop: insets.top + SPACING.xxl + SPACING.md,
            paddingBottom: insets.bottom + SPACING.lg,
            paddingHorizontal: SPACING.lg,
          },
        ]}
      >
        <PulseRing delay={0} />
        <PulseRing delay={1400} />

        <View style={styles.cipherTop}>
          <Text style={styles.cipherMono}>AURORA</Text>
          <Text style={[styles.cipherHeadline, { color: colors.text }]}>{p.t('login_welcome_back')}</Text>
          <Text style={[styles.cipherSub, { color: colors.textMuted }]}>{p.t('login_subtitle')}</Text>
        </View>

        <View style={styles.cipherFrame}>
          <CornerBracket edge="tl" />
          <CornerBracket edge="tr" />
          <CornerBracket edge="bl" />
          <CornerBracket edge="br" />
          <View style={styles.cipherOrbWrap} pointerEvents="none">
            <AuroraCore state="idle" audioLevel={0} size={100} />
          </View>
          <LoginFormBlock
            {...p}
            cardStyle={StyleSheet.flatten([
              { backgroundColor: 'rgba(8,12,22,0.72)', borderWidth: 0 },
              styles.cipherFormClearOrb,
            ])}
          />
        </View>

        <View style={styles.cipherRegisterRow}>
          <Text style={[styles.cipherRegisterText, { color: colors.textSecondary }]}>{p.t('no_account')}</Text>
          <Pressable onPress={() => p.router.push('/(auth)/register')} hitSlop={8}>
            <Text style={[styles.cipherRegisterLink, { color: colors.primary }]}>{p.t('register_link')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function ShellSummitLine(p: ShellProps) {
  return (
    <View style={styles.summitRoot}>
      <LinearGradient
        colors={['#3d5a80', '#1e3348', '#0f1c2c']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
        style={styles.summitGlowBehindMoon}
        pointerEvents="none"
      />
      <SummitSilhouette />
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
        locations={[0, 0.45, 1]}
        style={[StyleSheet.absoluteFill, { minHeight: SCREEN_H }]}
        pointerEvents="none"
      />

      <View style={styles.summitMoonWrap} pointerEvents="none">
        <View style={styles.summitMoonHalo} />
        <View style={styles.summitMoon} />
      </View>

      <View style={styles.summitContent}>
        <Text style={styles.summitTitle}>{p.t('login_summit_title')}</Text>

        <Text style={styles.summitLabel}>{p.t('email_label')}</Text>
        <TextInput
          value={p.email}
          onChangeText={p.setEmail}
          placeholder={p.t('email_label')}
          placeholderTextColor="rgba(255,255,255,0.35)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username"
          returnKeyType="next"
          style={styles.summitInput}
          selectionColor={SUMMIT_TEAL}
          underlineColorAndroid="transparent"
        />

        <Text style={[styles.summitLabel, styles.summitLabelAfterField]}>{p.t('password_label')}</Text>
        <TextInput
          value={p.password}
          onChangeText={p.setPassword}
          placeholder={p.t('password_label')}
          placeholderTextColor="rgba(255,255,255,0.35)"
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          returnKeyType="go"
          onSubmitEditing={p.onSubmit}
          style={styles.summitInput}
          selectionColor={SUMMIT_TEAL}
          underlineColorAndroid="transparent"
        />

        {p.displayError ? <Text style={styles.summitError}>{p.displayError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.summitCircleBtn,
            { opacity: pressed || p.authSubmitting ? 0.85 : 1 },
          ]}
          onPress={p.onSubmit}
          disabled={p.authSubmitting}
          accessibilityRole="button"
          accessibilityLabel={p.t('log_in')}
        >
          {p.authSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
          )}
        </Pressable>

        <View style={styles.summitFooter}>
          <Pressable onPress={() => p.router.push('/(auth)/register')} hitSlop={10}>
            <Text style={styles.summitFooterText}>{p.t('login_summit_new_account')}</Text>
          </Pressable>
          <Pressable onPress={() => p.router.push('/forgot-password')} hitSlop={10}>
            <Text style={styles.summitFooterText}>{p.t('login_summit_forgot')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function renderLoginShell(variant: LoginScreenVariant, props: ShellProps) {
  switch (variant) {
    case 'aurora_glass':
      return <ShellAuroraGlass {...props} />;
    case 'prism_split':
      return <ShellPrismSplit {...props} />;
    case 'nocturne_bloom':
      return <ShellNocturneBloom {...props} />;
    case 'horizon_sweep':
      return <ShellHorizonSweep {...props} />;
    case 'cipher_frame':
      return <ShellCipherFrame {...props} />;
    case 'summit_line':
      return <ShellSummitLine {...props} />;
    case 'coral_wave':
      return <ShellCoralWave {...props} />;
    default:
      return <ShellAuroraGlass {...props} />;
  }
}

const styles = StyleSheet.create({
  fillFlex: {
    flex: 1,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  headerCenter: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoWrap: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenter: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subCenter: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  prismSlab: {
    position: 'absolute',
    width: '120%',
    height: 220,
    top: -40,
    right: -80,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    transform: [{ rotate: '-8deg' }],
    borderRadius: BORDER_RADIUS.xl,
  },
  prismGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -60,
    left: -80,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  prismHeader: {
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  prismBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: SPACING.md,
  },
  prismBadgeText: {
    ...TYPOGRAPHY.captionMedium,
    letterSpacing: 0.6,
  },
  prismTitle: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  prismSub: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
    maxWidth: 320,
  },
  nocturneBackdrop: {
    ...StyleSheet.absoluteFillObject,
    left: -SPACING.lg,
    right: -SPACING.lg,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 220,
    height: 220,
    top: '8%',
    right: '-12%',
    backgroundColor: 'rgba(167, 139, 250, 0.5)',
  },
  orb2: {
    width: 180,
    height: 180,
    bottom: '18%',
    left: '-8%',
    backgroundColor: 'rgba(96, 165, 250, 0.45)',
  },
  orb3: {
    width: 120,
    height: 120,
    top: '42%',
    left: '12%',
    backgroundColor: 'rgba(94, 234, 212, 0.35)',
  },
  orb4: {
    width: 100,
    height: 100,
    top: '28%',
    right: '18%',
    backgroundColor: 'rgba(244, 114, 182, 0.25)',
  },
  nocturneHeader: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  nocturneEyebrow: {
    ...TYPOGRAPHY.captionMedium,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  nocturneTitle: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  nocturneSub: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  horizonWrap: {
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: '#0A0E1A',
    position: 'relative',
  },
  horizonHero: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  horizonBlobA: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -30,
    right: -20,
  },
  horizonBlobB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(94, 234, 212, 0.2)',
    bottom: 20,
    left: 40,
  },
  horizonBrand: {
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 6,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  horizonHeroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    maxWidth: 300,
  },
  horizonHeroSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  horizonSheet: {
    marginTop: -SPACING.xl,
    backgroundColor: 'rgba(10, 14, 26, 0.94)',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  horizonHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: SPACING.md,
  },
  cipherScreenRoot: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  cipherForeground: {
    position: 'relative',
    zIndex: 1,
  },
  cipherRegisterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  cipherRegisterText: {
    ...TYPOGRAPHY.body,
  },
  cipherRegisterLink: {
    ...TYPOGRAPHY.bodyMedium,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.06)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ring: {
    position: 'absolute',
    alignSelf: 'center',
    top: '22%',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.75)',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 8,
  },
  cipherTop: {
    marginBottom: SPACING.lg,
    marginTop: 0,
  },
  cipherMono: {
    color: 'rgba(96, 165, 250, 0.85)',
    letterSpacing: 8,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  cipherHeadline: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  cipherSub: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  cipherFrame: {
    position: 'relative',
    padding: SPACING.md,
  },
  cipherOrbWrap: {
    position: 'absolute',
    top: SPACING.sm,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  cipherFormClearOrb: {
    marginTop: 108,
  },
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    zIndex: 2,
  },
  summitRoot: {
    flex: 1,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    minHeight: SCREEN_H * 0.72,
  },
  summitSilhouette: {
    ...StyleSheet.absoluteFillObject,
    top: '38%',
  },
  summitTriangle: {
    position: 'absolute',
    bottom: -36,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  summitGlowBehindMoon: {
    position: 'absolute',
    top: '10%',
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    left: '50%',
    marginLeft: -100,
    opacity: 0.5,
  },
  summitMoonWrap: {
    position: 'absolute',
    top: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  summitMoonHalo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summitMoon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(252, 252, 255, 0.94)',
    marginTop: 26,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
  summitContent: {
    flex: 1,
    zIndex: 2,
    paddingTop: 200,
    paddingBottom: SPACING.md,
  },
  summitTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  summitLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '400',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  summitLabelAfterField: {
    marginTop: SPACING.lg,
  },
  summitInput: {
    color: '#FFFFFF',
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: SUMMIT_TEAL,
    backgroundColor: 'transparent',
  },
  summitError: {
    color: '#fecaca',
    fontSize: 13,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  summitCircleBtn: {
    marginTop: SPACING.xl,
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: SUMMIT_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SUMMIT_TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  summitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.md,
  },
  summitFooterText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
});
