"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var CommentSchema = new mongoose_1.Schema({
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        trim: true,
    },
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    reports: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            reason: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
}, {
    timestamps: true,
});
// Index for efficient querying
CommentSchema.index({ post: 1, createdAt: 1 });
exports.default = mongoose_1.default.model('Comment', CommentSchema);
