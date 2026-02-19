import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, KeyboardAvoidingView, Platform, Pressable, Animated, Dimensions, Easing, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageList } from '../src/components/chat/MessageList';
import { ChatInput } from '../src/components/chat/ChatInput';
import { ContextIndicator } from '../src/components/chat/ContextIndicator';
import { useStreamingResponse } from '../src/hooks/useStreamingResponse';
import { useChatHistory } from '../src/hooks/useChatHistory';
import { useChatStore } from '../src/store/chatStore';
import { useAuthStore } from '../src/store/authStore';
import { journalService } from '../src/services/journal.service';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { useTheme } from '../src/hooks/useTheme';
import { useConsentStore } from '../src/store/consentStore';
import { AiConsentCard } from '../src/components/legal/AiConsentCard';

const { width, height } = Dimensions.get('window');

// Animated star component for background
const AnimatedStar = ({ index }: { index: number }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;
  const speed = 20 + Math.random() * 30;
  const direction = Math.random() * Math.PI * 2;
  const distance = 30 + Math.random() * 50;

  useEffect(() => {
    const duration = 3000 + Math.random() * 4000;

    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: Math.cos(direction) * distance,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: Math.sin(direction) * distance,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.1,
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3 + Math.random() * 0.4,
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 0.5,
              duration: duration * 0.6,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.6,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${initialX}%`,
          top: `${initialY}%`,
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

export default function TextChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { sendMessage, isLoading } = useStreamingResponse();
  const { clearHistory, isLoading: isLoadingHistory } = useChatHistory();
  const { messages, isStreaming, error, setError, clearMessages, setAvailableContext, availableContext } = useChatStore();
  const { aiConsentStatus, loadConsent, grantAiConsent, denyAiConsent } = useConsentStore();
  const [isFinishingSession, setIsFinishingSession] = useState(false);
  
  // Animation for Aurora logo transition
  const auroraScale = useRef(new Animated.Value(1)).current;
  const auroraOpacity = useRef(new Animated.Value(1)).current;
  const starsOpacity = useRef(new Animated.Value(0)).current;
  
  // Floating Aurora animation when messages exist
  const floatingAuroraX = useRef(new Animated.Value(width * 0.2)).current;
  const floatingAuroraY = useRef(new Animated.Value(height * 0.3)).current;
  const floatingAuroraOpacity = useRef(new Animated.Value(0.15)).current; // Low opacity for readability
  
  // Bioluminescent border glow effects
  const [borderGlows, setBorderGlows] = useState<Array<{
    id: number;
    side: 'top' | 'bottom' | 'left' | 'right';
    position: number;
    opacity: Animated.Value;
  }>>([]);
  const glowIdRef = useRef(0);
  
  const hasMessages = messages.length > 0;
  const [showMenu, setShowMenu] = useState(false);
  
  // Typewriter effect for initial greeting
  const initialGreeting = "Hi, this is Aurora, how are you feeling today?";
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Typewriter effect when screen opens (only if no messages)
  useEffect(() => {
    if (!hasMessages && !isTyping) {
      setIsTyping(true);
      setDisplayedText('');
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex < initialGreeting.length) {
          setDisplayedText(initialGreeting.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, 30); // 30ms per character for smooth typing
      
      return () => clearInterval(typeInterval);
    } else if (hasMessages) {
      // If messages exist, show full text immediately
      setDisplayedText(initialGreeting);
    }
  }, [hasMessages]);
  
  // Load consent + context information on mount to show on initial screen
  useEffect(() => {
    loadConsent().catch(console.error);

    const loadContext = async () => {
      if (!user) return;
      
      try {
        // Load journal context
        const journalResponse = await journalService.getAuroraContext(5);
        const journalContext = journalResponse.success && journalResponse.data ? journalResponse.data : [];
        
        // Check for health info
        const hasHealthInfo = !!(user?.healthInfo && (
          (user.healthInfo.mentalHealth && user.healthInfo.mentalHealth.length > 0) ||
          (user.healthInfo.physicalHealth && user.healthInfo.physicalHealth.length > 0) ||
          (user.healthInfo.medications && user.healthInfo.medications.length > 0) ||
          (user.healthInfo.therapies && user.healthInfo.therapies.length > 0)
        ));
        const hasJournalEntries = journalContext.length > 0;
        
        // Set context info for display on initial screen
        if (hasHealthInfo || hasJournalEntries) {
          setAvailableContext({
            hasHealthInfo,
            hasJournalEntries,
          });
        }
      } catch (error) {
        console.log('Could not load context:', error);
      }
    };

    loadContext();
  }, [user, setAvailableContext, loadConsent]);
  
  // Initialize animations on mount - always start with large Aurora
  useEffect(() => {
    // Always start with large Aurora visible (no messages initially)
    auroraScale.setValue(1);
    auroraOpacity.setValue(1);
    starsOpacity.setValue(0);
  }, []); // Only run on mount

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: () => setError(null),
        },
      ]);
    }
  }, [error, setError]);

  // Animate Aurora logo and stars based on message state
  useEffect(() => {
    if (hasMessages) {
      // Shrink Aurora and fade in stars
      Animated.parallel([
        Animated.timing(auroraScale, {
          toValue: 0.15, // Much smaller
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auroraOpacity, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(starsOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAuroraOpacity, {
          toValue: 0.15, // Low opacity for readability
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Expand Aurora and fade out stars
      Animated.parallel([
        Animated.timing(auroraScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auroraOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(starsOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAuroraOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasMessages]);

  // Helper function to create border glow effect
  const createBorderGlow = useCallback((side: 'top' | 'bottom' | 'left' | 'right', position: number) => {
    const id = glowIdRef.current++;
    const opacity = new Animated.Value(0);
    
    setBorderGlows(prev => [...prev, { id, side, position, opacity }]);
    
    // Animate glow in and out
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove glow after animation
      setBorderGlows(prev => prev.filter(g => g.id !== id));
    });
  }, []);

  // Floating animation for tiny Aurora with boundary detection and bounce
  useEffect(() => {
    if (!hasMessages) {
      floatingAuroraX.setValue(width * 0.2);
      floatingAuroraY.setValue(height * 0.3);
      return;
    }

    const auroraSize = 60;
    const margin = 30; // Safe margin from edges
    const headerHeight = insets.top + 60;
    const inputAreaHeight = 100;
    
    // Boundaries
    const minX = margin;
    const maxX = width - margin - auroraSize;
    const minY = headerHeight + margin;
    const maxY = height - inputAreaHeight - margin - auroraSize;

    // Random starting position within bounds
    const startX = Math.random() * (maxX - minX) + minX;
    const startY = Math.random() * (maxY - minY) + minY;
    
    floatingAuroraX.setValue(startX);
    floatingAuroraY.setValue(startY);

    let currentX = startX;
    let currentY = startY;
    // Initial velocity for smooth, random movement
    let velocityX = (Math.random() - 0.5) * 1.5; // Reduced from 2.5 to 1.5
    let velocityY = (Math.random() - 0.5) * 1.5;

    let animationFrameId: number | null = null;

    // Animation loop with boundary detection
    const animate = () => {
      const speed = 0.7; // Reduced from 1.2 to 0.7 for slower movement
      
      const updatePosition = () => {
        // Update position
        currentX += velocityX * speed;
        currentY += velocityY * speed;

        // Boundary detection and bounce
        // Left boundary
        if (currentX < minX) {
          currentX = minX;
          // More random bounce direction
          velocityX = Math.abs((Math.random() - 0.3) * 2.5);
          createBorderGlow('left', currentY);
        }
        // Right boundary
        else if (currentX > maxX) {
          currentX = maxX;
          // More random bounce direction
          velocityX = -Math.abs((Math.random() - 0.3) * 1.5);
          createBorderGlow('right', currentY);
        }

        // Top boundary
        if (currentY < minY) {
          currentY = minY;
          // More random bounce direction
          velocityY = Math.abs((Math.random() - 0.3) * 1.5);
          createBorderGlow('top', currentX);
        }
        // Bottom boundary
        else if (currentY > maxY) {
          currentY = maxY;
          // More random bounce direction
          velocityY = -Math.abs((Math.random() - 0.3) * 1.5);
          createBorderGlow('bottom', currentX);
        }

        // More frequent random variation for more random movement
        if (Math.random() < 0.15) { // Increased from 0.02 to 0.15 (15% chance)
          velocityX += (Math.random() - 0.5) * 0.4; // Reduced variation from 0.8 to 0.4
          velocityY += (Math.random() - 0.5) * 0.4;
        }

        // Normalize velocity to prevent too fast movement
        const maxVelocity = 2.5; // Reduced from 4.0 to 2.5
        const velocityMagnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (velocityMagnitude > maxVelocity) {
          velocityX = (velocityX / velocityMagnitude) * maxVelocity;
          velocityY = (velocityY / velocityMagnitude) * maxVelocity;
        }

        // Update animated values
        floatingAuroraX.setValue(currentX);
        floatingAuroraY.setValue(currentY);

        // Continue animation
        animationFrameId = requestAnimationFrame(updatePosition);
      };

      updatePosition();
    };

    // Start animation after small delay (reduced for faster start)
    const timeoutId = setTimeout(() => {
      animate();
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [hasMessages, width, height, insets.top, createBorderGlow]);

  const handleSend = async (message: string) => {
    if (aiConsentStatus !== 'granted') {
      Alert.alert(
        'AI Consent Required',
        'To use AI-powered chat, please review how we use your data and provide consent.',
      );
      return;
    }

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleFinishSession = async () => {
    if (isStreaming || isLoading || isFinishingSession || messages.length === 0) {
      return;
    }

    setIsFinishingSession(true);
    try {
      // Transform messages to only include role and content (backend expects this format)
      const messagesForBackend = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const response = await journalService.finishChatSession(messagesForBackend);
      
      if (response.success) {
        Alert.alert(
          'Session Finished',
          `Important points have been saved:\n\n${response.data?.importantPoints?.map((p, i) => `${i + 1}. ${p}`).join('\n') || 'No points extracted'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Optionally clear chat after finishing
                // clearMessages();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Could not finish session');
      }
    } catch (error: any) {
      console.error('Error finishing session:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong while finishing the session';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsFinishingSession(false);
    }
  };

  const handleClearChat = async () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat messages? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowMenu(false),
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              clearMessages();
              
              // Reset all animations to initial state with smooth animation
              Animated.parallel([
                Animated.timing(auroraScale, {
                  toValue: 1,
                  duration: 600,
                  easing: Easing.out(Easing.ease),
                  useNativeDriver: true,
                }),
                Animated.timing(auroraOpacity, {
                  toValue: 1,
                  duration: 600,
                  easing: Easing.out(Easing.ease),
                  useNativeDriver: true,
                }),
                Animated.timing(starsOpacity, {
                  toValue: 0,
                  duration: 400,
                  easing: Easing.out(Easing.ease),
                  useNativeDriver: true,
                }),
                Animated.timing(floatingAuroraOpacity, {
                  toValue: 0,
                  duration: 400,
                  easing: Easing.in(Easing.ease),
                  useNativeDriver: true,
                }),
              ]).start();
              
              // Reset floating Aurora position immediately
              floatingAuroraX.setValue(width * 0.2);
              floatingAuroraY.setValue(height * 0.3);
              
              // Clear border glows
              setBorderGlows([]);
              
              // Reset typewriter effect - will trigger automatically via useEffect when hasMessages becomes false
              setDisplayedText('');
              setIsTyping(false);
              
              setShowMenu(false);
            } catch (err) {
              console.error('Failed to clear chat history:', err);
              Alert.alert('Error', 'Failed to clear chat history. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoadingHistory) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Star field effect - only visible when messages exist */}
      <Animated.View 
        style={[
          styles.starField, 
          { opacity: starsOpacity },
          { pointerEvents: 'none' }
        ]}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <AnimatedStar key={i} index={i} />
        ))}
      </Animated.View>

      {/* Large Aurora symbol in center when no messages */}
      {!hasMessages && (
        <>
          {/* Speech bubble above Aurora */}
          <Animated.View
            style={[
              styles.speechBubble,
              {
                opacity: auroraOpacity,
                transform: [{ scale: auroraScale }],
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.speechBubbleContent, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}>
              <Text style={[styles.speechBubbleText, { color: colors.text }]}>
                {displayedText || initialGreeting}
                {isTyping && <Text style={{ opacity: 0.5 }}>|</Text>}
              </Text>
            </View>
            <View style={[styles.speechBubbleTail, { borderTopColor: colors.glass.background }]} />
          </Animated.View>
          
          {/* Context indicator - always shows what data Aurora analyzes */}
          <Animated.View
            style={[
              styles.contextIndicatorContainer,
              {
                opacity: auroraOpacity,
                transform: [{ scale: auroraScale }],
              },
            ]}
            pointerEvents="none"
          >
            <ContextIndicator
              hasHealthInfo={availableContext?.hasHealthInfo || false}
              hasJournalEntries={availableContext?.hasJournalEntries || false}
            />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.auroraContainer,
              {
                opacity: auroraOpacity,
                transform: [{ scale: auroraScale }],
              },
            ]}
            pointerEvents="none"
          >
            <AuroraCore state="idle" audioLevel={0} size={width * 0.7} />
          </Animated.View>
        </>
      )}

      {/* Small Aurora logo in header when messages exist */}
      {hasMessages && (
        <Animated.View
          style={[
            styles.headerAurora,
            {
              opacity: auroraOpacity,
              transform: [{ scale: auroraScale }],
              top: insets.top + SPACING.sm + 8,
            },
          ]}
          pointerEvents="none"
        >
          <AuroraCore state="idle" audioLevel={0} size={40} />
        </Animated.View>
      )}

      {/* Floating tiny Aurora sphere when messages exist */}
      {hasMessages && (
        <Animated.View
          style={[
            styles.floatingAurora,
            {
              opacity: floatingAuroraOpacity,
              transform: [
                { translateX: floatingAuroraX },
                { translateY: floatingAuroraY },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <AuroraCore state="idle" audioLevel={0} size={60} />
        </Animated.View>
      )}

      {/* Bioluminescent border glow effects */}
      {hasMessages && borderGlows.map((glow) => (
        <Animated.View
          key={glow.id}
          style={[
            styles.borderGlow,
            glow.side === 'top' && {
              top: 0,
              left: glow.position - 40,
              width: 80,
              height: 3,
            },
            glow.side === 'bottom' && {
              bottom: 100, // Above input area
              left: glow.position - 40,
              width: 80,
              height: 3,
            },
            glow.side === 'left' && {
              left: 0,
              top: glow.position - 40,
              width: 3,
              height: 80,
            },
            glow.side === 'right' && {
              right: 0,
              top: glow.position - 40,
              width: 3,
              height: 80,
            },
            { opacity: glow.opacity },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[colors.primary, `${colors.primary}CC`, `${colors.primary}80`, 'transparent']}
            start={
              glow.side === 'top' ? { x: 0.5, y: 0 } :
              glow.side === 'bottom' ? { x: 0.5, y: 1 } :
              glow.side === 'left' ? { x: 0, y: 0.5 } :
              { x: 1, y: 0.5 }
            }
            end={
              glow.side === 'top' ? { x: 0.5, y: 1 } :
              glow.side === 'bottom' ? { x: 0.5, y: 0 } :
              glow.side === 'left' ? { x: 1, y: 0.5 } :
              { x: 0, y: 0.5 }
            }
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ))}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Aurora</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Mental health chat</Text>
        </View>
        <Pressable 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* AI Consent banner above chat when not granted */}
        {aiConsentStatus !== 'granted' && (
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
            <AiConsentCard
              onAccept={grantAiConsent}
              onDecline={denyAiConsent}
              onLearnMore={() => router.push('/ai-data-info')}
            />
          </View>
        )}

        <MessageList />
        {/* Toolbar with action buttons */}
        {hasMessages && (
          <View style={[styles.toolbar, { borderBottomColor: colors.glass.border }]}>
            <View style={styles.toolbarSpacer} />
            <Pressable
              style={[styles.toolbarButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
              onPress={handleFinishSession}
              disabled={isStreaming || isLoading || isFinishingSession}
            >
              {isFinishingSession ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
              <Text style={[styles.toolbarButtonText, { color: colors.text }]}>
                {isFinishingSession ? 'Processing...' : 'Finish Session'}
              </Text>
            </Pressable>
          </View>
        )}
        <ChatInput onSend={handleSend} isDisabled={isStreaming || isLoading} />
      </KeyboardAvoidingView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable 
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContent, { backgroundColor: colors.surface, borderColor: colors.glass.border }]}>
            <Pressable
              style={styles.menuItem}
              onPress={handleClearChat}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Clear Chat History</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.glass.border }]} />
            <Pressable
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  starField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  speechBubble: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    marginLeft: -120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    width: 240,
  },
  speechBubbleContent: {
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  speechBubbleText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.text,
  },
  speechBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.glass.background,
    marginTop: -1,
    alignSelf: 'center',
  },
  contextIndicatorContainer: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    marginLeft: -160,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
    width: 320,
    maxHeight: '35%',
  },
  auroraContainer: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    marginTop: -(width * 0.7) / 2,
    marginLeft: -(width * 0.7) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Below chat container and input
  },
  headerAurora: {
    position: 'absolute',
    right: SPACING.md + 20,
    zIndex: 2,
  },
  floatingAurora: {
    position: 'absolute',
    zIndex: 0, // Behind messages but visible
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderGlow: {
    position: 'absolute',
    zIndex: 1, // Above Aurora but below messages
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyMedium,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    zIndex: 5, // Always above Aurora, below header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  menuContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItemText: {
    ...TYPOGRAPHY.bodyMedium,
    marginLeft: SPACING.md,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.glass.border,
    marginVertical: SPACING.xs,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  toolbarButtonText: {
    ...TYPOGRAPHY.small,
    fontWeight: '500',
  },
});

