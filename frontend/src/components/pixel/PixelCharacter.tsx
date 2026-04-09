import React, { useState, useMemo } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import { PixelCharacterConfig } from '../../constants/pixelCharacterOptions';
import { buildHabboImageUrl } from '../../utils/habboFigure';

// ═══════════════════════════════════════════════════════════════
// HABBO CHARACTER — Real Habbo Avatar via Imaging API
//
// Renders a real Habbo character PNG from the official imaging
// API. The component builds a figure string from our config,
// fetches the pre-rendered sprite, and displays it.
//
// Props:
//   config    — PixelCharacterConfig (colors, hair style)
//   size      — pixel width (height auto-scales)
//   direction — 0-7 (Habbo compass direction, default 2)
//   action    — 'std' | 'wlk' | 'sit' | 'wav'
//   gesture   — 'std' | 'sml' | 'agr' | 'sad'
// ═══════════════════════════════════════════════════════════════

interface PixelCharacterProps {
  config: PixelCharacterConfig;
  size?: number;
  direction?: number;
  action?: 'std' | 'wlk' | 'sit' | 'wav';
  gesture?: 'std' | 'sml' | 'agr' | 'sad' | 'srp' | 'spk';
}

const PixelCharacter = React.memo(
  function PixelCharacter({
    config,
    size = 64,
    direction = 2,
    action = 'std',
    gesture = 'std',
  }: PixelCharacterProps) {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    const imageUrl = useMemo(
      () => buildHabboImageUrl({ config, direction, action, gesture, size: 'l' }),
      [
        config.gender,
        config.skinColor,
        config.hairStyle,
        config.hairColor,
        config.eyeColor,
        config.shirtStyle,
        config.shirtColor,
        config.pantsStyle,
        config.pantsColor,
        config.shoeStyle,
        config.shoeColor,
        direction,
        action,
        gesture,
      ],
    );

    // Habbo imaging API returns ~110px wide images for size=l
    // We scale to desired size while maintaining aspect ratio
    const width = size;
    const height = Math.round(size * 1.85); // Habbo avatar aspect ratio ~1:1.85

    return (
      <View style={[styles.container, { width, height }]}>
        {/* Loading indicator */}
        {!loaded && !errored && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
          </View>
        )}

        {/* Actual Habbo avatar image */}
        {!errored && (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, { width, height }]}
            resizeMode="contain"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}

        {/* Fallback: colored silhouette if API fails */}
        {errored && (
          <FallbackAvatar config={config} width={width} height={height} />
        )}
      </View>
    );
  },
  (prev, next) =>
    prev.size === next.size &&
    prev.direction === next.direction &&
    prev.action === next.action &&
    prev.gesture === next.gesture &&
    prev.config.gender === next.config.gender &&
    prev.config.skinColor === next.config.skinColor &&
    prev.config.hairStyle === next.config.hairStyle &&
    prev.config.hairColor === next.config.hairColor &&
    prev.config.eyeColor === next.config.eyeColor &&
    prev.config.shirtStyle === next.config.shirtStyle &&
    prev.config.shirtColor === next.config.shirtColor &&
    prev.config.pantsStyle === next.config.pantsStyle &&
    prev.config.pantsColor === next.config.pantsColor &&
    prev.config.shoeStyle === next.config.shoeStyle &&
    prev.config.shoeColor === next.config.shoeColor,
);

export default PixelCharacter;

// ═══════════════════════════════════════════════════════════════
// FALLBACK — simple colored silhouette if API is unreachable
// ═══════════════════════════════════════════════════════════════

function FallbackAvatar({
  config,
  width,
  height,
}: {
  config: PixelCharacterConfig;
  width: number;
  height: number;
}) {
  const headH = Math.round(height * 0.45);
  const bodyH = Math.round(height * 0.30);
  const legH = height - headH - bodyH;

  return (
    <View style={[styles.fallback, { width, height }]}>
      {/* Head */}
      <View
        style={[
          styles.fallbackHead,
          {
            width: Math.round(width * 0.65),
            height: headH,
            backgroundColor: config.skinColor,
            borderRadius: Math.round(width * 0.12),
          },
        ]}
      >
        {/* Hair cap */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: Math.round(headH * 0.45),
            backgroundColor: config.hairColor,
            borderTopLeftRadius: Math.round(width * 0.12),
            borderTopRightRadius: Math.round(width * 0.12),
          }}
        />
        {/* Eyes */}
        <View style={styles.fallbackEyes}>
          <View style={[styles.fallbackEye, { backgroundColor: config.eyeColor }]} />
          <View style={[styles.fallbackEye, { backgroundColor: config.eyeColor }]} />
        </View>
      </View>
      {/* Body */}
      <View
        style={{
          width: Math.round(width * 0.55),
          height: bodyH,
          backgroundColor: config.shirtColor,
          borderRadius: 2,
        }}
      />
      {/* Legs */}
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <View
          style={{
            width: Math.round(width * 0.22),
            height: legH,
            backgroundColor: config.pantsColor,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
          }}
        />
        <View
          style={{
            width: Math.round(width * 0.22),
            height: legH,
            backgroundColor: config.pantsColor,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fallbackHead: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallbackEyes: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  fallbackEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
