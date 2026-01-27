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
import { useChatStore } from '../../store/chatStore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export const MessageList: React.FC = () => {
  const { messages, isStreaming, currentStreamingMessage } = useChatStore();
  const flatListRef = useRef<FlatList>(null);

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
    if (messages.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="sparkles" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyStateTitle}>Hallo! Ik ben Aurora</Text>
          <Text style={styles.emptyStateText}>
            Ik ben hier om je te helpen. Deel gerust je gedachten met me.
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderFooter = () => {
    if (isStreaming) {
      if (currentStreamingMessage) {
        return (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: currentStreamingMessage,
              timestamp: new Date().toISOString(),
            }}
            isStreaming
          />
        );
      } else {
        return <TypingIndicator />;
      }
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
