import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { GlassCard, Avatar, GlassInput, LoadingSpinner } from '../../src/components/common';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, COLORS } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { messageService, Conversation } from '../../src/services/message.service';
import { chatWebSocketService } from '../../src/services/chatWebSocket.service';
import { Badge } from '../../src/components/common';

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

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await messageService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        console.error('Error loading conversations:', response.message);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Reload conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadConversations();
      }
    }, [isAuthenticated, loadConversations])
  );

  // Setup WebSocket connection for real-time conversation updates
  useEffect(() => {
    if (!isAuthenticated) return;

    chatWebSocketService.connect({
      onNewMessage: (message) => {
        // Reload conversations to update unread counts and last messages
        loadConversations();
      },
      onMessageSent: (message) => {
        // When you send a message, update the conversation list
        loadConversations();
      },
      onConversationUpdated: (conversation) => {
        // Update conversation in list
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.user._id === conversation.user._id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              lastMessage: conversation.lastMessage,
              // Update unreadCount if provided in conversation
              unreadCount: conversation.unreadCount !== undefined ? conversation.unreadCount : updated[index].unreadCount,
            };
            // Move to top
            const [moved] = updated.splice(index, 1);
            return [moved, ...updated];
          } else {
            // New conversation, add to top
            return [conversation, ...prev];
          }
        });
      },
      onUserStatus: (userId, isOnline) => {
        // Update online status in conversation list if needed
        // This could be used to show online indicators
      },
      onConnected: () => {
        console.log('✅ Chat WebSocket connected');
      },
      onDisconnected: () => {
        console.log('❌ Chat WebSocket disconnected');
      },
      onError: (error) => {
        console.error('Chat WebSocket error:', error);
      },
    });

    return () => {
      chatWebSocketService.disconnect();
    };
  }, [isAuthenticated, loadConversations]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  }, [loadConversations]);

  const filteredConversations = conversations.filter((conv) =>
    conv.user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNewChat = () => {
    router.push('/search-users');
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const formattedDate = formatDistanceToNow(new Date(item.lastMessage.createdAt), {
      addSuffix: false,
      locale: nl,
    });

    return (
      <GlassCard
        style={styles.conversationCard}
        padding={0}
        onPress={() => router.push(`/conversation/${item.user._id}`)}
      >
        <View style={styles.conversationContent}>
          <Avatar
            uri={item.user.avatar}
            name={item.user.displayName || item.user.username}
            userId={item.user._id}
            avatarCharacter={item.user.avatarCharacter}
            avatarBackgroundColor={item.user.avatarBackgroundColor}
            size="lg"
          />
          
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {item.user.displayName || item.user.username}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>{formattedDate}</Text>
            </View>
            
            <View style={styles.messageRow}>
              <Text
                style={[
                  styles.lastMessage,
                  { color: colors.textSecondary },
                  item.unreadCount > 0 && [styles.lastMessageUnread, { color: colors.text, fontWeight: '500' }],
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.isOwn && 'You: '}
                {item.lastMessage.content}
              </Text>
              
              {item.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.unreadCount, { color: colors.white }]}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </GlassCard>
    );
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        </View>
        
        <View style={styles.authPrompt}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authPromptTitle, { color: colors.text }]}>Log in to chat</Text>
          <Text style={[styles.authPromptText, { color: colors.textSecondary }]}>
            Connect with other community members
          </Text>
          <Pressable
            style={[styles.authButton, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.authButtonText, { color: colors.primary }]}>Login</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      style={styles.container}
    >
      {/* Star field effect */}
      <View style={[styles.starField, { pointerEvents: 'none' }]}>
        {Array.from({ length: 30 }).map((_, i) => (
          <AnimatedStar key={i} index={i} />
        ))}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Berichten</Text>
        <Pressable style={[styles.headerButton, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]} onPress={handleCreateNewChat}>
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
          icon="search"
          style={styles.searchInput}
        />
      </View>

      {/* Conversations */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="lg" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No conversations</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Start a conversation with someone from the community
              </Text>
              <Pressable
                style={[styles.startChatButton, { backgroundColor: colors.glass.backgroundLight, borderColor: colors.glass.border }]}
                onPress={handleCreateNewChat}
              >
                <Text style={[styles.startChatButtonText, { color: colors.primary }]}>Start new conversation</Text>
              </Pressable>
            </View>
          )
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  conversationCard: {
    marginBottom: SPACING.sm,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    flex: 1,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  lastMessageUnread: {
    color: COLORS.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  unreadCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  startChatButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginTop: SPACING.md,
  },
  startChatButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  authPromptTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
  },
  authPromptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  authButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
  starField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.text,
  },
});

