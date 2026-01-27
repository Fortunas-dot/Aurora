import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types/chat.types';

const STORAGE_KEYS = {
  CHAT_HISTORY: '@aurora:chat_history',
  LAST_CHAT_ID: '@aurora:last_chat_id',
};

export class StorageService {
  /**
   * Save messages to AsyncStorage
   */
  static async saveMessages(messages: Message[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(messages);
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, jsonValue);
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }

  /**
   * Load messages from AsyncStorage
   */
  static async loadMessages(): Promise<Message[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  /**
   * Clear all messages from AsyncStorage
   */
  static async clearMessages(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  }

  /**
   * Clear all app data
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}
