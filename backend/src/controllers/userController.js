"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.getUserPosts = exports.searchUsers = exports.updateProfile = exports.getUserProfile = void 0;
var User_1 = require("../models/User");
var Post_1 = require("../models/Post");
var helpers_1 = require("../utils/helpers");
// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
var getUserProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, postCount, publicProfile, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, User_1.default.findById(req.params.id)];
            case 1:
                user = _a.sent();
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, Post_1.default.countDocuments({ author: req.params.id })];
            case 2:
                postCount = _a.sent();
                publicProfile = __assign({ _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, bio: user.bio, createdAt: user.createdAt, postCount: postCount }, (user.showEmail && { email: user.email }));
                res.json({
                    success: true,
                    data: publicProfile,
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_1.message || 'Error fetching user profile',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUserProfile = getUserProfile;
// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
var updateProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, displayName, bio, avatar, isAnonymous, showEmail, existingUser, updateData, user, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, username = _a.username, displayName = _a.displayName, bio = _a.bio, avatar = _a.avatar, isAnonymous = _a.isAnonymous, showEmail = _a.showEmail;
                if (!username) return [3 /*break*/, 2];
                return [4 /*yield*/, User_1.default.findOne({
                        username: username,
                        _id: { $ne: req.userId },
                    })];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    res.status(400).json({
                        success: false,
                        message: 'Username already taken',
                    });
                    return [2 /*return*/];
                }
                _b.label = 2;
            case 2:
                updateData = {};
                if (username !== undefined)
                    updateData.username = username;
                if (displayName !== undefined)
                    updateData.displayName = displayName;
                if (bio !== undefined)
                    updateData.bio = bio;
                if (avatar !== undefined)
                    updateData.avatar = avatar;
                if (isAnonymous !== undefined)
                    updateData.isAnonymous = isAnonymous;
                if (showEmail !== undefined)
                    updateData.showEmail = showEmail;
                if (req.body.healthInfo !== undefined)
                    updateData.healthInfo = req.body.healthInfo;
                return [4 /*yield*/, User_1.default.findByIdAndUpdate(req.userId, updateData, { new: true, runValidators: true })];
            case 3:
                user = _b.sent();
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found',
                    });
                    return [2 /*return*/];
                }
                res.json({
                    success: true,
                    data: (0, helpers_1.sanitizeUser)(user),
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Error updating profile',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateProfile = updateProfile;
// @desc    Search users
// @route   GET /api/users/search
// @access  Public
var searchUsers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, page, limit, skip, users, total, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                query = req.query.q;
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                if (!query || query.length < 2) {
                    res.status(400).json({
                        success: false,
                        message: 'Search query must be at least 2 characters',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, User_1.default.find({
                        username: { $regex: query, $options: 'i' },
                    })
                        .select('username displayName avatar bio')
                        .skip(skip)
                        .limit(limit)];
            case 1:
                users = _a.sent();
                return [4 /*yield*/, User_1.default.countDocuments({
                        username: { $regex: query, $options: 'i' },
                    })];
            case 2:
                total = _a.sent();
                res.json({
                    success: true,
                    data: users,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Error searching users',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.searchUsers = searchUsers;
// @desc    Get user's posts
// @route   GET /api/users/:id/posts
// @access  Public
var getUserPosts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, posts, total, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                return [4 /*yield*/, Post_1.default.find({
                        author: req.params.id,
                        groupId: null, // Only public posts
                    })
                        .populate('author', 'username displayName avatar')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)];
            case 1:
                posts = _a.sent();
                return [4 /*yield*/, Post_1.default.countDocuments({
                        author: req.params.id,
                        groupId: null,
                    })];
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
                error_4 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_4.message || 'Error fetching user posts',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUserPosts = getUserPosts;
