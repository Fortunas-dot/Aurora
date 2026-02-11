import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ContextIndicator } from './ContextIndicator';
import { useChatStore } from '../../store/chatStore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export const MessageList: React.FC = () => {
  const { messages, isStreaming, currentStreamingMessage, setStreaming, availableContext } = useChatStore();
  const flatListRef = useRef<FlatList>(null);
  const streamingStartTime = useRef<number | null>(null);

  // Safety check: Reset streaming state if it's been active for too long without data
  useEffect(() => {
    if (isStreaming) {
      if (!streamingStartTime.current) {
        streamingStartTime.current = Date.now();
      }
      
      // If streaming for more than 15 seconds without data, reset it
      const checkInterval = setInterval(() => {
        if (streamingStartTime.current && Date.now() - streamingStartTime.current > 15000) {
          if (!currentStreamingMessage || currentStreamingMessage.trim() === '') {
            console.warn('Streaming state stuck - resetting after 15 seconds without data');
            setStreaming(false);
            streamingStartTime.current = null;
          }
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(checkInterval);
    } else {
      streamingStartTime.current = null;
    }
  }, [isStreaming, currentStreamingMessage, setStreaming]);

  // Reset streaming start time when we receive data
  useEffect(() => {
    if (currentStreamingMessage && currentStreamingMessage.trim() !== '') {
      streamingStartTime.current = null; // Reset timer when we get data
    }
  }, [currentStreamingMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 || currentStreamingMessage) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, currentStreamingMessage]);

  const renderMessage = ({ item }: { item: typeof messages[0] }) => (
    <ChatMessage message={item} />
  );

  const renderEmptyState = () => {
    // Empty state is now handled by the parent component (text-chat.tsx)
    // which shows a large animated Aurora symbol
    return null;
  };

  const renderFooter = () => {
    if (isStreaming) {
      return (
        <View>
          {availableContext && (availableContext.hasHealthInfo || availableContext.hasJournalEntries) && (
            <ContextIndicator
              hasHealthInfo={availableContext.hasHealthInfo}
              hasJournalEntries={availableContext.hasJournalEntries}
            />
          )}
          {currentStreamingMessage ? (
            <ChatMessage
              message={{
                id: 'streaming',
                role: 'assistant',
                content: currentStreamingMessage,
                timestamp: new Date().toISOString(),
              }}
              isStreaming
            />
          ) : (
            <TypingIndicator />
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        keyboardDismissMode="interactive"
        onContentSizeChange={() => {
          if (messages.length > 0 || currentStreamingMessage) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        maintainVisibleContentPosition={
          messages.length > 0
            ? {
                minIndexForVisible: 0,
              }
            : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
