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
exports.reportPost = exports.likePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getPosts = void 0;
var Post_1 = require("../models/Post");
var Notification_1 = require("../models/Notification");
// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Public
var getPosts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, tag, groupId, query, posts, total, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                tag = req.query.tag;
                groupId = req.query.groupId;
                query = {};
                if (tag) {
                    query.tags = tag.toLowerCase();
                }
                if (groupId) {
                    query.groupId = groupId;
                }
                else {
                    // Public feed - no group posts
                    query.groupId = null;
                }
                return [4 /*yield*/, Post_1.default.find(query)
                        .populate('author', 'username displayName avatar')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)];
            case 1:
                posts = _a.sent();
                return [4 /*yield*/, Post_1.default.countDocuments(query)];
            case 2:
                total = _a.sent();
                res.json({
                    success: true,
                    data: posts,
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
                    message: error_1.message || 'Error fetching posts',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getPosts = getPosts;
// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
var getPost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Post_1.default.findById(req.params.id)
                        .populate('author', 'username displayName avatar')];
            case 1:
                post = _a.sent();
                if (!post) {
                    res.status(404).json({
                        success: false,
                        message: 'Post not found',
                    });
                    return [2 /*return*/];
                }
                res.json({
                    success: true,
                    data: post,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Error fetching post',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPost = getPost;
// @desc    Create post
// @route   POST /api/posts
// @access  Private
var createPost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, tags, groupId, images, post, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, content = _a.content, tags = _a.tags, groupId = _a.groupId, images = _a.images;
                return [4 /*yield*/, Post_1.default.create({
                        author: req.userId,
                        content: content,
                        tags: tags || [],
                        images: images || [],
                        groupId: groupId || null,
                    })];
            case 1:
                post = _b.sent();
                return [4 /*yield*/, post.populate('author', 'username displayName avatar')];
            case 2:
                _b.sent();
                res.status(201).json({
                    success: true,
                    data: post,
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Error creating post',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createPost = createPost;
// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
var updatePost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, tags, post, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, content = _a.content, tags = _a.tags;
                return [4 /*yield*/, Post_1.default.findById(req.params.id)];
            case 1:
                post = _b.sent();
                if (!post) {
                    res.status(404).json({
                        success: false,
                        message: 'Post not found',
                    });
                    return [2 /*return*/];
                }
                // Check ownership
                if (post.author.toString() !== req.userId) {
                    res.status(403).json({
                        success: false,
                        message: 'Not authorized to update this post',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, Post_1.default.findByIdAndUpdate(req.params.id, { content: content, tags: tags }, { new: true, runValidators: true }).populate('author', 'username displayName avatar')];
            case 2:
                post = _b.sent();
                res.json({
                    success: true,
                    data: post,
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_4.message || 'Error updating post',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updatePost = updatePost;
// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
var deletePost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Post_1.default.findById(req.params.id)];
            case 1:
                post = _a.sent();
                if (!post) {
                    res.status(404).json({
                        success: false,
                        message: 'Post not found',
                    });
                    return [2 /*return*/];
                }
                // Check ownership
                if (post.author.toString() !== req.userId) {
                    res.status(403).json({
                        success: false,
                        message: 'Not authorized to delete this post',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, post.deleteOne()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Post deleted',
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_5.message || 'Error deleting post',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deletePost = deletePost;
// @desc    Like/unlike post
// @route   POST /api/posts/:id/like
// @access  Private
var likePost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post, userId_1, likeIndex, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                return [4 /*yield*/, Post_1.default.findById(req.params.id)];
            case 1:
                post = _a.sent();
                if (!post) {
                    res.status(404).json({
                        success: false,
                        message: 'Post not found',
                    });
                    return [2 /*return*/];
                }
                userId_1 = req.userId;
                likeIndex = post.likes.findIndex(function (id) { return id.toString() === userId_1; });
                if (!(likeIndex === -1)) return [3 /*break*/, 4];
                // Like
                post.likes.push(userId_1);
                if (!(post.author.toString() !== userId_1)) return [3 /*break*/, 3];
                return [4 /*yield*/, Notification_1.default.create({
                        user: post.author,
                        type: 'like',
                        relatedUser: userId_1,
                        relatedPost: post._id,
                        message: 'liked your post',
                    })];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                // Unlike
                post.likes.splice(likeIndex, 1);
                _a.label = 5;
            case 5: return [4 /*yield*/, post.save()];
            case 6:
                _a.sent();
                res.json({
                    success: true,
                    data: {
                        likes: post.likes.length,
                        isLiked: likeIndex === -1,
                    },
                });
                return [3 /*break*/, 8];
            case 7:
                error_6 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_6.message || 'Error liking post',
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.likePost = likePost;
// @desc    Report post
// @route   POST /api/posts/:id/report
// @access  Private
var reportPost = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var reason, post, alreadyReported, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                reason = req.body.reason;
                return [4 /*yield*/, Post_1.default.findById(req.params.id)];
            case 1:
                post = _a.sent();
                if (!post) {
                    res.status(404).json({
                        success: false,
                        message: 'Post not found',
                    });
                    return [2 /*return*/];
                }
                alreadyReported = post.reports.some(function (r) { return r.user.toString() === req.userId; });
                if (alreadyReported) {
                    res.status(400).json({
                        success: false,
                        message: 'You have already reported this post',
                    });
                    return [2 /*return*/];
                }
                post.reports.push({
                    user: req.userId,
                    reason: reason,
                    createdAt: new Date(),
                });
                return [4 /*yield*/, post.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Post reported',
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_7.message || 'Error reporting post',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.reportPost = reportPost;
