"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var GroupSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true,
        maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
        default: '',
    },
    tags: [{
            type: String,
            trim: true,
            lowercase: true,
        }],
    members: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    admins: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    isPrivate: {
        type: Boolean,
        default: false,
    },
    avatar: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
// Index for searching
GroupSchema.index({ name: 'text', description: 'text' });
GroupSchema.index({ tags: 1 });
exports.default = mongoose_1.default.model('Group', GroupSchema);
