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
exports.reportComment = exports.likeComment = exports.deleteComment = exports.updateComment = exports.createComment = exports.getComments = void 0;
var Comment_1 = require("../models/Comment");
var Post_1 = require("../models/Post");
var Notification_1 = require("../models/Notification");
// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
var getComments = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, comments, total, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                return [4 /*yield*/, Comment_1.default.find({ post: req.params.postId })
                        .populate('author', 'username displayName avatar')
                        .sort({ createdAt: 1 })
                        .skip(skip)
                        .limit(limit)];
            case 1:
                comments = _a.sent();
                return [4 /*yield*/, Comment_1.default.countDocuments({ post: req.params.postId })];
            case 2:
                total = _a.sent();
                res.json({
                    success: true,
                    data: comments,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_1.message || 'Error fetching comments',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getComments = getComments;
// @desc    Create comment
// @route   POST /api/comments
// @access  Private
var createComment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, postId, content, post, comment, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                _a = req.body, postId = _a.postId, content = _a.content;
                return [4 /*yield*/, Post_1.default.findById(postId)];
            case 1:
                post = _b.sent();
                if (!post) {
                    res.status(404).json({
                        success: false,
                        message: 'Post not found',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, Comment_1.default.create({
                        post: postId,
                        author: req.userId,
                        content: content,
                    })];
            case 2:
                comment = _b.sent();
                // Update post comment count
                post.commentsCount += 1;
                return [4 /*yield*/, post.save()];
            case 3:
                _b.sent();
                if (!(post.author.toString() !== req.userId)) return [3 /*break*/, 5];
                return [4 /*yield*/, Notification_1.default.create({
                        user: post.author,
                        type: 'comment',
                        relatedUser: req.userId,
                        relatedPost: postId,
                        message: 'commented on your post',
                    })];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5: return [4 /*yield*/, comment.populate('author', 'username displayName avatar')];
            case 6:
                _b.sent();
                res.status(201).json({
                    success: true,
                    data: comment,
                });
                return [3 /*break*/, 8];
            case 7:
                error_2 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Error creating comment',
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.createComment = createComment;
// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
var updateComment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, comment, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                content = req.body.content;
                return [4 /*yield*/, Comment_1.default.findById(req.params.id)];
            case 1:
                comment = _a.sent();
                if (!comment) {
                    res.status(404).json({
                        success: false,
                        message: 'Comment not found',
                    });
                    return [2 /*return*/];
                }
                // Check ownership
                if (comment.author.toString() !== req.userId) {
                    res.status(403).json({
                        success: false,
                        message: 'Not authorized to update this comment',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, Comment_1.default.findByIdAndUpdate(req.params.id, { content: content }, { new: true, runValidators: true }).populate('author', 'username displayName avatar')];
            case 2:
                comment = _a.sent();
                res.json({
                    success: true,
                    data: comment,
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Error updating comment',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateComment = updateComment;
// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
var deleteComment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var comment, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, Comment_1.default.findById(req.params.id)];
            case 1:
                comment = _a.sent();
                if (!comment) {
                    res.status(404).json({
                        success: false,
                        message: 'Comment not found',
                    });
                    return [2 /*return*/];
                }
                // Check ownership
                if (comment.author.toString() !== req.userId) {
                    res.status(403).json({
                        success: false,
                        message: 'Not authorized to delete this comment',
                    });
                    return [2 /*return*/];
                }
                // Update post comment count
                return [4 /*yield*/, Post_1.default.findByIdAndUpdate(comment.post, {
                        $inc: { commentsCount: -1 },
                    })];
            case 2:
                // Update post comment count
                _a.sent();
                return [4 /*yield*/, comment.deleteOne()];
            case 3:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Comment deleted',
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_4.message || 'Error deleting comment',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteComment = deleteComment;
// @desc    Like/unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
var likeComment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var comment, userId_1, likeIndex, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Comment_1.default.findById(req.params.id)];
            case 1:
                comment = _a.sent();
                if (!comment) {
                    res.status(404).json({
                        success: false,
                        message: 'Comment not found',
                    });
                    return [2 /*return*/];
                }
                userId_1 = req.userId;
                likeIndex = comment.likes.findIndex(function (id) { return id.toString() === userId_1; });
                if (likeIndex === -1) {
                    comment.likes.push(userId_1);
                }
                else {
                    comment.likes.splice(likeIndex, 1);
                }
                return [4 /*yield*/, comment.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    data: {
                        likes: comment.likes.length,
                        isLiked: likeIndex === -1,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_5.message || 'Error liking comment',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.likeComment = likeComment;
// @desc    Report comment
// @route   POST /api/comments/:id/report
// @access  Private
var reportComment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var reason, comment, alreadyReported, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                reason = req.body.reason;
                return [4 /*yield*/, Comment_1.default.findById(req.params.id)];
            case 1:
                comment = _a.sent();
                if (!comment) {
                    res.status(404).json({
                        success: false,
                        message: 'Comment not found',
                    });
                    return [2 /*return*/];
                }
                alreadyReported = comment.reports.some(function (r) { return r.user.toString() === req.userId; });
                if (alreadyReported) {
                    res.status(400).json({
                        success: false,
                        message: 'You have already reported this comment',
                    });
                    return [2 /*return*/];
                }
                comment.reports.push({
                    user: req.userId,
                    reason: reason,
                    createdAt: new Date(),
                });
                return [4 /*yield*/, comment.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Comment reported',
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_6.message || 'Error reporting comment',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.reportComment = reportComment;
