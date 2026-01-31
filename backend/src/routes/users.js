"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var userController_1 = require("../controllers/userController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Routes
router.get('/search', userController_1.searchUsers);
router.get('/:id', auth_1.optionalAuth, userController_1.getUserProfile);
router.get('/:id/posts', auth_1.optionalAuth, userController_1.getUserPosts);
router.put('/profile', auth_1.protect, userController_1.updateProfile);
exports.default = router;
