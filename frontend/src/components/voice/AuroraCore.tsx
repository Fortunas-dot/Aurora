import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CORE_SIZE = width * 0.7;
const NUM_BLOBS = 6;
const NUM_PARTICLES = 10;

interface AuroraCoreProps {
  state: 'idle' | 'listening' | 'speaking';
  audioLevel?: number;
}

// Organic blob - elongated ellipse that moves and rotates
const OrganicBlob = ({ 
  index, 
  state,
  audioLevel,
  config,
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
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(config.opacity)).current;
  const translateX = useRef(new Animated.Value(config.offsetX)).current;
  const translateY = useRef(new Animated.Value(config.offsetY)).current;

  useEffect(() => {
    const baseDuration = 3000 + index * 600;
    const delay = index * 300;

    // Organic squishing animation (scaleX vs scaleY)
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 1.15,
            duration: baseDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 0.9,
            duration: baseDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 0.9,
            duration: baseDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 1.15,
            duration: baseDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Rotation
    const rotationSpeed = state === 'speaking' ? 6000 : state === 'listening' ? 10000 : 18000;
    Animated.loop(
      Animated.timing(rotation, {
        toValue: index % 2 === 0 ? 1 : -1,
        duration: rotationSpeed + index * 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Floating drift
    const driftAmount = 12 + index * 3;
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: config.offsetX + driftAmount * Math.sin(index * 0.7),
          duration: 2500 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: config.offsetX - driftAmount * Math.sin(index * 0.7),
          duration: 2500 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: config.offsetY + driftAmount * Math.cos(index * 0.5),
          duration: 2800 + index * 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: config.offsetY - driftAmount * Math.cos(index * 0.5),
          duration: 2800 + index * 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Breathing scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
          toValue: 1.08,
          duration: 2200 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 2200 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [state]);

  // Audio reactive
  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      const boost = audioLevel * 0.3;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: Math.min(1, config.opacity + boost),
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1 + audioLevel * 0.15,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [audioLevel, state]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-360deg', '0deg', '360deg'],
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
  audioLevel 
}: { 
  index: number; 
  state: string; 
  audioLevel: number;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const angle = (index / NUM_PARTICLES) * Math.PI * 2;
  const baseRadius = CORE_SIZE * 0.32;
  const x = Math.cos(angle) * baseRadius;
  const y = Math.sin(angle) * baseRadius;

  useEffect(() => {
    const duration = 1800 + Math.random() * 1500;
    const amplitude = 15 + Math.random() * 10;
    
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: amplitude * Math.sin(angle * 2 + index),
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -amplitude * Math.sin(angle * 2 + index),
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: amplitude * Math.cos(angle * 3 + index),
            duration: duration * 1.1,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -amplitude * Math.cos(angle * 3 + index),
            duration: duration * 1.1,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.9,
          duration: 1000 + index * 80,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
          toValue: 0.15,
          duration: 1000 + index * 80,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
  }, []);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.timing(scale, {
        toValue: 1 + audioLevel * 1.2,
        duration: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state]);

  const size = 5 + (index % 4) * 3;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: CORE_SIZE / 2 + x - size / 2,
          top: CORE_SIZE / 2 + y - size / 2,
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
}) => {
  const containerScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetScale = state === 'speaking' ? 1.08 : state === 'listening' ? 1.04 : 1;

    Animated.spring(containerScale, {
        toValue: targetScale,
      tension: 40,
      friction: 7,
        useNativeDriver: true,
      }).start();
  }, [state]);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.timing(pulseScale, {
        toValue: 1 + audioLevel * 0.12,
        duration: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state]);

  // Blob configurations - different sizes, positions, colors for organic look
  const blobConfigs = useMemo(() => [
    { width: CORE_SIZE * 0.7, height: CORE_SIZE * 0.55, color: '#0F172A', opacity: 0.95, offsetX: -5, offsetY: 8 },
    { width: CORE_SIZE * 0.6, height: CORE_SIZE * 0.7, color: '#1E3A5F', opacity: 0.85, offsetX: 10, offsetY: -5 },
    { width: CORE_SIZE * 0.55, height: CORE_SIZE * 0.48, color: COLORS.primary, opacity: 0.7, offsetX: -8, offsetY: -10 },
    { width: CORE_SIZE * 0.5, height: CORE_SIZE * 0.58, color: '#60A5FA', opacity: 0.6, offsetX: 12, offsetY: 5 },
    { width: CORE_SIZE * 0.42, height: CORE_SIZE * 0.38, color: '#93C5FD', opacity: 0.5, offsetX: -6, offsetY: 8 },
    { width: CORE_SIZE * 0.32, height: CORE_SIZE * 0.35, color: '#BFDBFE', opacity: 0.7, offsetX: 3, offsetY: -3 },
  ], []);

  const blobs = useMemo(() => 
    blobConfigs.map((config, i) => (
      <OrganicBlob
        key={i}
        index={i}
        state={state}
        audioLevel={audioLevel}
        config={config}
      />
    )), [state, audioLevel, blobConfigs]
  );

  const particles = useMemo(() =>
    Array.from({ length: NUM_PARTICLES }, (_, i) => (
      <FloatingParticle key={i} index={i} state={state} audioLevel={audioLevel} />
    )), [state, audioLevel]
  );

  return (
      <Animated.View
        style={[
        styles.container,
          {
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
          styles.centerCore,
          {
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
      <Animated.View
        style={[
          styles.spark,
          {
            transform: [{ scale: Animated.add(pulseScale, audioLevel * 0.3) }],
          },
        ]}
      />

      {/* Floating particles */}
      {particles}
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    overflow: 'hidden',
  },
  centerCore: {
    position: 'absolute',
    width: CORE_SIZE * 0.22,
    height: CORE_SIZE * 0.22,
    borderRadius: CORE_SIZE * 0.11,
    overflow: 'hidden',
  },
  spark: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
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
