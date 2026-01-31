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
exports.getGroupPosts = exports.leaveGroup = exports.joinGroup = exports.createGroup = exports.getGroup = exports.getGroups = void 0;
var Group_1 = require("../models/Group");
var Post_1 = require("../models/Post");
var Notification_1 = require("../models/Notification");
// @desc    Get all groups
// @route   GET /api/groups
// @access  Public
var getGroups = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, search, tag, query, privacyQuery, andConditions, groups, total, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                search = req.query.search;
                tag = req.query.tag;
                query = {};
                privacyQuery = [];
                if (req.userId) {
                    privacyQuery.push({ isPrivate: false }, { members: req.userId });
                }
                else {
                    privacyQuery.push({ isPrivate: false });
                }
                andConditions = [{ $or: privacyQuery }];
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
                if (andConditions.length > 1) {
                    query.$and = andConditions;
                }
                else {
                    query.$or = privacyQuery;
                }
                console.log('Groups query:', JSON.stringify(query, null, 2));
                return [4 /*yield*/, Group_1.default.find(query)
                        .populate('admins', 'username displayName avatar')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)];
            case 1:
                groups = _a.sent();
                return [4 /*yield*/, Group_1.default.countDocuments(query)];
            case 2:
                total = _a.sent();
                console.log("Found ".concat(groups.length, " groups (total: ").concat(total, ")"));
                res.json({
                    success: true,
                    data: groups.map(function (group) { return (__assign(__assign({}, group.toObject()), { memberCount: group.members.length, isMember: req.userId ? group.members.some(function (m) { return m.toString() === req.userId; }) : false })); }),
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
                    message: error_1.message || 'Error fetching groups',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getGroups = getGroups;
// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Public
var getGroup = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var group, isMember, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Group_1.default.findById(req.params.id)
                        .populate('admins', 'username displayName avatar')
                        .populate('members', 'username displayName avatar')];
            case 1:
                group = _a.sent();
                if (!group) {
                    res.status(404).json({
                        success: false,
                        message: 'Group not found',
                    });
                    return [2 /*return*/];
                }
                // Check access for private groups
                if (group.isPrivate && req.userId) {
                    isMember = group.members.some(function (m) { return m._id.toString() === req.userId; });
                    if (!isMember) {
                        res.status(403).json({
                            success: false,
                            message: 'This is a private group',
                        });
                        return [2 /*return*/];
                    }
                }
                res.json({
                    success: true,
                    data: __assign(__assign({}, group.toObject()), { memberCount: group.members.length, isMember: req.userId ? group.members.some(function (m) { return m._id.toString() === req.userId; }) : false, isAdmin: req.userId ? group.admins.some(function (a) { return a._id.toString() === req.userId; }) : false }),
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Error fetching group',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getGroup = getGroup;
// @desc    Create group
// @route   POST /api/groups
// @access  Private
var createGroup = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, description, tags, isPrivate, group, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, name_1 = _a.name, description = _a.description, tags = _a.tags, isPrivate = _a.isPrivate;
                return [4 /*yield*/, Group_1.default.create({
                        name: name_1,
                        description: description,
                        tags: tags || [],
                        isPrivate: isPrivate || false,
                        members: [req.userId],
                        admins: [req.userId],
                    })];
            case 1:
                group = _b.sent();
                return [4 /*yield*/, group.populate('admins', 'username displayName avatar')];
            case 2:
                _b.sent();
                res.status(201).json({
                    success: true,
                    data: __assign(__assign({}, group.toObject()), { memberCount: 1, isMember: true, isAdmin: true }),
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Error creating group',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createGroup = createGroup;
// @desc    Join group
// @route   POST /api/groups/:id/join
// @access  Private
var joinGroup = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var group, _i, _a, adminId, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                return [4 /*yield*/, Group_1.default.findById(req.params.id)];
            case 1:
                group = _b.sent();
                if (!group) {
                    res.status(404).json({
                        success: false,
                        message: 'Group not found',
                    });
                    return [2 /*return*/];
                }
                // Check if already a member
                if (group.members.some(function (m) { return m.toString() === req.userId; })) {
                    res.status(400).json({
                        success: false,
                        message: 'Already a member of this group',
                    });
                    return [2 /*return*/];
                }
                group.members.push(req.userId);
                return [4 /*yield*/, group.save()];
            case 2:
                _b.sent();
                _i = 0, _a = group.admins;
                _b.label = 3;
            case 3:
                if (!(_i < _a.length)) return [3 /*break*/, 6];
                adminId = _a[_i];
                if (!(adminId.toString() !== req.userId)) return [3 /*break*/, 5];
                return [4 /*yield*/, Notification_1.default.create({
                        user: adminId,
                        type: 'group_join',
                        relatedUser: req.userId,
                        relatedGroup: group._id,
                        message: 'joined your group',
                    })];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                res.json({
                    success: true,
                    message: 'Joined group successfully',
                    data: {
                        memberCount: group.members.length,
                        isMember: true,
                    },
                });
                return [3 /*break*/, 8];
            case 7:
                error_4 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_4.message || 'Error joining group',
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.joinGroup = joinGroup;
// @desc    Leave group
// @route   POST /api/groups/:id/leave
// @access  Private
var leaveGroup = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var group, memberIndex, adminIndex, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Group_1.default.findById(req.params.id)];
            case 1:
                group = _a.sent();
                if (!group) {
                    res.status(404).json({
                        success: false,
                        message: 'Group not found',
                    });
                    return [2 /*return*/];
                }
                memberIndex = group.members.findIndex(function (m) { return m.toString() === req.userId; });
                if (memberIndex === -1) {
                    res.status(400).json({
                        success: false,
                        message: 'Not a member of this group',
                    });
                    return [2 /*return*/];
                }
                // Remove from members
                group.members.splice(memberIndex, 1);
                adminIndex = group.admins.findIndex(function (a) { return a.toString() === req.userId; });
                if (adminIndex !== -1) {
                    group.admins.splice(adminIndex, 1);
                }
                return [4 /*yield*/, group.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Left group successfully',
                    data: {
                        memberCount: group.members.length,
                        isMember: false,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_5.message || 'Error leaving group',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.leaveGroup = leaveGroup;
// @desc    Get posts in group
// @route   GET /api/groups/:id/posts
// @access  Public/Private (based on group privacy)
var getGroupPosts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, group, isMember, posts, total, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                return [4 /*yield*/, Group_1.default.findById(req.params.id)];
            case 1:
                group = _a.sent();
                if (!group) {
                    res.status(404).json({
                        success: false,
                        message: 'Group not found',
                    });
                    return [2 /*return*/];
                }
                // Check access for private groups
                if (group.isPrivate) {
                    isMember = group.members.some(function (m) { return m.toString() === req.userId; });
                    if (!isMember) {
                        res.status(403).json({
                            success: false,
                            message: 'This is a private group',
                        });
                        return [2 /*return*/];
                    }
                }
                return [4 /*yield*/, Post_1.default.find({ groupId: req.params.id })
                        .populate('author', 'username displayName avatar')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)];
            case 2:
                posts = _a.sent();
                return [4 /*yield*/, Post_1.default.countDocuments({ groupId: req.params.id })];
            case 3:
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
                return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_6.message || 'Error fetching group posts',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getGroupPosts = getGroupPosts;
