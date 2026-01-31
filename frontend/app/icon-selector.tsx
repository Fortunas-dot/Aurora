import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../src/components/common';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/constants/theme';

const { width } = Dimensions.get('window');
const ICON_SIZE = 80;

// 1. AuroraCore (huidige)
const AuroraIcon = () => (
  <View style={styles.iconContainer}>
    <AuroraCore state="idle" audioLevel={0} size={ICON_SIZE} />
  </View>
);

// 2. Neural Network
const NeuralNetworkIcon = () => {
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const pulse = useRef(new Animated.Value(0.5)).current;
    const delay = i * 200;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const angle = (i / 6) * Math.PI * 2;
    const radius = ICON_SIZE * 0.3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    return { pulse, x, y };
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.neuralContainer}>
        {/* Center node */}
        <View style={[styles.neuralNode, { left: ICON_SIZE / 2 - 6, top: ICON_SIZE / 2 - 6 }]}>
          <LinearGradient
            colors={[COLORS.primary, '#60A5FA']}
            style={styles.neuralNodeGradient}
          />
        </View>
        {/* Outer nodes */}
        {nodes.map((node, i) => (
          <Animated.View
            key={i}
            style={[
              styles.neuralNode,
              {
                left: ICON_SIZE / 2 + node.x - 6,
                top: ICON_SIZE / 2 + node.y - 6,
                opacity: node.pulse,
                transform: [{ scale: node.pulse }],
              },
            ]}
          >
            <LinearGradient
              colors={['#60A5FA', COLORS.primary]}
              style={styles.neuralNodeGradient}
            />
          </Animated.View>
        ))}
        {/* Connection lines */}
        {nodes.map((node, i) => (
          <View
            key={`line-${i}`}
            style={[
              styles.neuralLine,
              {
                left: ICON_SIZE / 2,
                top: ICON_SIZE / 2,
                width: Math.sqrt(node.x * node.x + node.y * node.y),
                transform: [
                  { rotate: `${(Math.atan2(node.y, node.x) * 180) / Math.PI}deg` },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// 3. Circuit Board
const CircuitIcon = () => {
  const paths = [
    { delay: 0, duration: 2000 },
    { delay: 400, duration: 1800 },
    { delay: 800, duration: 2200 },
  ];

  const pathAnimations = paths.map((path) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(path.delay),
          Animated.timing(progress, {
            toValue: 1,
            duration: path.duration,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }, []);

    return progress;
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.circuitContainer}>
        {/* Circuit paths */}
        <View style={[styles.circuitPath, { top: ICON_SIZE * 0.2, left: ICON_SIZE * 0.1, width: ICON_SIZE * 0.8 }]} />
        <View style={[styles.circuitPath, { top: ICON_SIZE * 0.5, left: ICON_SIZE * 0.2, width: ICON_SIZE * 0.6 }]} />
        <View style={[styles.circuitPath, { top: ICON_SIZE * 0.8, left: ICON_SIZE * 0.15, width: ICON_SIZE * 0.7 }]} />
        {/* Circuit nodes */}
        {[0.2, 0.5, 0.8].map((pos, i) => (
          <Animated.View
            key={i}
            style={[
              styles.circuitNode,
              {
                left: ICON_SIZE * pos - 4,
                top: ICON_SIZE * 0.3 - 4,
                opacity: pathAnimations[i],
              },
            ]}
          />
        ))}
        {/* Data flow indicators */}
        {pathAnimations.map((anim, i) => (
          <Animated.View
            key={`flow-${i}`}
            style={[
              styles.circuitFlow,
              {
                left: ICON_SIZE * (0.1 + i * 0.3),
                top: ICON_SIZE * (0.2 + i * 0.3),
                opacity: anim,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// 4. Hologram Grid
const HologramIcon = () => {
  const gridOpacity = useRef(new Animated.Value(0.3)).current;
  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gridOpacity, {
          toValue: 0.6,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(gridOpacity, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scanY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ICON_SIZE],
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.hologramContainer}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pos) => (
          <Animated.View
            key={`h-${pos}`}
            style={[
              styles.hologramLine,
              {
                top: ICON_SIZE * pos,
                left: 0,
                width: ICON_SIZE,
                opacity: gridOpacity,
              },
            ]}
          />
        ))}
        {[0.25, 0.5, 0.75].map((pos) => (
          <Animated.View
            key={`v-${pos}`}
            style={[
              styles.hologramLine,
              {
                left: ICON_SIZE * pos,
                top: 0,
                height: ICON_SIZE,
                width: 1,
                opacity: gridOpacity,
              },
            ]}
          />
        ))}
        {/* Scan line */}
        <Animated.View
          style={[
            styles.hologramScan,
            {
              top: scanY,
              opacity: 0.8,
            },
          ]}
        />
        {/* Center core */}
        <View style={styles.hologramCore}>
          <LinearGradient
            colors={[COLORS.primary, 'transparent']}
            style={styles.hologramCoreGradient}
          />
        </View>
      </View>
    </View>
  );
};

// 5. Data Stream
const DataStreamIcon = () => {
  const streams = Array.from({ length: 4 }, (_, i) => {
    const translateY = useRef(new Animated.Value(-ICON_SIZE)).current;
    const delay = i * 300;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(translateY, {
            toValue: ICON_SIZE,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -ICON_SIZE,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return { translateY, x: (i / 4) * ICON_SIZE + ICON_SIZE / 8 };
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.streamContainer}>
        {streams.map((stream, i) => (
          <Animated.View
            key={i}
            style={[
              styles.streamBar,
              {
                left: stream.x - 2,
                transform: [{ translateY: stream.translateY }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primary, '#60A5FA', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.streamGradient}
            />
          </Animated.View>
        ))}
        {/* Center processing indicator */}
        <View style={styles.streamCenter}>
          <LinearGradient
            colors={[COLORS.primary, '#60A5FA']}
            style={styles.streamCenterGradient}
          />
        </View>
      </View>
    </View>
  );
};

// 6. Quantum Particles
const QuantumIcon = () => {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const orbit = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0.5)).current;
    const delay = i * 150;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(orbit, {
              toValue: 1,
              duration: 3000 + i * 200,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(pulse, {
                toValue: 1,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(pulse, {
                toValue: 0.3,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      ).start();
    }, []);

    const angle = (i / 8) * Math.PI * 2;
    const radius = ICON_SIZE * 0.3;
    const startX = Math.cos(angle) * radius;
    const startY = Math.sin(angle) * radius;
    const endX = Math.cos(angle + Math.PI) * radius;
    const endY = Math.sin(angle + Math.PI) * radius;

    const x = orbit.interpolate({
      inputRange: [0, 1],
      outputRange: [startX, endX],
    });
    const y = orbit.interpolate({
      inputRange: [0, 1],
      outputRange: [startY, endY],
    });

    return { x, y, pulse };
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.quantumContainer}>
        {/* Center nucleus */}
        <View style={styles.quantumNucleus}>
          <LinearGradient
            colors={[COLORS.primary, '#60A5FA']}
            style={styles.quantumNucleusGradient}
          />
        </View>
        {/* Orbiting particles */}
        {particles.map((particle, i) => (
          <Animated.View
            key={i}
            style={[
              styles.quantumParticle,
              {
                left: ICON_SIZE / 2 + particle.x - 4,
                top: ICON_SIZE / 2 + particle.y - 4,
                opacity: particle.pulse,
                transform: [{ scale: particle.pulse }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// 7. Hexagon Matrix
const HexagonIcon = () => {
  const hexagons = Array.from({ length: 7 }, (_, i) => {
    const glow = useRef(new Animated.Value(0.3)).current;
    const delay = i * 150;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(glow, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.3,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const positions = [
      { x: ICON_SIZE / 2, y: ICON_SIZE * 0.2 },
      { x: ICON_SIZE * 0.25, y: ICON_SIZE * 0.4 },
      { x: ICON_SIZE * 0.75, y: ICON_SIZE * 0.4 },
      { x: ICON_SIZE / 2, y: ICON_SIZE * 0.5 },
      { x: ICON_SIZE * 0.25, y: ICON_SIZE * 0.6 },
      { x: ICON_SIZE * 0.75, y: ICON_SIZE * 0.6 },
      { x: ICON_SIZE / 2, y: ICON_SIZE * 0.8 },
    ];

    return { glow, ...positions[i] };
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.hexagonContainer}>
        {hexagons.map((hex, i) => (
          <Animated.View
            key={i}
            style={[
              styles.hexagon,
              {
                left: hex.x - 12,
                top: hex.y - 12,
                opacity: hex.glow,
                transform: [{ scale: hex.glow }],
              },
            ]}
          >
            <View style={styles.hexagonInner} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// 8. AI Brain
const BrainIcon = () => {
  const nodes = Array.from({ length: 5 }, (_, i) => {
    const pulse = useRef(new Animated.Value(0.5)).current;
    const delay = i * 250;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const positions = [
      { x: ICON_SIZE * 0.3, y: ICON_SIZE * 0.3 },
      { x: ICON_SIZE * 0.7, y: ICON_SIZE * 0.3 },
      { x: ICON_SIZE / 2, y: ICON_SIZE * 0.5 },
      { x: ICON_SIZE * 0.25, y: ICON_SIZE * 0.7 },
      { x: ICON_SIZE * 0.75, y: ICON_SIZE * 0.7 },
    ];

    return { pulse, ...positions[i] };
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.brainContainer}>
        {/* Neural connections */}
        <View style={[styles.brainConnection, { left: ICON_SIZE * 0.3, top: ICON_SIZE * 0.3, width: ICON_SIZE * 0.4, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.brainConnection, { left: ICON_SIZE * 0.3, top: ICON_SIZE * 0.5, width: ICON_SIZE * 0.2, transform: [{ rotate: '-30deg' }] }]} />
        <View style={[styles.brainConnection, { left: ICON_SIZE * 0.5, top: ICON_SIZE * 0.3, width: ICON_SIZE * 0.25, transform: [{ rotate: '90deg' }] }]} />
        {/* Neural nodes */}
        {nodes.map((node, i) => (
          <Animated.View
            key={i}
            style={[
              styles.brainNode,
              {
                left: node.x - 6,
                top: node.y - 6,
                opacity: node.pulse,
                transform: [{ scale: node.pulse }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primary, '#60A5FA']}
              style={styles.brainNodeGradient}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// 9. Digital Pulse
const DigitalPulseIcon = () => {
  const rings = Array.from({ length: 3 }, (_, i) => {
    const scale = useRef(new Animated.Value(0.3)).current;
    const opacity = useRef(new Animated.Value(0.8)).current;
    const delay = i * 400;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.5,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0.3,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, []);

    return { scale, opacity };
  });

  return (
    <View style={styles.iconContainer}>
      <View style={styles.pulseContainer}>
        {rings.map((ring, i) => (
          <Animated.View
            key={i}
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: ring.scale }],
                opacity: ring.opacity,
              },
            ]}
          >
            <View style={styles.pulseRingInner} />
          </Animated.View>
        ))}
        {/* Center core */}
        <View style={styles.pulseCore}>
          <LinearGradient
            colors={[COLORS.primary, '#60A5FA']}
            style={styles.pulseCoreGradient}
          />
        </View>
      </View>
    </View>
  );
};

const ICON_OPTIONS = [
  { id: 'aurora', name: 'Aurora Core', component: AuroraIcon },
  { id: 'neural', name: 'Neural Network', component: NeuralNetworkIcon },
  { id: 'circuit', name: 'Circuit Board', component: CircuitIcon },
  { id: 'hologram', name: 'Hologram Grid', component: HologramIcon },
  { id: 'datastream', name: 'Data Stream', component: DataStreamIcon },
  { id: 'quantum', name: 'Quantum Particles', component: QuantumIcon },
  { id: 'hexagon', name: 'Hexagon Matrix', component: HexagonIcon },
  { id: 'brain', name: 'AI Brain', component: BrainIcon },
  { id: 'pulse', name: 'Digital Pulse', component: DigitalPulseIcon },
];

export default function IconSelector() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = React.useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    // Hier kun je later de keuze opslaan en toepassen op de tab bar
    console.log('Selected icon:', id);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Kies een icoon</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Selecteer een bewegend symbool voor de Aurora tab in de footer
        </Text>

        {ICON_OPTIONS.map((option) => {
          const IconComponent = option.component;
          const isSelected = selected === option.id;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              style={styles.optionCard}
            >
              <GlassCard
                style={[
                  styles.card,
                  isSelected && styles.selectedCard,
                ]}
                padding="lg"
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconWrapper}>
                    <IconComponent />
                  </View>
                  <Text style={[styles.optionName, isSelected && styles.selectedName]}>
                    {option.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </View>
              </GlassCard>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  optionCard: {
    marginBottom: SPACING.md,
  },
  card: {
    marginBottom: 0,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    marginLeft: SPACING.md,
  },
  selectedName: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Icon styles
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: ICON_SIZE / 2,
  },
  pulsingCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    overflow: 'hidden',
  },
  starGradient: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ICON_SIZE,
    gap: 4,
  },
  waveBar: {
    width: 8,
    borderRadius: 4,
  },
  spiralCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spiralInner: {
    width: ICON_SIZE * 0.5,
    height: ICON_SIZE * 0.5,
    borderRadius: ICON_SIZE * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  particleContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  particleCenter: {
    position: 'absolute',
    left: ICON_SIZE / 2 - 4,
    top: ICON_SIZE / 2 - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  glowCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 10,
  },
  sparkleContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  sparkleCenter: {
    position: 'absolute',
    left: ICON_SIZE / 2 - 6,
    top: ICON_SIZE / 2 - 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  // Neural Network styles
  neuralContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  neuralNode: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  neuralNodeGradient: {
    width: '100%',
    height: '100%',
  },
  neuralLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  // Circuit Board styles
  circuitContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  circuitPath: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.4,
  },
  circuitNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  circuitFlow: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
  },
  // Hologram styles
  hologramContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  hologramLine: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
  },
  hologramScan: {
    position: 'absolute',
    left: 0,
    width: ICON_SIZE,
    height: 2,
    backgroundColor: '#60A5FA',
  },
  hologramCore: {
    position: 'absolute',
    left: ICON_SIZE / 2 - 8,
    top: ICON_SIZE / 2 - 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  hologramCoreGradient: {
    width: '100%',
    height: '100%',
  },
  // Data Stream styles
  streamContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  streamBar: {
    position: 'absolute',
    width: 4,
    height: ICON_SIZE * 0.6,
    borderRadius: 2,
    overflow: 'hidden',
  },
  streamGradient: {
    width: '100%',
    height: '100%',
  },
  streamCenter: {
    position: 'absolute',
    left: ICON_SIZE / 2 - 6,
    top: ICON_SIZE / 2 - 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  streamCenterGradient: {
    width: '100%',
    height: '100%',
  },
  // Quantum styles
  quantumContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  quantumNucleus: {
    position: 'absolute',
    left: ICON_SIZE / 2 - 8,
    top: ICON_SIZE / 2 - 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantumNucleusGradient: {
    width: '100%',
    height: '100%',
  },
  quantumParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
  // Hexagon styles
  hexagonContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  hexagon: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexagonInner: {
    width: 20,
    height: 20,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  // Brain styles
  brainContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: 'relative',
  },
  brainConnection: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  brainNode: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  brainNodeGradient: {
    width: '100%',
    height: '100%',
  },
  // Pulse styles
  pulseContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRingInner: {
    width: ICON_SIZE * 0.8,
    height: ICON_SIZE * 0.8,
    borderRadius: (ICON_SIZE * 0.8) / 2,
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  pulseCore: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pulseCoreGradient: {
    width: '100%',
    height: '100%',
  },
});

