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
  const flatListRef = useRef<FlatList>(null);

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadMessages(1, false);
    setIsRefreshing(false);
  }, [loadMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userId || isSending) return;

    setIsSending(true);
    try {
      const response = await messageService.sendMessage(userId, messageText.trim());
      
      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data!]);
        setMessageText('');
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
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
                <Text style={styles.headerUserStatus}>Online</Text>
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

        {/* Input */}
        <View style={styles.inputContainer}>
          <GlassInput
            value={messageText}
            onChangeText={setMessageText}
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
});






