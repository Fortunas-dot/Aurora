import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Image,
  Pressable,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { formatDistanceToNow, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { GlassCard, GlassInput, GlassButton, Avatar, LoadingSpinner } from '../../src/components/common';
import { EmojiPicker } from '../../src/components/chat/EmojiPicker';
import { VoiceRecorder } from '../../src/components/chat/VoiceRecorder';
import { VoiceMessagePlayer } from '../../src/components/chat/VoiceMessagePlayer';
import { TypingIndicator } from '../../src/components/chat/TypingIndicator';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { messageService, Message } from '../../src/services/message.service';
import { uploadService } from '../../src/services/upload.service';
import { useAuthStore } from '../../src/store/authStore';
import { chatWebSocketService } from '../../src/services/chatWebSocket.service';
import { userService, UserProfile } from '../../src/services/user.service';

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
  const [otherUser, setOtherUser] = useState<Message['sender'] | UserProfile | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadOtherUser = useCallback(async () => {
    if (!userId || !isAuthenticated) return;

    try {
      const response = await userService.getUserProfile(userId);
      if (response.success && response.data) {
        // Convert UserProfile to Message sender format
        setOtherUser({
          _id: response.data._id,
          username: response.data.username,
          displayName: response.data.displayName,
          avatar: response.data.avatar,
        } as Message['sender']);
      }
    } catch (error) {
      console.error('Error loading other user:', error);
    }
  }, [userId, isAuthenticated]);

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
          // Set other user from first message if available, otherwise keep existing
          if (response.data.length > 0 && !otherUser) {
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
  }, [userId, isAuthenticated, currentUser, otherUser]);

  useEffect(() => {
    loadOtherUser();
  }, [loadOtherUser]);

  useEffect(() => {
    loadMessages(1, false);
  }, [loadMessages]);

  // Setup WebSocket event listeners for real-time chat
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Ensure WebSocket is connected, then check online status
    chatWebSocketService.ensureConnected().then(() => {
      // Request the current online status of the other user
      chatWebSocketService.checkOnline(userId);
    });

    // Also check online status when the WebSocket reconnects
    const unsubConnected = chatWebSocketService.on('connected', () => {
      chatWebSocketService.checkOnline(userId);
    });

    // Subscribe to events using the new listener API
    const unsubNewMessage = chatWebSocketService.on('new_message', (message: any) => {
      // Only handle messages from the current conversation
      if (message.sender._id === userId || message.receiver._id === userId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
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

        // Clear typing indicator when message arrives
        setIsTyping(false);
      }
    });

    const unsubMessageSent = chatWebSocketService.on('message_sent', (message: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;

        // Check for duplicate by content within 2 seconds
        const now = new Date().getTime();
        const messageTime = new Date(message.createdAt).getTime();
        const isDuplicate = prev.some((m) => {
          const mTime = new Date(m.createdAt).getTime();
          return (
            m.sender._id === message.sender._id &&
            m.content === message.content &&
            Math.abs(now - mTime) < 2000 &&
            Math.abs(messageTime - mTime) < 2000
          );
        });

        if (isDuplicate) return prev;
        return [...prev, message];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const unsubTypingStart = chatWebSocketService.on('typing_start', (typingUserId: string) => {
      if (typingUserId === userId) {
        setIsTyping(true);
      }
    });

    const unsubTypingStop = chatWebSocketService.on('typing_stop', (typingUserId: string) => {
      if (typingUserId === userId) {
        setIsTyping(false);
      }
    });

    const unsubUserStatus = chatWebSocketService.on('user_status', (statusUserId: string, online: boolean) => {
      if (statusUserId === userId) {
        setIsOnline(online);
      }
    });

    const unsubMessageRead = chatWebSocketService.on('message_read', (messageId: string, readAt: Date) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, readAt: readAt.toISOString() } : msg
        )
      );
    });

    // Cleanup: only remove listeners, do NOT disconnect the WebSocket
    return () => {
      unsubConnected();
      unsubNewMessage();
      unsubMessageSent();
      unsubTypingStart();
      unsubTypingStop();
      unsubUserStatus();
      unsubMessageRead();
    };
  }, [isAuthenticated, userId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadMessages(1, false);
    setIsRefreshing(false);
  }, [loadMessages]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const imageUris = result.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...imageUris].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !userId) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await messageService.searchMessages(userId, query);
      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceRecordingComplete = async (uri: string, duration: number) => {
    setIsUploading(true);
    setShowVoiceRecorder(false);

    try {
      const uploadResult = await uploadService.uploadAudio(uri);
      if (uploadResult.success && uploadResult.data) {
        const attachments = [{
          type: 'audio' as const,
          url: uploadResult.data.url,
          duration,
        }];

        // Send message with audio attachment
        if (chatWebSocketService.isConnected()) {
          chatWebSocketService.sendMessage(userId, '', attachments);
        } else {
          const response = await messageService.sendMessage(userId, '', attachments);
          if (response.success && response.data) {
            setMessages((prev) => [...prev, response.data!]);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading voice message:', error);
      Alert.alert('Error', 'Could not send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && selectedImages.length === 0) || !userId || isSending) return;

    setIsSending(true);
    setIsUploading(true);

    let attachments: Array<{ type: 'image'; url: string }> = [];

    // Upload images if any
    if (selectedImages.length > 0) {
      try {
        const uploadPromises = selectedImages.map(async (uri) => {
          const uploadResult = await uploadService.uploadImage(uri);
          if (uploadResult.success && uploadResult.data) {
            return {
              type: 'image' as const,
              url: uploadResult.data.url,
            };
          }
          return null;
        });

        const uploadedAttachments = await Promise.all(uploadPromises);
        attachments = uploadedAttachments.filter((a) => a !== null) as Array<{ type: 'image'; url: string }>;
      } catch (error) {
        console.error('Error uploading images:', error);
        Alert.alert('Error', 'Could not upload images');
        setIsSending(false);
        setIsUploading(false);
        return;
      }
    }

    const messageContent = messageText.trim() || ''; // Always provide content, even if empty
    
    // Clear input immediately for better UX
    setMessageText('');
    setSelectedImages([]);
    setIsUploading(false);
    
    // Send via WebSocket (preferred) or fallback to REST API
    if (chatWebSocketService.isConnected()) {
      try {
        // Send via WebSocket - will trigger onMessageSent callback when successful
        chatWebSocketService.sendMessage(userId, messageContent, attachments);
        // Reset sending state immediately - WebSocket handles async delivery
        setIsSending(false);
        return; // Exit early if WebSocket send succeeds
      } catch (error) {
        console.error('Error sending via WebSocket, falling back to REST API:', error);
        // Fall through to REST API fallback below
      }
    }
    
    // Fallback to REST API if WebSocket not connected or if WebSocket send failed
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: currentUser!,
      receiver: otherUser!,
      content: messageContent,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      const response = await messageService.sendMessage(userId, messageContent, attachments);
      
      if (response.success && response.data) {
        // Replace temp message with real message
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id ? response.data! : msg
          )
        );
      } else {
        // Remove temp message on error and show alert
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
        Alert.alert('Error', response.message || 'Could not send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      Alert.alert('Error', error.message || 'Could not send message');
    } finally {
      setIsSending(false);
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

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const response = await messageService.reactToMessage(messageId, emoji);
      if (response.success && response.data) {
        // Update message in list
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? response.data! : msg
          )
        );
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const handleLongPressMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    setEmojiPickerVisible(true);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender._id === currentUser?._id;
    const formattedTime = format(new Date(item.createdAt), 'HH:mm', { locale: enUS });
    const showDate = false; // Could add date separators if needed

    const imageUrl = (url: string) => {
      return url.startsWith('http') ? url : `https://aurora-production.up.railway.app${url}`;
    };

    const hasUserReacted = (reaction: { emoji: string; users: any[] }) => {
      return reaction.users.some((user) => user._id === currentUser?._id);
    };

    return (
      <Pressable
        onLongPress={() => handleLongPressMessage(item._id)}
        style={[
          styles.messageContainer,
          isOwn ? styles.messageContainerOwn : styles.messageContainerOther,
        ]}
      >
        {!isOwn && (
          <Avatar
            uri={item.sender.avatar}
            name={item.sender.displayName || item.sender.username}
            userId={item.sender._id}
            avatarCharacter={item.sender.avatarCharacter}
            avatarBackgroundColor={item.sender.avatarBackgroundColor}
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
          {/* Attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment, index) => (
                <View key={index} style={styles.attachmentWrapper}>
                  {attachment.type === 'image' && (
                    <Image
                      source={{ uri: imageUrl(attachment.url) }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  {attachment.type === 'audio' && (
                    <VoiceMessagePlayer
                      uri={imageUrl(attachment.url)}
                      duration={attachment.duration}
                      isOwn={isOwn}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
          
          {/* Content */}
          {item.content && (
            <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
              {item.content}
            </Text>
          )}
          
          {/* Reactions */}
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((reaction, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.reactionButton,
                    hasUserReacted(reaction) && styles.reactionButtonActive,
                  ]}
                  onPress={() => handleReactToMessage(item._id, reaction.emoji)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  {reaction.users.length > 0 && (
                    <Text style={styles.reactionCount}>{reaction.users.length}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
          
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formattedTime}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.authPromptTitle}>Log in to chat</Text>
          <GlassButton
            title="Log in"
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
      {/* Star field effect */}
      <View style={[styles.starField, { pointerEvents: 'none' }]}>
        {Array.from({ length: 30 }).map((_, i) => (
          <AnimatedStar key={i} index={i} />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                userId={otherUser._id}
                avatarCharacter={otherUser.avatarCharacter}
                avatarBackgroundColor={otherUser.avatarBackgroundColor}
                size="sm"
              />
              <View style={styles.headerUserInfo}>
                <Text style={styles.headerUserName}>
                  {otherUser.displayName || otherUser.username}
                </Text>
                <Text style={[
                  styles.headerUserStatus, 
                  isOnline && styles.headerUserStatusOnline,
                  isTyping && styles.headerUserStatusTyping,
                ]}>
                  {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
          <View style={styles.typingIndicatorContainer}>
            <TypingIndicator />
          </View>
        )}

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        )}

        {/* Input */}
        {!showVoiceRecorder && (
          <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + SPACING.xs : SPACING.sm }]}>
            <View style={styles.inputRow}>
              <View style={[
                styles.inputWrapper,
                (messageText.includes('\n') || messageText.length > 40) && styles.inputWrapperMultiline
              ]}>
                <View style={[
                  styles.inputFieldContainer,
                  (messageText.includes('\n') || messageText.length > 40) && styles.inputFieldContainerMultiline
                ]}>
                  <GlassInput
                    value={messageText}
                    onChangeText={handleTextChange}
                    placeholder="Type a message..."
                    multiline={messageText.includes('\n') || messageText.length > 40}
                    style={styles.messageInput}
                    inputStyle={[
                      !messageText.includes('\n') && messageText.length <= 40
                        ? styles.messageInputTextCentered
                        : styles.messageInputTextMultiline,
                      messageText.length > 0 && !messageText.includes('\n') && messageText.length <= 40 && { paddingRight: 60 },
                      messageText.length > 0 && (messageText.includes('\n') || messageText.length > 40) && { paddingBottom: 20, paddingRight: 60 },
                    ]}
                    maxLength={2000}
                    showCharCount={false}
                    onSubmitEditing={handleSendMessage}
                  />
                </View>
              </View>
              <Pressable
                style={styles.attachButton}
                onPress={handlePickImage}
                disabled={isSending || isUploading}
              >
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={isSending || isUploading ? COLORS.textMuted : COLORS.primary}
                />
              </Pressable>
              <Pressable
                style={styles.attachButton}
                onPress={() => setShowVoiceRecorder(true)}
                disabled={isSending || isUploading}
              >
                <Ionicons
                  name="mic-outline"
                  size={22}
                  color={isSending || isUploading ? COLORS.textMuted : COLORS.primary}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.sendButton,
                  ((!messageText.trim() && selectedImages.length === 0) || isSending || isUploading) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={(!messageText.trim() && selectedImages.length === 0) || isSending || isUploading}
              >
                {isSending || isUploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={(messageText.trim() || selectedImages.length > 0) ? COLORS.primary : COLORS.textMuted}
                  />
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Emoji Picker */}
        <EmojiPicker
          visible={emojiPickerVisible}
          onClose={() => {
            setEmojiPickerVisible(false);
            setSelectedMessageId(null);
          }}
          onSelect={(emoji) => {
            if (selectedMessageId) {
              handleReactToMessage(selectedMessageId, emoji);
            }
          }}
        />
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
  headerUserStatusTyping: {
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  headerSpacer: {
    width: 40,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
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
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 40,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  inputWrapperMultiline: {
    justifyContent: 'flex-start',
  },
  inputFieldContainer: {
    position: 'relative',
    minHeight: 40,
  },
  inputFieldContainerMultiline: {
    minHeight: 'auto',
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
  },
  messageInputTextMultiline: {
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: 'top',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    paddingRight: SPACING.md,
  },
  messageInputTextCentered: {
    height: 40,
    textAlignVertical: 'center',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingTop: 0,
    paddingBottom: 0,
    paddingRight: SPACING.md,
    paddingLeft: SPACING.md,
    includeFontPadding: false,
    lineHeight: Platform.OS === 'android' ? 20 : 20,
  },
  charCountContainer: {
    position: 'absolute',
    bottom: 6,
    right: SPACING.md,
    backgroundColor: 'transparent',
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
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
    flexShrink: 0,
    alignSelf: 'center',
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
  typingIndicatorContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  attachmentsContainer: {
    marginBottom: SPACING.xs,
  },
  attachmentWrapper: {
    marginBottom: SPACING.xs,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  imagePreviewContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    backgroundColor: COLORS.background,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'center',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  reactionButtonActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
  },
  searchInputText: {
    ...TYPOGRAPHY.body,
  },
  clearSearchButton: {
    padding: SPACING.xs,
  },
  searchResultsContainer: {
    maxHeight: 200,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchResultsTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  searchResultsList: {
    maxHeight: 150,
  },
  searchResultItem: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.xs,
  },
  searchResultText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  searchResultTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
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






