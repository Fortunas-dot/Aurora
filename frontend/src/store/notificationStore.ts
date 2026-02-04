import { create } from 'zustand';
import { notificationService, Notification } from '../services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  page: number;
  hasMore: boolean;
  
  // Actions
  loadNotifications: (page?: number, append?: boolean) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateUnreadCount: () => Promise<void>;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  page: 1,
  hasMore: true,

  loadNotifications: async (pageNum: number = 1, append: boolean = false) => {
    const { isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const response = await notificationService.getNotifications(pageNum, 20);
      
      if (response.success && response.data) {
        const { data: notifications, unreadCount, pagination } = response.data;
        
        // Safely handle undefined values
        const safeNotifications = notifications || [];
        const safeUnreadCount = unreadCount || 0;
        const safePagination = pagination || { pages: 1 };
        
        set((state) => ({
          notifications: append ? [...(state.notifications || []), ...safeNotifications] : safeNotifications,
          unreadCount: safeUnreadCount,
          page: pageNum,
          hasMore: pagination ? pageNum < pagination.pages : false,
        }));
      } else {
        // If response is not successful, reset to empty state
        if (!append) {
          set({ notifications: [], unreadCount: 0, hasMore: false });
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (!append) {
        set({ notifications: [], unreadCount: 0, hasMore: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  refreshNotifications: async () => {
    set({ isRefreshing: true, page: 1, hasMore: true });
    await get().loadNotifications(1, false);
    set({ isRefreshing: false });
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  updateUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      page: 1,
      hasMore: true,
    });
  },
}));

