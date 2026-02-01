import { Response } from 'express';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { sendNotificationToUser, sendUnreadCountUpdate } from './notificationWebSocket';

// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Get latest message from each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$readAt', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            username: '$user.username',
            displayName: '$user.displayName',
            avatar: '$user.avatar',
          },
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            isOwn: { $eq: ['$lastMessage.sender', userId] },
          },
          unreadCount: 1,
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching conversations',
    });
  }
};

// @desc    Get messages with a user
// @route   GET /api/messages/conversation/:userId
// @access  Private
export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username displayName avatar')
      .populate('receiver', 'username displayName avatar');

    const total = await Message.countDocuments({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId },
      ],
    });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: req.userId,
        readAt: null,
      },
      { readAt: new Date() }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
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
      message: error.message || 'Error fetching messages',
    });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiverId, content, attachments } = req.body;

    if (receiverId === req.userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself',
      });
      return;
    }

    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content: content || '',
      attachments: attachments || [],
    });

    await message.populate('sender', 'username displayName avatar');
    await message.populate('receiver', 'username displayName avatar');

    // Create notification
    const notification = await Notification.create({
      user: receiverId,
      type: 'message',
      relatedUser: req.userId,
      message: 'sent you a message',
    });

    await notification.populate('relatedUser', 'username displayName avatar');

    // Send notification via WebSocket
    await sendNotificationToUser(receiverId, notification);
    await sendUnreadCountUpdate(receiverId);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending message',
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found',
      });
      return;
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
      return;
    }

    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking message as read',
    });
  }
};






