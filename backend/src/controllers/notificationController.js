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
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
var Notification_1 = require("../models/Notification");
// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
var getNotifications = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, notifications, total, unreadCount, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                return [4 /*yield*/, Notification_1.default.find({ user: req.userId })
                        .populate('relatedUser', 'username displayName avatar')
                        .populate('relatedPost', 'content')
                        .populate('relatedGroup', 'name')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)];
            case 1:
                notifications = _a.sent();
                return [4 /*yield*/, Notification_1.default.countDocuments({ user: req.userId })];
            case 2:
                total = _a.sent();
                return [4 /*yield*/, Notification_1.default.countDocuments({
                        user: req.userId,
                        read: false,
                    })];
            case 3:
                unreadCount = _a.sent();
                res.json({
                    success: true,
                    data: notifications,
                    unreadCount: unreadCount,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_1.message || 'Error fetching notifications',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getNotifications = getNotifications;
// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
var markAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var notification, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Notification_1.default.findById(req.params.id)];
            case 1:
                notification = _a.sent();
                if (!notification) {
                    res.status(404).json({
                        success: false,
                        message: 'Notification not found',
                    });
                    return [2 /*return*/];
                }
                // Check ownership
                if (notification.user.toString() !== req.userId) {
                    res.status(403).json({
                        success: false,
                        message: 'Not authorized',
                    });
                    return [2 /*return*/];
                }
                notification.read = true;
                return [4 /*yield*/, notification.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    data: notification,
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Error marking notification as read',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.markAsRead = markAsRead;
// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
var markAllAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Notification_1.default.updateMany({ user: req.userId, read: false }, { read: true })];
            case 1:
                _a.sent();
                res.json({
                    success: true,
                    message: 'All notifications marked as read',
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Error marking notifications as read',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.markAllAsRead = markAllAsRead;
