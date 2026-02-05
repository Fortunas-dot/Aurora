import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, KeyboardAvoidingView, Platform, Pressable, Animated, Dimensions, Easing, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageList } from '../src/components/chat/MessageList';
import { ChatInput } from '../src/components/chat/ChatInput';
import { useStreamingResponse } from '../src/hooks/useStreamingResponse';
import { useChatHistory } from '../src/hooks/useChatHistory';
import { useChatStore } from '../src/store/chatStore';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/constants/theme';
import { AuroraCore } from '../src/components/voice/AuroraCore';
import { useTheme } from '../src/hooks/useTheme';

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
  const { sendMessage, isLoading } = useStreamingResponse();
  const { clearHistory, isLoading: isLoadingHistory } = useChatHistory();
  const { messages, isStreaming, error, setError, clearMessages } = useChatStore();
  
  // Animation for Aurora logo transition
  const auroraScale = useRef(new Animated.Value(1)).current;
  const auroraOpacity = useRef(new Animated.Value(1)).current;
  const starsOpacity = useRef(new Animated.Value(0)).current;
  
  const hasMessages = messages.length > 0;
  const [showMenu, setShowMenu] = useState(false);
  
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
      ]).start();
    }
  }, [hasMessages]);

  const handleSend = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
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

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.glass.border }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Aurora AI</Text>
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
        style={[styles.chatContainer, { zIndex: hasMessages ? 4 : 2 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <MessageList />
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
          <View style={[styles.menuContent, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}>
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
  auroraContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -(width * 0.7) / 2,
    marginLeft: -(width * 0.7) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3, // Above star field but below header
  },
  headerAurora: {
    position: 'absolute',
    right: SPACING.md + 20,
    zIndex: 2,
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
    zIndex: 4, // Above Aurora when messages exist, but below header
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
    backgroundColor: COLORS.glass.background,
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
});

