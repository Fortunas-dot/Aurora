"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var MessageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: false,
        maxlength: [2000, 'Message cannot exceed 2000 characters'],
        trim: true,
        default: '',
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'file', 'audio'],
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        filename: {
            type: String,
        },
        duration: {
            type: Number,
        },
    }],
    reactions: [{
        emoji: {
            type: String,
            required: true,
        },
        users: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    }],
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
// Pre-save validation: message must have either content or attachments
MessageSchema.pre('save', function (next) {
    var message = this;
    var hasContent = message.content && message.content.trim().length > 0;
    var hasAttachments = message.attachments && message.attachments.length > 0;
    if (!hasContent && !hasAttachments) {
        var error = new Error('Message must have either content or attachments');
        return next(error);
    }
    next();
});
// Index for efficient conversation queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, readAt: 1 });
exports.default = mongoose_1.default.model('Message', MessageSchema);
