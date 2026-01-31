"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var notificationController_1 = require("../controllers/notificationController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Routes
router.get('/', auth_1.protect, notificationController_1.getNotifications);
router.put('/read-all', auth_1.protect, notificationController_1.markAllAsRead);
router.put('/:id/read', auth_1.protect, notificationController_1.markAsRead);
exports.default = router;
