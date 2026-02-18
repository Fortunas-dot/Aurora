import { Response } from 'express';
import Group from '../models/Group';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { sendNotificationToUser, sendUnreadCountUpdate } from './notificationWebSocket';

// @desc    Get all groups
// @route   GET /api/groups
// @access  Public
export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const tag = req.query.tag as string;
    const country = req.query.country as string;
    const healthCondition = req.query.healthCondition as string;

    const query: any = {};

    // Show public groups and user's private groups
    const privacyQuery: any[] = [];
    if (req.userId) {
      privacyQuery.push(
        { isPrivate: false },
        { members: req.userId }
      );
    } else {
      privacyQuery.push({ isPrivate: false });
    }

    const andConditions: any[] = [{ $or: privacyQuery }];

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (tag) {
      andConditions.push({ tags: tag.toLowerCase() });
    }

    if (country) {
      if (country.toLowerCase() === 'global') {
        andConditions.push({ country: 'global' });
      } else {
        // Normalize country code to uppercase (as stored in database)
        const normalizedCountry = country.toUpperCase();
        andConditions.push({ country: normalizedCountry });
      }
    }

    if (healthCondition) {
      andConditions.push({ healthCondition: healthCondition });
    }

    if (andConditions.length > 1) {
      query.$and = andConditions;
    } else {
      query.$or = privacyQuery;
    }

    console.log('Groups query:', JSON.stringify(query, null, 2));

    const groups = await Group.find(query)
      .populate('admins', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Group.countDocuments(query);

    console.log(`Found ${groups.length} groups (total: ${total})`);

    res.json({
      success: true,
      data: groups.map((group) => ({
        ...group.toObject(),
        memberCount: group.members.length,
        isMember: req.userId ? group.members.some((m) => m.toString() === req.userId) : false,
      })),
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
      message: error.message || 'Error fetching groups',
    });
  }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Public
export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admins', 'username displayName avatar')
      .populate('members', 'username displayName avatar');

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    // Check access for private groups
    if (group.isPrivate && req.userId) {
      const isMember = group.members.some((m: any) => m._id.toString() === req.userId);
      if (!isMember) {
        res.status(403).json({
          success: false,
          message: 'This is a private group',
        });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        ...group.toObject(),
        memberCount: group.members.length,
        isMember: req.userId ? group.members.some((m: any) => m._id.toString() === req.userId) : false,
        isAdmin: req.userId ? group.admins.some((a: any) => a._id.toString() === req.userId) : false,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching group',
    });
  }
};

// @desc    Create group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, tags, isPrivate, country, avatar, coverImage, healthCondition } = req.body;

    const group = await Group.create({
      name,
      description,
      tags: tags || [],
      isPrivate: isPrivate || false,
      country: country || 'global',
      avatar: avatar || null,
      coverImage: coverImage || null,
      healthCondition: healthCondition || null,
      members: [req.userId],
      admins: [req.userId],
    });

    await group.populate('admins', 'username displayName avatar');

    res.status(201).json({
      success: true,
      data: {
        ...group.toObject(),
        memberCount: 1,
        isMember: true,
        isAdmin: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating group',
    });
  }
};

// @desc    Join group
// @route   POST /api/groups/:id/join
// @access  Private
export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    // Check if already a member
    if (group.members.some((m) => m.toString() === req.userId)) {
      res.status(400).json({
        success: false,
        message: 'Already a member of this group',
      });
      return;
    }

    group.members.push(req.userId as any);
    await group.save();

    // Notify admins
    for (const adminId of group.admins) {
      if (adminId.toString() !== req.userId) {
        const notification = await Notification.create({
          user: adminId,
          type: 'group_join',
          relatedUser: req.userId,
          relatedGroup: group._id,
          message: 'joined your group',
        });

        await notification.populate('relatedUser', 'username displayName avatar');
        await notification.populate('relatedGroup', 'name');

        // Send notification via WebSocket
        await sendNotificationToUser(adminId.toString(), notification);
        await sendUnreadCountUpdate(adminId.toString());
      }
    }

    res.json({
      success: true,
      message: 'Joined group successfully',
      data: {
        memberCount: group.members.length,
        isMember: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error joining group',
    });
  }
};

// @desc    Leave group
// @route   POST /api/groups/:id/leave
// @access  Private
export const leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    // Check if member
    const memberIndex = group.members.findIndex((m) => m.toString() === req.userId);
    if (memberIndex === -1) {
      res.status(400).json({
        success: false,
        message: 'Not a member of this group',
      });
      return;
    }

    // Remove from members
    group.members.splice(memberIndex, 1);

    // Remove from admins if applicable
    const adminIndex = group.admins.findIndex((a) => a.toString() === req.userId);
    if (adminIndex !== -1) {
      group.admins.splice(adminIndex, 1);
    }

    await group.save();

    res.json({
      success: true,
      message: 'Left group successfully',
      data: {
        memberCount: group.members.length,
        isMember: false,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error leaving group',
    });
  }
};

// @desc    Update group (admin only)
// @route   PUT /api/groups/:id
// @access  Private (Admin only)
export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    // Check if user is admin
    const isAdmin = group.admins.some((a) => a.toString() === req.userId);
    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Only admins can update group settings',
      });
      return;
    }

    const { name, description, tags, isPrivate, country, avatar, coverImage, healthCondition } = req.body;

    // Update fields
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (tags !== undefined) group.tags = tags;
    if (isPrivate !== undefined) group.isPrivate = isPrivate;
    if (country !== undefined) group.country = country;
    if (avatar !== undefined) group.avatar = avatar;
    if (coverImage !== undefined) group.coverImage = coverImage;
    if (healthCondition !== undefined) group.healthCondition = healthCondition;

    await group.save();
    await group.populate('admins', 'username displayName avatar');

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: {
        ...group.toObject(),
        memberCount: group.members.length,
        isMember: group.members.some((m: any) => m.toString() === req.userId),
        isAdmin: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating group',
    });
  }
};

// @desc    Get posts in group
// @route   GET /api/groups/:id/posts
// @access  Public/Private (based on group privacy)
export const getGroupPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    // Check access for private groups
    if (group.isPrivate) {
      const isMember = group.members.some((m) => m.toString() === req.userId);
      if (!isMember) {
        res.status(403).json({
          success: false,
          message: 'This is a private group',
        });
        return;
      }
    }

    const posts = await Post.find({ groupId: req.params.id })
      .populate('author', 'username displayName avatar')
      .populate('groupId', 'name description tags memberCount isPrivate avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out posts with invalid IDs or missing author
    const validPosts = posts.filter((post: any) => {
      if (!post || !post._id) return false;
      const postId = post._id.toString();
      if (!/^[0-9a-fA-F]{24}$/.test(postId)) return false;
      if (!post.author || !post.author._id) return false;
      return true;
    });

    // Format group info
    const postsWithGroup = validPosts.map((post: any) => ({
      ...post.toObject(),
      group: post.groupId ? {
        _id: post.groupId._id,
        name: post.groupId.name,
        description: post.groupId.description,
        tags: post.groupId.tags,
        memberCount: post.groupId.memberCount,
        isPrivate: post.groupId.isPrivate,
        avatar: post.groupId.avatar,
      } : undefined,
    }));

    const total = validPosts.length;

    res.json({
      success: true,
      data: postsWithGroup,
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
      message: error.message || 'Error fetching group posts',
    });
  }
};

