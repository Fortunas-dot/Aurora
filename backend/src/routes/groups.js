"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var groupController_1 = require("../controllers/groupController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Validation
var groupValidation = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Group name is required')
        .isLength({ max: 100 })
        .withMessage('Group name cannot exceed 100 characters'),
];
// Routes
router.get('/', auth_1.optionalAuth, groupController_1.getGroups);
router.get('/:id', auth_1.optionalAuth, groupController_1.getGroup);
router.post('/', auth_1.protect, groupValidation, groupController_1.createGroup);
router.post('/:id/join', auth_1.protect, groupController_1.joinGroup);
router.post('/:id/leave', auth_1.protect, groupController_1.leaveGroup);
router.get('/:id/posts', auth_1.optionalAuth, groupController_1.getGroupPosts);
exports.default = router;
