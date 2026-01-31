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
        required: [true, 'Message content is required'],
        maxlength: [2000, 'Message cannot exceed 2000 characters'],
        trim: true,
    },
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
// Index for efficient conversation queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, readAt: 1 });
exports.default = mongoose_1.default.model('Message', MessageSchema);
