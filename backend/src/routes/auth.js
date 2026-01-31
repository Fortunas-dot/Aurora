"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var authController_1 = require("../controllers/authController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Validation rules
var registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
];
var loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
// Routes
router.post('/register', registerValidation, authController_1.register);
router.post('/login', loginValidation, authController_1.login);
router.get('/me', auth_1.protect, authController_1.getMe);
router.post('/logout', auth_1.protect, authController_1.logout);
exports.default = router;
