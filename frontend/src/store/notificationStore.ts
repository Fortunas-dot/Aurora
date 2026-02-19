import { create } from 'zustand';
import { notificationService, Notification, NotificationType } from '../services/notification.service';

interface UnreadCountsByType {
  feed: number;      // likes, comments on posts
  groups: number;    // group_invite, group_join
  messages: number;  // message type (separate from chat messages)
  profile: number;   // follow
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  unreadByType: UnreadCountsByType;
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

// Helper to categorize notification types to tabs
const getTabForNotificationType = (type: NotificationType): keyof UnreadCountsByType => {
  switch (type) {
    case 'like':
    case 'comment':
      return 'feed';
    case 'group_invite':
    case 'group_join':
      return 'groups';
    case 'message':
      return 'messages';
    case 'follow':
      return 'profile';
    default:
      return 'feed';
  }
};

// Calculate unread counts by type from notifications array
const calculateUnreadByType = (notifications: Notification[]): UnreadCountsByType => {
  const counts: UnreadCountsByType = { feed: 0, groups: 0, messages: 0, profile: 0 };
  
  notifications.forEach((notif) => {
    if (!notif.read) {
      const tab = getTabForNotificationType(notif.type);
      counts[tab]++;
    }
  });
  
  return counts;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  unreadByType: { feed: 0, groups: 0, messages: 0, profile: 0 },
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
        
        set((state) => {
          const newNotifications = append ? [...(state.notifications || []), ...safeNotifications] : safeNotifications;
          return {
            notifications: newNotifications,
            unreadCount: safeUnreadCount,
            unreadByType: calculateUnreadByType(newNotifications),
            page: pageNum,
            hasMore: pagination ? pageNum < pagination.pages : false,
          };
        });
      } else {
        // If response is not successful, reset to empty state
        if (!append) {
          set({ notifications: [], unreadCount: 0, unreadByType: { feed: 0, groups: 0, messages: 0, profile: 0 }, hasMore: false });
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (!append) {
        set({ notifications: [], unreadCount: 0, unreadByType: { feed: 0, groups: 0, messages: 0, profile: 0 }, hasMore: false });
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
        set((state) => {
          const newNotifications = state.notifications.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          );
          return {
            notifications: newNotifications,
            unreadCount: Math.max(0, state.unreadCount - 1),
            unreadByType: calculateUnreadByType(newNotifications),
          };
        });
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
          unreadByType: { feed: 0, groups: 0, messages: 0, profile: 0 },
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
      unreadByType: { feed: 0, groups: 0, messages: 0, profile: 0 },
      page: 1,
      hasMore: true,
    });
  },
}));

