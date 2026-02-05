import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const DEFAULT_CORE_SIZE = width * 0.7;
const NUM_BLOBS = 6;
const NUM_PARTICLES = 10;

interface AuroraCoreProps {
  state: 'idle' | 'listening' | 'speaking';
  audioLevel?: number;
  size?: number;
}

// Organic blob - elongated ellipse that moves and rotates
const OrganicBlob = ({ 
  index, 
  state,
  audioLevel,
  config,
  coreSize,
}: { 
  index: number; 
  state: string; 
  audioLevel: number;
  config: {
    width: number;
    height: number;
    color: string;
    opacity: number;
    offsetX: number;
    offsetY: number;
  };
  coreSize: number;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(config.opacity)).current;
  const translateX = useRef(new Animated.Value(config.offsetX)).current;
  const translateY = useRef(new Animated.Value(config.offsetY)).current;

  useEffect(() => {
    const isSmall = coreSize < 100;
    const baseDuration = isSmall ? 8000 + index * 1000 : 12000 + index * 1500;
    const smoothEasing = Easing.bezier(0.4, 0.0, 0.2, 1.0);

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 1.15,
            duration: baseDuration,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 0.9,
            duration: baseDuration,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 1.0,
            duration: baseDuration * 0.3,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 1.0,
            duration: baseDuration * 0.3,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 0.9,
            duration: baseDuration,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 1.15,
            duration: baseDuration,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 1.0,
            duration: baseDuration * 0.3,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 1.0,
            duration: baseDuration * 0.3,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    const rotationSpeed = isSmall 
      ? (state === 'speaking' ? 15000 : state === 'listening' ? 20000 : 40000)
      : (state === 'speaking' ? 20000 : state === 'listening' ? 30000 : 50000);
    
    const rotationDirection = index % 2 === 0 ? 1 : -1;
    Animated.loop(
      Animated.timing(rotation, {
        toValue: rotationDirection,
        duration: rotationSpeed + index * (isSmall ? 3000 : 5000),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const driftAmount = isSmall ? 6 + index * 1.5 : 12 + index * 3;
    const driftDuration = isSmall ? 6000 + index * 800 : 8000 + index * 1200;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: config.offsetX + driftAmount * Math.sin(index * 0.7),
          duration: driftDuration,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: config.offsetX,
          duration: driftDuration * 0.4,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: config.offsetX - driftAmount * Math.sin(index * 0.7),
          duration: driftDuration,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: config.offsetX,
          duration: driftDuration * 0.4,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: config.offsetY + driftAmount * Math.cos(index * 0.5),
          duration: driftDuration * 1.1,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: config.offsetY,
          duration: driftDuration * 0.44,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: config.offsetY - driftAmount * Math.cos(index * 0.5),
          duration: driftDuration * 1.1,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: config.offsetY,
          duration: driftDuration * 0.44,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const breathDuration = isSmall ? 5000 + index * 600 : 7000 + index * 1000;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: breathDuration,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: breathDuration * 0.3,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.94,
          duration: breathDuration,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: breathDuration * 0.3,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [state, coreSize]);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      const boost = audioLevel * 0.3;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: Math.min(1, config.opacity + boost),
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1 + audioLevel * 0.15,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [audioLevel, state]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-360deg', '0deg', '360deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: config.width,
          height: config.height,
          borderRadius: Math.max(config.width, config.height) / 2,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
            { scaleX },
            { scaleY },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[config.color, `${config.color}88`, `${config.color}22`, 'transparent']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

// Floating particle
const FloatingParticle = ({ 
  index, 
  state, 
  audioLevel,
  coreSize,
  numParticles,
}: { 
  index: number; 
  state: string; 
  audioLevel: number;
  coreSize: number;
  numParticles: number;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const angle = (index / numParticles) * Math.PI * 2;
  const baseRadius = coreSize * 0.32;
  const x = Math.cos(angle) * baseRadius;
  const y = Math.sin(angle) * baseRadius;

  useEffect(() => {
    const isSmall = coreSize < 100;
    const duration = isSmall ? 4000 + index * 500 : 6000 + index * 800;
    const amplitude = isSmall ? 8 + index * 1.2 : 15 + index * 2;
    const smoothEasing = Easing.bezier(0.4, 0.0, 0.2, 1.0);
    
    translateX.setValue(0);
    translateY.setValue(0);
    
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: amplitude * Math.sin(angle * 2 + index),
            duration: duration,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration * 0.5,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -amplitude * Math.sin(angle * 2 + index),
            duration: duration,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration * 0.5,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: amplitude * Math.cos(angle * 3 + index),
            duration: duration * 1.1,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration * 0.55,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -amplitude * Math.cos(angle * 3 + index),
            duration: duration * 1.1,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration * 0.55,
            easing: smoothEasing,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    const opacityDuration = isSmall ? 2500 + index * 200 : 3500 + index * 300;
    const currentOpacity = opacity._value || 0.4;
    opacity.setValue(currentOpacity);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: opacityDuration,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: opacityDuration * 0.5,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: opacityDuration,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: opacityDuration * 0.5,
          easing: smoothEasing,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [coreSize]);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.timing(scale, {
        toValue: 1 + audioLevel * 1.2,
        duration: 120,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state]);

  const size = Math.max(2, (coreSize / DEFAULT_CORE_SIZE) * (5 + (index % 4) * 3));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: coreSize / 2 + x - size / 2,
          top: coreSize / 2 + y - size / 2,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    />
  );
};

export const AuroraCore: React.FC<AuroraCoreProps> = ({
  state,
  audioLevel = 0,
  size,
}) => {
  const CORE_SIZE = size || DEFAULT_CORE_SIZE;
  const containerScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetScale = state === 'speaking' ? 1.08 : state === 'listening' ? 1.04 : 1;

    Animated.timing(containerScale, {
      toValue: targetScale,
      duration: 400,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
      useNativeDriver: true,
    }).start();
  }, [state]);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.timing(pulseScale, {
        toValue: 1 + audioLevel * 0.12,
        duration: 150,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(pulseScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state]);

  const numBlobs = size && size < 80 ? 4 : NUM_BLOBS;
  const numParticles = size && size < 80 ? 6 : NUM_PARTICLES;
  
  const blobConfigs = useMemo(() => {
    const configs = [
      { width: CORE_SIZE * 0.7, height: CORE_SIZE * 0.55, color: '#0F172A', opacity: 0.95, offsetX: -5, offsetY: 8 },
      { width: CORE_SIZE * 0.6, height: CORE_SIZE * 0.7, color: '#1E3A5F', opacity: 0.85, offsetX: 10, offsetY: -5 },
      { width: CORE_SIZE * 0.55, height: CORE_SIZE * 0.48, color: COLORS.primary, opacity: 0.7, offsetX: -8, offsetY: -10 },
      { width: CORE_SIZE * 0.5, height: CORE_SIZE * 0.58, color: '#60A5FA', opacity: 0.6, offsetX: 12, offsetY: 5 },
      { width: CORE_SIZE * 0.42, height: CORE_SIZE * 0.38, color: '#93C5FD', opacity: 0.5, offsetX: -6, offsetY: 8 },
      { width: CORE_SIZE * 0.32, height: CORE_SIZE * 0.35, color: '#BFDBFE', opacity: 0.7, offsetX: 3, offsetY: -3 },
    ];
    return configs.slice(0, numBlobs);
  }, [CORE_SIZE, numBlobs]);

  const blobs = useMemo(() => 
    blobConfigs.map((config, i) => (
      <OrganicBlob
        key={i}
        index={i}
        state={state}
        audioLevel={audioLevel}
        config={config}
        coreSize={CORE_SIZE}
      />
    )), [state, audioLevel, blobConfigs, CORE_SIZE]
  );

  const particles = useMemo(() =>
    Array.from({ length: numParticles }, (_, i) => (
      <FloatingParticle key={i} index={i} state={state} audioLevel={audioLevel} coreSize={CORE_SIZE} numParticles={numParticles} />
    )), [state, audioLevel, numParticles, CORE_SIZE]
  );

  return (
      <Animated.View
        style={[
          {
            width: CORE_SIZE,
            height: CORE_SIZE,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [
            { scale: Animated.multiply(containerScale, pulseScale) },
            ],
          },
        ]}
      >
      {/* Organic blobs */}
      {blobs}

      {/* Central bright core */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: CORE_SIZE * 0.22,
            height: CORE_SIZE * 0.22,
            borderRadius: CORE_SIZE * 0.11,
            overflow: 'hidden',
            transform: [{ scale: pulseScale }],
            opacity: state === 'speaking' ? 1 : state === 'listening' ? 0.9 : 0.75,
          }
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#E0F2FE', '#93C5FD', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Inner spark */}
      {CORE_SIZE >= 50 && (
        <Animated.View
          style={[
            styles.spark,
            {
              width: Math.max(4, CORE_SIZE * 0.03),
              height: Math.max(4, CORE_SIZE * 0.03),
              borderRadius: Math.max(2, CORE_SIZE * 0.015),
              transform: [{ scale: Animated.add(pulseScale, audioLevel * 0.3) }],
            },
          ]}
        />
      )}

      {/* Floating particles */}
      {particles}
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    overflow: 'hidden',
  },
  spark: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(191, 219, 254, 0.95)',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
