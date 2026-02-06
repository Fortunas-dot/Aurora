import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const DEFAULT_CORE_SIZE = width * 0.7;

interface AuroraCoreProps {
  state: 'idle' | 'listening' | 'speaking';
  audioLevel?: number;
  size?: number;
}

// Floating particle for ambient effect
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

  // Glow layers for the sphere effect
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  
  // Organic movement animations for tab bar
  const isSmall = size && size < 100;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const innerRotate = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Breathing/pulsing glow animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: isSmall ? 2500 : 3000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1.1,
            duration: isSmall ? 2500 : 3000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(glowOpacity, {
            toValue: 0.4,
            duration: isSmall ? 2500 : 3000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 0.95,
            duration: isSmall ? 2500 : 3000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
    
    // Organic floating movement (only for small sizes like tab bar)
    if (isSmall) {
      // Gentle vertical floating
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -2,
            duration: 2000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 2,
            duration: 2000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 2000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Subtle horizontal drift
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 1.5,
            duration: 3000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -1.5,
            duration: 3000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 3000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Slow continuous rotation
      Animated.loop(
        Animated.timing(rotateZ, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Inner gradient rotation (counter-rotation for depth)
      Animated.loop(
        Animated.timing(innerRotate, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isSmall]);
  
  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.timing(glowOpacity, {
        toValue: Math.min(1, 0.6 + audioLevel * 0.4),
        duration: 150,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state]);
  
  const sphereSize = CORE_SIZE * 0.7;
  const glowSize = CORE_SIZE * 0.85;
  const numParticles = size && size < 80 ? 4 : 6;

  const particles = useMemo(() =>
    Array.from({ length: numParticles }, (_, i) => (
      <FloatingParticle key={i} index={i} state={state} audioLevel={audioLevel} coreSize={CORE_SIZE} numParticles={numParticles} />
    )), [state, audioLevel, numParticles, CORE_SIZE]
  );

  const rotation = rotateZ.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const innerRotation = innerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  
  const innerHighlightRotation = innerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

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
              { translateY: isSmall ? translateY : 0 },
              { translateX: isSmall ? translateX : 0 },
              { rotateZ: isSmall ? rotation : '0deg' },
            ],
          },
        ]}
      >
      {/* Outer glow layer */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${COLORS.primary}40`,
            `${COLORS.primary}20`,
            `${COLORS.primary}10`,
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Middle glow layer */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: sphereSize * 1.15,
            height: sphereSize * 1.15,
            borderRadius: (sphereSize * 1.15) / 2,
            opacity: Animated.multiply(glowOpacity, 0.8),
            transform: [{ scale: Animated.multiply(glowScale, 0.98) }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${COLORS.primary}60`,
            `${COLORS.primary}30`,
            `${COLORS.primary}15`,
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Main sphere */}
      <Animated.View
        style={[
          styles.sphere,
          {
            width: sphereSize,
            height: sphereSize,
            borderRadius: sphereSize / 2,
            transform: [
              { scale: pulseScale },
              { rotateZ: isSmall ? innerRotation : '0deg' },
            ],
            opacity: state === 'speaking' ? 1 : state === 'listening' ? 0.95 : 0.9,
          },
        ]}
      >
        <LinearGradient
          colors={[
            '#FFFFFF',
            '#E0F2FE',
            COLORS.primary,
            '#1E3A5F',
            '#0F172A',
          ]}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0.8, y: 0.8 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Glowing edge */}
      <Animated.View
        style={[
          styles.glowEdge,
          {
            width: sphereSize,
            height: sphereSize,
            borderRadius: sphereSize / 2,
            borderWidth: Math.max(2, sphereSize * 0.02),
            opacity: glowOpacity,
            transform: [{ scale: Animated.multiply(pulseScale, 1.02) }],
          },
        ]}
      />

      {/* Inner highlight */}
      <Animated.View
        style={[
          styles.innerHighlight,
          {
            width: sphereSize * 0.4,
            height: sphereSize * 0.4,
            borderRadius: (sphereSize * 0.4) / 2,
            transform: [
              { scale: pulseScale },
              { rotateZ: isSmall ? innerHighlightRotation : '0deg' },
            ],
            opacity: state === 'speaking' ? 0.9 : state === 'listening' ? 0.7 : 0.6,
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#E0F2FE', 'transparent']}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0.7, y: 0.7 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Floating particles */}
      {particles}
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  glowLayer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  sphere: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  glowEdge: {
    position: 'absolute',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 15,
  },
  innerHighlight: {
    position: 'absolute',
    overflow: 'hidden',
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
