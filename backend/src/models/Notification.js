"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var NotificationSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'message', 'follow', 'group_invite', 'group_join'],
        required: true,
    },
    relatedUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    relatedPost: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
    },
    relatedGroup: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Group',
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Index for user notifications
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });
exports.default = mongoose_1.default.model('Notification', NotificationSchema);
