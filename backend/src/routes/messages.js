"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var messageController_1 = require("../controllers/messageController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Validation
var messageValidation = [
    (0, express_validator_1.body)('receiverId').notEmpty().withMessage('Receiver ID is required'),
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ max: 2000 })
        .withMessage('Message cannot exceed 2000 characters'),
];
// Routes
router.get('/conversations', auth_1.protect, messageController_1.getConversations);
router.get('/conversation/:userId', auth_1.protect, messageController_1.getConversation);
router.post('/', auth_1.protect, messageValidation, messageController_1.sendMessage);
router.put('/:id/read', auth_1.protect, messageController_1.markAsRead);
exports.default = router;
