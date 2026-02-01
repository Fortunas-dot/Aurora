import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { GlassCard, GlassInput, GlassButton, Avatar, LoadingSpinner } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { messageService, Message } from '../../src/services/message.service';
import { useAuthStore } from '../../src/store/authStore';
import { chatWebSocketService } from '../../src/services/chatWebSocket.service';

export default function ConversationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Message['sender'] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadMessages = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!userId || !isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await messageService.getConversation(userId, pageNum, 50);
      
      if (response.success && response.data) {
        if (append) {
          setMessages((prev) => [...response.data!, ...prev]);
        } else {
          setMessages(response.data);
          // Set other user from first message
          if (response.data.length > 0) {
            const firstMessage = response.data[0];
            setOtherUser(
              firstMessage.sender._id === currentUser?._id
                ? firstMessage.receiver
                : firstMessage.sender
            );
          }
        }
        
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.pages);
        }

        // Scroll to bottom on initial load
        if (!append && response.data.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated, currentUser]);

  useEffect(() => {
    loadMessages(1, false);
  }, [loadMessages]);

  // Setup WebSocket connection for real-time chat
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    chatWebSocketService.connect({
      onNewMessage: (message) => {
        // Only add message if it's from the current conversation
        if (message.sender._id === userId || message.receiver._id === userId) {
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m._id === message._id)) {
              return prev;
            }
            return [...prev, message];
          });
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // Mark as read if it's a received message
          if (message.sender._id === userId) {
            chatWebSocketService.markAsRead(message._id);
          }
        }
      },
      onMessageSent: (message) => {
        // Update message in list if it exists (optimistic update)
        setMessages((prev) => {
          const index = prev.findIndex((m) => m._id === message._id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = message;
            return updated;
          }
          return [...prev, message];
        });
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      onTypingStart: (typingUserId) => {
        if (typingUserId === userId) {
          setIsTyping(true);
        }
      },
      onTypingStop: (typingUserId) => {
        if (typingUserId === userId) {
          setIsTyping(false);
        }
      },
      onUserStatus: (statusUserId, online) => {
        if (statusUserId === userId) {
          setIsOnline(online);
        }
      },
      onMessageRead: (messageId, readAt) => {
        // Update message read status
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, readAt: readAt.toISOString() } : msg
          )
        );
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
  }, [isAuthenticated, userId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadMessages(1, false);
    setIsRefreshing(false);
  }, [loadMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userId || isSending) return;

    const messageContent = messageText.trim();
    setMessageText('');
    
    // Optimistic update - add message immediately
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: currentUser!,
      receiver: otherUser!,
      content: messageContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setIsSending(true);
    
    // Send via WebSocket (preferred) or fallback to REST API
    if (chatWebSocketService.isConnected()) {
      chatWebSocketService.sendMessage(userId, messageContent);
      setIsSending(false);
    } else {
      // Fallback to REST API
      try {
        const response = await messageService.sendMessage(userId, messageContent);
        
        if (response.success && response.data) {
          // Replace temp message with real message
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempMessage._id ? response.data! : msg
            )
          );
        } else {
          // Remove temp message on error
          setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Remove temp message on error
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      } finally {
        setIsSending(false);
      }
    }
  };

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    if (text.trim() && userId && chatWebSocketService.isConnected()) {
      chatWebSocketService.sendTypingStart(userId);
    }
    
    // Clear typing indicator after 3 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (userId && chatWebSocketService.isConnected()) {
        chatWebSocketService.sendTypingStop(userId);
      }
    }, 3000);
  };

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage, true);
    }
  }, [isLoading, hasMore, page, loadMessages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender._id === currentUser?._id;
    const formattedTime = format(new Date(item.createdAt), 'HH:mm', { locale: nl });
    const showDate = false; // Could add date separators if needed

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.messageContainerOwn : styles.messageContainerOther,
        ]}
      >
        {!isOwn && (
          <Avatar
            uri={item.sender.avatar}
            name={item.sender.displayName || item.sender.username}
            size="sm"
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          ]}
        >
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.authPromptTitle}>Log in om te chatten</Text>
          <GlassButton
            title="Inloggen"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            style={styles.authButton}
          />
        </View>
      </LinearGradient>
    );
  }

  if (isLoading && messages.length === 0) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          {otherUser && (
            <View style={styles.headerUser}>
              <Avatar
                uri={otherUser.avatar}
                name={otherUser.displayName || otherUser.username}
                size="sm"
              />
              <View style={styles.headerUserInfo}>
                <Text style={styles.headerUserName}>
                  {otherUser.displayName || otherUser.username}
                </Text>
                <Text style={[styles.headerUserStatus, isOnline && styles.headerUserStatusOnline]}>
                  {isTyping ? 'typt...' : isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.loadingFooter}>
                <LoadingSpinner size="sm" />
              </View>
            ) : null
          }
          inverted={false}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {otherUser?.displayName || otherUser?.username} is aan het typen...
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <GlassInput
            value={messageText}
            onChangeText={handleTextChange}
            placeholder="Typ een bericht..."
            multiline
            style={styles.messageInput}
            inputStyle={styles.messageInputText}
            maxLength={2000}
            onSubmitEditing={handleSendMessage}
          />
          <Pressable
            style={[
              styles.sendButton,
              (!messageText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={messageText.trim() ? COLORS.primary : COLORS.textMuted}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerUserInfo: {
    marginLeft: SPACING.sm,
  },
  headerUserName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  headerUserStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  headerUserStatusOnline: {
    color: COLORS.primary,
  },
  headerSpacer: {
    width: 40,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-end',
  },
  messageContainerOwn: {
    justifyContent: 'flex-end',
  },
  messageContainerOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: SPACING.xs,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.userBubble,
    borderWidth: 1,
    borderColor: COLORS.userBubbleBorder,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.assistantBubble,
    borderWidth: 1,
    borderColor: COLORS.assistantBubbleBorder,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  messageTextOwn: {
    color: COLORS.text,
  },
  messageTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  messageTimeOwn: {
    color: COLORS.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    backgroundColor: COLORS.background,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
  },
  messageInputText: {
    maxHeight: 100,
    textAlignVertical: 'top',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingFooter: {
    padding: SPACING.md,
    alignItems: 'center',
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
    marginBottom: SPACING.lg,
  },
  authButton: {
    minWidth: 200,
  },
  typingIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  typingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});






