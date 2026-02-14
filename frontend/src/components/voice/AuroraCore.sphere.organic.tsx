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

// Organic floating particle with more natural movement
const OrganicParticle = ({ 
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
  const translateZ = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const angle = (index / numParticles) * Math.PI * 2;
  const baseRadius = coreSize * 0.35;
  const x = Math.cos(angle) * baseRadius;
  const y = Math.sin(angle) * baseRadius;

  useEffect(() => {
    const isSmall = coreSize < 100;
    // More varied durations for organic feel
    const duration1 = isSmall ? 3000 + index * 400 : 5000 + index * 600;
    const duration2 = isSmall ? 3500 + index * 500 : 5500 + index * 700;
    const duration3 = isSmall ? 4000 + index * 600 : 6000 + index * 800;
    
    const amplitude1 = isSmall ? 12 + index * 1.5 : 20 + index * 2.5;
    const amplitude2 = isSmall ? 10 + index * 1.2 : 18 + index * 2;
    const amplitude3 = isSmall ? 8 + index * 1 : 15 + index * 1.8;
    
    const organicEasing = Easing.bezier(0.25, 0.46, 0.45, 0.94); // More natural easing
    
    // Complex 3D-like movement
    Animated.loop(
      Animated.parallel([
        // X-axis organic movement
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: amplitude1 * Math.sin(angle * 2.3 + index * 0.5),
            duration: duration1,
            easing: organicEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -amplitude1 * Math.sin(angle * 2.3 + index * 0.5),
            duration: duration1 * 1.2,
            easing: organicEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration1 * 0.8,
            easing: organicEasing,
            useNativeDriver: true,
          }),
        ]),
        // Y-axis organic movement (out of phase)
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: amplitude2 * Math.cos(angle * 2.7 + index * 0.7),
            duration: duration2,
            easing: organicEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -amplitude2 * Math.cos(angle * 2.7 + index * 0.7),
            duration: duration2 * 1.1,
            easing: organicEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration2 * 0.9,
            easing: organicEasing,
            useNativeDriver: true,
          }),
        ]),
        // Z-axis (scale) for depth
        Animated.sequence([
          Animated.timing(translateZ, {
            toValue: amplitude3 * 0.3,
            duration: duration3,
            easing: organicEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateZ, {
            toValue: -amplitude3 * 0.3,
            duration: duration3 * 1.15,
            easing: organicEasing,
            useNativeDriver: true,
          }),
          Animated.timing(translateZ, {
            toValue: 0,
            duration: duration3 * 0.85,
            easing: organicEasing,
            useNativeDriver: true,
          }),
        ]),
        // Continuous rotation
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: (isSmall ? 4000 : 6000) + index * 500,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ])
    ).start();

    // Breathing opacity
    const opacityDuration = isSmall ? 2000 + index * 250 : 3000 + index * 400;
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: opacityDuration,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: opacityDuration * 0.6,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: opacityDuration * 0.8,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: opacityDuration * 0.6,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [coreSize]);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1 + audioLevel * 1.5,
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: Math.min(1, 0.5 + audioLevel * 0.5),
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 200,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [audioLevel, state]);

  const particleSize = Math.max(3, (coreSize / DEFAULT_CORE_SIZE) * (6 + (index % 5) * 2));
  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particleSize,
          height: particleSize,
          borderRadius: particleSize / 2,
          left: coreSize / 2 + x - particleSize / 2,
          top: coreSize / 2 + y - particleSize / 2,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale: Animated.multiply(scale, Animated.add(1, Animated.multiply(translateZ, 0.1))) },
            { rotate: rotation },
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
  const breatheScale = useRef(new Animated.Value(1)).current;

  // More responsive state changes
  useEffect(() => {
    const targetScale = state === 'speaking' ? 1.12 : state === 'listening' ? 1.06 : 1;

    Animated.spring(containerScale, {
      toValue: targetScale,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [state]);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.spring(pulseScale, {
        toValue: 1 + audioLevel * 0.15,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(pulseScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state]);

  // Continuous breathing animation (always active)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheScale, {
          toValue: 1.03,
          duration: 2500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 0.98,
          duration: 2500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Multiple glow layers with different animations
  const glowOpacity1 = useRef(new Animated.Value(0.7)).current;
  const glowOpacity2 = useRef(new Animated.Value(0.5)).current;
  const glowScale1 = useRef(new Animated.Value(1)).current;
  const glowScale2 = useRef(new Animated.Value(1)).current;
  
  // Organic floating movement (even when idle)
  const isSmall = size && size < 100;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const wobbleX = useRef(new Animated.Value(0)).current;
  const wobbleY = useRef(new Animated.Value(0)).current;
  const innerRotate = useRef(new Animated.Value(0)).current;
  const gradientRotate = useRef(new Animated.Value(0)).current;
  
  // Initialize wobble values to 0 to prevent null transforms
  useEffect(() => {
    wobbleX.setValue(0);
    wobbleY.setValue(0);
  }, []);
  
  useEffect(() => {
    // Breathing/pulsing glow animations (out of phase)
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity1, {
              toValue: 0.9,
              duration: isSmall ? 2800 : 3200,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
            Animated.timing(glowScale1, {
              toValue: 1.12,
              duration: isSmall ? 2800 : 3200,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(glowOpacity1, {
              toValue: 0.5,
              duration: isSmall ? 2800 : 3200,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
            Animated.timing(glowScale1, {
              toValue: 0.96,
              duration: isSmall ? 2800 : 3200,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity2, {
              toValue: 0.7,
              duration: isSmall ? 3000 : 3500,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
            Animated.timing(glowScale2, {
              toValue: 1.08,
              duration: isSmall ? 3000 : 3500,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(glowOpacity2, {
              toValue: 0.4,
              duration: isSmall ? 3000 : 3500,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
            Animated.timing(glowScale2, {
              toValue: 0.94,
              duration: isSmall ? 3000 : 3500,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    ).start();
    
    // Organic floating movement (always active, more pronounced)
    if (isSmall) {
      // Gentle vertical floating
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -3,
            duration: 2500,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 3,
            duration: 2500,
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
            toValue: 2,
            duration: 3500,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -2,
            duration: 3500,
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
    } else {
      // Larger spheres get subtle wobble
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(wobbleX, {
              toValue: 1,
              duration: 4000,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(wobbleX, {
              toValue: -1,
              duration: 4000,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(wobbleX, {
              toValue: 0,
              duration: 3000,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(wobbleY, {
              toValue: 1,
              duration: 4500,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(wobbleY, {
              toValue: -1,
              duration: 4500,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(wobbleY, {
              toValue: 0,
              duration: 3500,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
    
    // Slow continuous rotation
    Animated.loop(
      Animated.timing(rotateZ, {
        toValue: 1,
        duration: isSmall ? 10000 : 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Inner gradient rotation (counter-rotation for depth)
    Animated.loop(
      Animated.timing(innerRotate, {
        toValue: 1,
        duration: isSmall ? 18000 : 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Gradient rotation for color flow
    Animated.loop(
      Animated.timing(gradientRotate, {
        toValue: 1,
        duration: isSmall ? 12000 : 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [isSmall]);
  
  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      Animated.parallel([
        Animated.timing(glowOpacity1, {
          toValue: Math.min(1, 0.7 + audioLevel * 0.3),
          duration: 120,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity2, {
          toValue: Math.min(1, 0.5 + audioLevel * 0.5),
          duration: 120,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [audioLevel, state]);
  
  const sphereSize = CORE_SIZE * 0.72;
  const glowSize1 = CORE_SIZE * 0.9;
  const glowSize2 = CORE_SIZE * 0.75;
  const numParticles = size && size < 80 ? 8 : 12;

  const particles = useMemo(() =>
    Array.from({ length: numParticles }, (_, i) => (
      <OrganicParticle key={i} index={i} state={state} audioLevel={audioLevel} coreSize={CORE_SIZE} numParticles={numParticles} />
    )), [state, audioLevel, numParticles, CORE_SIZE]
  );

  // Create interpolated values with useMemo to ensure they're always defined
  // Initialize with default values to prevent null errors
  const rotation = useMemo(() => {
    try {
      return rotateZ.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });
    } catch {
      return '0deg' as any;
    }
  }, [rotateZ]);
  
  const innerRotation = useMemo(() => {
    try {
      return innerRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg'],
      });
    } catch {
      return '0deg' as any;
    }
  }, [innerRotate]);
  
  const innerHighlightRotation = useMemo(() => {
    try {
      return innerRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      });
    } catch {
      return '0deg' as any;
    }
  }, [innerRotate]);
  
  const gradientRotation = useMemo(() => {
    try {
      return gradientRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });
    } catch {
      return '0deg' as any;
    }
  }, [gradientRotate]);
  
  // Build transform array safely - filter out any null values
  // Interpolated values can be null before first render, so we need to handle this
  const baseTransforms: any[] = [
    { scale: Animated.multiply(Animated.multiply(containerScale, pulseScale), breatheScale) },
    { translateY: isSmall ? translateY : Animated.multiply(wobbleY, 2) },
    { translateX: isSmall ? translateX : Animated.multiply(wobbleX, 2) },
  ];
  
  // Only add rotateZ if rotation is valid (not null/undefined)
  // Use rotation for both small and large spheres to avoid null issues
  // Filter out any transforms with null values
  const transformArray = baseTransforms.filter(transform => {
    const values = Object.values(transform);
    return values.every(val => val != null);
  });
  
  // Add rotateZ only if rotation is valid
  if (rotation != null && typeof rotation !== 'undefined') {
    transformArray.push({ rotateZ: rotation });
  }

  return (
    <Animated.View
      style={[
        {
          width: CORE_SIZE,
          height: CORE_SIZE,
          justifyContent: 'center',
          alignItems: 'center',
          transform: transformArray,
        },
      ]}
    >
      {/* Outer glow layer 1 */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: glowSize1,
            height: glowSize1,
            borderRadius: glowSize1 / 2,
            opacity: glowOpacity1,
            transform: [{ scale: glowScale1 }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${COLORS.primary}50`,
            `${COLORS.primary}30`,
            `${COLORS.primary}15`,
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Outer glow layer 2 */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: glowSize2,
            height: glowSize2,
            borderRadius: glowSize2 / 2,
            opacity: glowOpacity2,
            transform: [{ scale: glowScale2 }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${COLORS.primary}70`,
            `${COLORS.primary}40`,
            `${COLORS.primary}20`,
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Main sphere with gradient rotation */}
      <Animated.View
        style={[
          styles.sphere,
          {
            width: sphereSize,
            height: sphereSize,
            borderRadius: sphereSize / 2,
            transform: [
              { scale: Animated.multiply(pulseScale, breatheScale) },
              ...(isSmall && innerRotation != null ? [{ rotateZ: innerRotation }] : []),
              ...(!isSmall && gradientRotation != null ? [{ rotateZ: gradientRotation }] : []),
            ].filter(t => {
              const values = Object.values(t);
              return values.every(val => val != null);
            }),
            opacity: state === 'speaking' ? 1 : state === 'listening' ? 0.97 : 0.95,
          },
        ]}
      >
        <LinearGradient
          colors={[
            '#FFFFFF',
            '#E0F2FE',
            '#93C5FD',
            COLORS.primary,
            '#3B82F6',
            '#1E40AF',
            '#0F172A',
          ]}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Glowing edge with pulse */}
      <Animated.View
        style={[
          styles.glowEdge,
          {
            width: sphereSize,
            height: sphereSize,
            borderRadius: sphereSize / 2,
            borderWidth: Math.max(2, sphereSize * 0.025),
            opacity: Animated.multiply(glowOpacity1, 0.9),
            transform: [{ scale: Animated.multiply(Animated.multiply(pulseScale, breatheScale), 1.03) }],
          },
        ]}
      />

      {/* Inner highlight with rotation */}
      <Animated.View
        style={[
          styles.innerHighlight,
          {
            width: sphereSize * 0.45,
            height: sphereSize * 0.45,
            borderRadius: (sphereSize * 0.45) / 2,
            transform: [
              { scale: Animated.multiply(pulseScale, breatheScale) },
              ...(isSmall && innerHighlightRotation != null ? [{ rotateZ: innerHighlightRotation }] : []),
              ...(!isSmall && gradientRotation != null ? [{ rotateZ: gradientRotation }] : []),
            ].filter(t => {
              const values = Object.values(t);
              return values.every(val => val != null);
            }),
            opacity: state === 'speaking' ? 0.95 : state === 'listening' ? 0.75 : 0.65,
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#E0F2FE', '#BFDBFE', 'transparent']}
          start={{ x: 0.25, y: 0.25 }}
          end={{ x: 0.75, y: 0.75 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Secondary inner highlight */}
      <Animated.View
        style={[
          styles.innerHighlight,
          {
            width: sphereSize * 0.25,
            height: sphereSize * 0.25,
            borderRadius: (sphereSize * 0.25) / 2,
            transform: [
              { scale: Animated.multiply(pulseScale, breatheScale) },
              ...(isSmall && innerRotation != null ? [{ rotateZ: innerRotation }] : []),
              ...(!isSmall && gradientRotation != null ? [{ rotateZ: Animated.multiply(gradientRotation, -1) }] : []),
            ].filter(t => {
              const values = Object.values(t);
              return values.every(val => val != null);
            }),
            opacity: state === 'speaking' ? 0.8 : state === 'listening' ? 0.6 : 0.5,
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', 'rgba(224, 242, 254, 0.8)', 'transparent']}
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
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 25,
  },
  glowEdge: {
    position: 'absolute',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 20,
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
    shadowRadius: 10,
    elevation: 6,
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
