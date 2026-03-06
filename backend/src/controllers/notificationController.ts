import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { sendNotificationToUser, sendUnreadCountUpdate } from './notificationWebSocket';
import { parsePage, parseLimit, calculateSkip } from '../utils/pagination';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page as string);
    const limit = parseLimit(req.query.limit as string);
    const skip = calculateSkip(page, limit);

    const notifications = await Notification.find({ user: req.userId })
      .populate('relatedUser', 'username displayName avatar avatarCharacter avatarBackgroundColor nameColor')
      .populate('relatedPost', 'content title')
      .populate('relatedGroup', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out notifications where relatedUser is required but missing
    // This handles cases where the user was deleted or populate failed
    const notificationsWithUsers = notifications.filter((notification: any) => {
      const requiresUser = ['like', 'comment', 'message', 'follow', 'group_join', 'group_invite', 'journal_entry'].includes(notification.type);
      if (requiresUser && !notification.relatedUser) {
        // Log for debugging but don't show to user
        console.warn(`Notification ${notification._id} missing relatedUser for type ${notification.type}`);
        return false;
      }
      return true;
    });

    const total = await Notification.countDocuments({ user: req.userId });
    const unreadCount = await Notification.countDocuments({
      user: req.userId,
      read: false,
    });

    res.json({
      success: true,
      data: notificationsWithUsers,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notifications',
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
      return;
    }

    // Check ownership
    if (notification.user.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
      return;
    }

    notification.read = true;
    await notification.save();

    // Send unread count update via WebSocket
    await sendUnreadCountUpdate(notification.user.toString());

    res.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking notification as read',
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { user: req.userId, read: false },
      { read: true }
    );

    // Send unread count update via WebSocket
    await sendUnreadCountUpdate(req.userId!);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking notifications as read',
    });
  }
};






