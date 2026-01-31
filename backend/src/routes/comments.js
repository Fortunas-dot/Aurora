"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var commentController_1 = require("../controllers/commentController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Validation
var commentValidation = [
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ max: 1000 })
        .withMessage('Comment cannot exceed 1000 characters'),
];
// Routes
router.get('/post/:postId', auth_1.optionalAuth, commentController_1.getComments);
router.post('/', auth_1.protect, __spreadArray(__spreadArray([], commentValidation, true), [(0, express_validator_1.body)('postId').notEmpty()], false), commentController_1.createComment);
router.put('/:id', auth_1.protect, commentValidation, commentController_1.updateComment);
router.delete('/:id', auth_1.protect, commentController_1.deleteComment);
router.post('/:id/like', auth_1.protect, commentController_1.likeComment);
router.post('/:id/report', auth_1.protect, (0, express_validator_1.body)('reason').notEmpty(), commentController_1.reportComment);
exports.default = router;
