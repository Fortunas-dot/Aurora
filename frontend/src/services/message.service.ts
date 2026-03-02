import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

// Helper function to normalize URLs to absolute URLs
const normalizeUrl = (url: string | undefined | null): string | undefined => {
  if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
  
  // Remove any whitespace
  const trimmedUrl = url.trim();
  
  // If already absolute, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // If relative, make it absolute
  const baseUrl = 'https://aurora-production.up.railway.app';
  
  // Ensure the relative URL starts with /
  let relativeUrl = trimmedUrl;
  if (!relativeUrl.startsWith('/')) {
    relativeUrl = `/${relativeUrl}`;
  }
  
  // Remove any double slashes (except after http:// or https://)
  const normalized = `${baseUrl}${relativeUrl}`.replace(/([^:]\/)\/+/g, '$1');
  
  return normalized;
};

// Helper function to normalize message data (attachments and user avatars)
const normalizeMessage = (message: Message): Message => {
  const normalized: Message = {
    ...message,
    attachments: message.attachments?.map((attachment) => ({
      ...attachment,
      url: normalizeUrl(attachment.url) || attachment.url,
    })),
    sender: {
      ...message.sender,
      avatar: normalizeUrl(message.sender.avatar),
    },
    receiver: {
      ...message.receiver,
      avatar: normalizeUrl(message.receiver.avatar),
    },
  };
  
  return normalized;
};

// Helper function to normalize array of messages
const normalizeMessages = (messages: Message[]): Message[] => {
  return messages.map(normalizeMessage);
};

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'audio';
    url: string;
    filename?: string;
    duration?: number;
  }>;
  reactions?: Array<{
    emoji: string;
    users: User[];
  }>;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  user: User;
  lastMessage: {
    _id: string;
    content: string;
    attachments?: Array<{
      type: 'image' | 'file' | 'audio';
      url: string;
      filename?: string;
      duration?: number;
    }>;
    createdAt: string;
    isOwn: boolean;
  };
  unreadCount: number;
}

class MessageService {
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await apiService.get<Conversation[]>('/messages/conversations');
    // Normalize user avatars in conversations
    if (response.success && response.data) {
      response.data = response.data.map((conv) => ({
        ...conv,
        user: {
          ...conv.user,
          avatar: normalizeUrl(conv.user.avatar),
        },
      }));
    }
    return response;
  }

  async getConversation(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<Message[]>> {
    const response = await apiService.get<Message[]>(
      `/messages/conversation/${userId}?page=${page}&limit=${limit}`
    );
    // Normalize attachment URLs and user avatars
    if (response.success && response.data) {
      response.data = normalizeMessages(response.data);
    }
    return response;
  }

  async sendMessage(
    receiverId: string,
    content: string,
    attachments?: Array<{
      type: 'image' | 'file' | 'audio';
      url: string;
      filename?: string;
      duration?: number;
    }>
  ): Promise<ApiResponse<Message>> {
    // Only include attachments if array is not empty
    const payload: any = {
      receiverId,
      content,
    };
    
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments;
    }
    
    const response = await apiService.post<Message>('/messages', payload);
    // Normalize attachment URLs and user avatars in response
    if (response.success && response.data) {
      response.data = normalizeMessage(response.data);
    }
    return response;
  }

  async markAsRead(messageId: string): Promise<ApiResponse<Message>> {
    const response = await apiService.put<Message>(`/messages/${messageId}/read`, {});
    // Normalize attachment URLs and user avatars in response
    if (response.success && response.data) {
      response.data = normalizeMessage(response.data);
    }
    return response;
  }

  async reactToMessage(messageId: string, emoji: string): Promise<ApiResponse<Message>> {
    const response = await apiService.post<Message>(`/messages/${messageId}/react`, { emoji });
    // Normalize attachment URLs and user avatars in response
    if (response.success && response.data) {
      response.data = normalizeMessage(response.data);
    }
    return response;
  }

  async searchMessages(userId: string, query: string): Promise<ApiResponse<Message[]>> {
    const response = await apiService.get<Message[]>(`/messages/conversation/${userId}/search?q=${encodeURIComponent(query)}`);
    // Normalize attachment URLs and user avatars in response
    if (response.success && response.data) {
      response.data = normalizeMessages(response.data);
    }
    return response;
  }

  async deleteConversation(userId: string): Promise<ApiResponse<{ deletedCount: number }>> {
    return apiService.delete<{ deletedCount: number }>(`/messages/conversation/${userId}`);
  }
}

export const messageService = new MessageService();






