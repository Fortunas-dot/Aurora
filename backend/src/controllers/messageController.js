"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.sendMessage = exports.getConversation = exports.getConversations = void 0;
var Message_1 = require("../models/Message");
var Notification_1 = require("../models/Notification");
var mongoose_1 = require("mongoose");
// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
var getConversations = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, conversations, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = new mongoose_1.default.Types.ObjectId(req.userId);
                return [4 /*yield*/, Message_1.default.aggregate([
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
                    ])];
            case 1:
                conversations = _a.sent();
                res.json({
                    success: true,
                    data: conversations,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_1.message || 'Error fetching conversations',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getConversations = getConversations;
// @desc    Get messages with a user
// @route   GET /api/messages/conversation/:userId
// @access  Private
var getConversation = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, otherUserId, messages, total, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 50;
                skip = (page - 1) * limit;
                otherUserId = req.params.userId;
                return [4 /*yield*/, Message_1.default.find({
                        $or: [
                            { sender: req.userId, receiver: otherUserId },
                            { sender: otherUserId, receiver: req.userId },
                        ],
                    })
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .populate('sender', 'username displayName avatar')
                        .populate('receiver', 'username displayName avatar')];
            case 1:
                messages = _a.sent();
                return [4 /*yield*/, Message_1.default.countDocuments({
                        $or: [
                            { sender: req.userId, receiver: otherUserId },
                            { sender: otherUserId, receiver: req.userId },
                        ],
                    })];
            case 2:
                total = _a.sent();
                // Mark messages as read
                return [4 /*yield*/, Message_1.default.updateMany({
                        sender: otherUserId,
                        receiver: req.userId,
                        readAt: null,
                    }, { readAt: new Date() })];
            case 3:
                // Mark messages as read
                _a.sent();
                res.json({
                    success: true,
                    data: messages.reverse(), // Return in chronological order
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Error fetching messages',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getConversation = getConversation;
// @desc    Send message
// @route   POST /api/messages
// @access  Private
var sendMessage = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, receiverId, content, message, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, receiverId = _a.receiverId, content = _a.content;
                if (receiverId === req.userId) {
                    res.status(400).json({
                        success: false,
                        message: 'Cannot send message to yourself',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, Message_1.default.create({
                        sender: req.userId,
                        receiver: receiverId,
                        content: content,
                    })];
            case 1:
                message = _b.sent();
                return [4 /*yield*/, message.populate('sender', 'username displayName avatar')];
            case 2:
                _b.sent();
                return [4 /*yield*/, message.populate('receiver', 'username displayName avatar')];
            case 3:
                _b.sent();
                // Create notification
                return [4 /*yield*/, Notification_1.default.create({
                        user: receiverId,
                        type: 'message',
                        relatedUser: req.userId,
                        message: 'sent you a message',
                    })];
            case 4:
                // Create notification
                _b.sent();
                res.status(201).json({
                    success: true,
                    data: message,
                });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Error sending message',
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.sendMessage = sendMessage;
// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
var markAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Message_1.default.findById(req.params.id)];
            case 1:
                message = _a.sent();
                if (!message) {
                    res.status(404).json({
                        success: false,
                        message: 'Message not found',
                    });
                    return [2 /*return*/];
                }
                // Only receiver can mark as read
                if (message.receiver.toString() !== req.userId) {
                    res.status(403).json({
                        success: false,
                        message: 'Not authorized',
                    });
                    return [2 /*return*/];
                }
                message.readAt = new Date();
                return [4 /*yield*/, message.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    data: message,
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_4.message || 'Error marking message as read',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.markAsRead = markAsRead;
