import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

export type NotificationType = 'like' | 'comment' | 'message' | 'follow' | 'group_invite' | 'group_join';

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  relatedUser?: User;
  relatedPost?: {
    _id: string;
    content: string;
  };
  relatedGroup?: {
    _id: string;
    name: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class NotificationService {
  async getNotifications(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ data: Notification[]; unreadCount: number; pagination: any }>> {
    return apiService.get<{ data: Notification[]; unreadCount: number; pagination: any }>(
      `/notifications?page=${page}&limit=${limit}`
    );
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    return apiService.put<Notification>(`/notifications/${notificationId}/read`, {});
  }

  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    return apiService.put<{ message: string }>('/notifications/read-all', {});
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.getNotifications(1, 1);
      if (response.success && response.data) {
        return response.data.unreadCount || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();

