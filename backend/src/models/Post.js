"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var PostSchema = new mongoose_1.Schema({
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        maxlength: [2000, 'Content cannot exceed 2000 characters'],
        trim: true,
    },
    tags: [{
            type: String,
            trim: true,
            lowercase: true,
        }],
    images: [{
            type: String,
        }],
    groupId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Group',
        default: null,
    },
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    commentsCount: {
        type: Number,
        default: 0,
    },
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
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ groupId: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('Post', PostSchema);
