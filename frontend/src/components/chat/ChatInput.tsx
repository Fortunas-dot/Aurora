import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  isDisabled?: boolean; // Only disables the send button, not the input field
  allowTypingWhileDisabled?: boolean; // Allow typing even when disabled
  isStreaming?: boolean; // Whether AI is currently streaming
  onStop?: () => void; // Callback to stop streaming
}

const ChatInputComponent: React.FC<ChatInputProps> = ({
  onSend,
  isDisabled = false,
  allowTypingWhileDisabled = true,
  isStreaming = false,
  onStop
}) => {
  const [text, setText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSend = useCallback(() => {
    if (text.trim() && !isDisabled) {
      onSend(text.trim());
      setText('');
      // Dismiss keyboard after sending
      Keyboard.dismiss();
    }
  }, [text, isDisabled, onSend]);

  const handleStop = useCallback(() => {
    if (onStop && isStreaming) {
      onStop();
      // Dismiss keyboard when stopping
      Keyboard.dismiss();
    }
  }, [onStop, isStreaming]);

  const handleContainerPress = useCallback(() => {
    // Allow dismissing keyboard by tapping outside input
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      inputRef.current?.blur();
    }
  }, [isKeyboardVisible]);

  // When keyboard is visible, still leave a comfortable gap between the input
  // and the top of the keyboard so the chat box doesn't feel cramped.
  // When hidden, use safe area bottom for devices with a home indicator.
  const paddingBottom = isKeyboardVisible
    ? (Platform.OS === 'ios'
        ? Math.max(SPACING.xs, insets.bottom * 0.5) // nog iets lager, maar met minimale veilige marge
        : SPACING.xs)
    : (Platform.OS === 'ios'
        ? Math.max(insets.bottom, SPACING.sm)
        : SPACING.md);

  return (
    <TouchableWithoutFeedback onPress={handleContainerPress}>
      <View style={[styles.container, { paddingBottom }]}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={2000}
            editable={allowTypingWhileDisabled || !isDisabled}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            onBlur={() => {
              // Allow keyboard to dismiss on blur
              setIsKeyboardVisible(false);
            }}
            onFocus={() => {
              // Update keyboard state when focused
              setIsKeyboardVisible(true);
            }}
          />

          <Pressable
            style={[
              styles.sendButton,
              (!isStreaming && (!text.trim() || isDisabled)) && styles.sendButtonDisabled
            ]}
            onPress={isStreaming ? handleStop : handleSend}
            disabled={!isStreaming && (!text.trim() || isDisabled)}
          >
            {isStreaming ? (
              <Ionicons
                name="stop-circle"
                size={20}
                color={COLORS.white}
              />
            ) : isDisabled ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={COLORS.white}
              />
            )}
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const ChatInput = memo(ChatInputComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    zIndex: 6, // Above everything including Aurora
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm + 2 : SPACING.sm,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.primaryDark,
    opacity: 0.6,
  },
});
