import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

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
    content: string,
    attachments?: Array<{
      type: 'image' | 'file';
      url: string;
      filename?: string;
    }>
  ): Promise<ApiResponse<Message>> {
    // Only include attachments if array is not empty
    const payload: any = {
      receiverId,
      content,
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'message.service.ts:60',message:'Building payload',data:{receiverId,content,attachmentsCount:attachments?.length||0,hasAttachments:!!attachments&&attachments.length>0},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'message.service.ts:70',message:'Final payload before API call',data:{hasContent:!!payload.content,contentLength:payload.content?.length||0,hasAttachments:!!payload.attachments,attachmentsCount:payload.attachments?.length||0},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Console fallback logging
    console.log('📦 messageService payload:', {
      receiverId: payload.receiverId,
      content: payload.content || '(empty)',
      contentLength: payload.content?.length || 0,
      hasAttachments: !!payload.attachments,
      attachmentsCount: payload.attachments?.length || 0,
      payloadKeys: Object.keys(payload),
    });
    
    return apiService.post<Message>('/messages', payload);
  }

  async markAsRead(messageId: string): Promise<ApiResponse<Message>> {
    return apiService.put<Message>(`/messages/${messageId}/read`, {});
  }

  async reactToMessage(messageId: string, emoji: string): Promise<ApiResponse<Message>> {
    return apiService.post<Message>(`/messages/${messageId}/react`, { emoji });
  }

  async searchMessages(userId: string, query: string): Promise<ApiResponse<Message[]>> {
    return apiService.get<Message[]>(`/messages/conversation/${userId}/search?q=${encodeURIComponent(query)}`);
  }
}

export const messageService = new MessageService();






