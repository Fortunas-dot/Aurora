"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var postController_1 = require("../controllers/postController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Validation
var postValidation = [
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ max: 2000 })
        .withMessage('Content cannot exceed 2000 characters'),
];
// Routes
router.get('/', auth_1.optionalAuth, postController_1.getPosts);
router.get('/:id', auth_1.optionalAuth, postController_1.getPost);
router.post('/', auth_1.protect, postValidation, postController_1.createPost);
router.put('/:id', auth_1.protect, postValidation, postController_1.updatePost);
router.delete('/:id', auth_1.protect, postController_1.deletePost);
router.post('/:id/like', auth_1.protect, postController_1.likePost);
router.post('/:id/report', auth_1.protect, (0, express_validator_1.body)('reason').notEmpty(), postController_1.reportPost);
exports.default = router;
