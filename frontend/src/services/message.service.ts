import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
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
    createdAt: string;
    isOwn: boolean;
  };
  unreadCount: number;
}

class MessageService {
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiService.get<Conversation[]>('/messages/conversations');
  }

  async getConversation(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<Message[]>> {
    return apiService.get<Message[]>(
      `/messages/conversation/${userId}?page=${page}&limit=${limit}`
    );
  }

  async sendMessage(
    receiverId: string,
    content: string
  ): Promise<ApiResponse<Message>> {
    return apiService.post<Message>('/messages', {
      receiverId,
      content,
    });
  }

  async markAsRead(messageId: string): Promise<ApiResponse<Message>> {
    return apiService.put<Message>(`/messages/${messageId}/read`, {});
  }
}

export const messageService = new MessageService();





