import { Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getApiUrl } from '../utils/apiUrl';

class ShareService {
  /**
   * Share post via native share dialog
   */
  async sharePost(postId: string, content: string, authorName: string): Promise<void> {
    try {
      const baseUrl = getApiUrl().replace('/api', '');
      const postUrl = `${baseUrl}/post/${postId}`;
      const shareText = `${authorName}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n\n${postUrl}`;

      const result = await Share.share({
        message: shareText,
        title: 'Deel post',
      });

      if (result.action === Share.sharedAction) {
        console.log('Post shared successfully');
      }
    } catch (error: any) {
      console.error('Error sharing post:', error);
      Alert.alert('Fout', 'Kon post niet delen');
    }
  }

  /**
   * Copy post link to clipboard
   */
  async copyPostLink(postId: string): Promise<void> {
    try {
      const baseUrl = getApiUrl().replace('/api', '');
      const postUrl = `${baseUrl}/post/${postId}`;
      
      await Clipboard.setStringAsync(postUrl);
      Alert.alert('Gekopieerd', 'Link gekopieerd naar klembord');
    } catch (error: any) {
      console.error('Error copying link:', error);
      Alert.alert('Fout', 'Kon link niet kopiëren');
    }
  }

  /**
   * Share text content
   */
  async shareText(text: string, title?: string): Promise<void> {
    try {
      await Share.share({
        message: text,
        title: title || 'Deel',
      });
    } catch (error: any) {
      console.error('Error sharing text:', error);
    }
  }
}

export const shareService = new ShareService();

