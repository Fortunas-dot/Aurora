"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.login = exports.register = void 0;
var User_1 = require("../models/User");
var helpers_1 = require("../utils/helpers");
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
var register = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, username, displayName, existingUser, user, token, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, email = _a.email, password = _a.password, username = _a.username, displayName = _a.displayName;
                return [4 /*yield*/, User_1.default.findOne({
                        $or: [{ email: email }, { username: username }],
                    })];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    res.status(400).json({
                        success: false,
                        message: existingUser.email === email
                            ? 'Email already registered'
                            : 'Username already taken',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, User_1.default.create({
                        email: email,
                        password: password,
                        username: username,
                        displayName: displayName || username,
                    })];
            case 2:
                user = _b.sent();
                token = (0, helpers_1.generateToken)(user._id.toString());
                res.status(201).json({
                    success: true,
                    data: {
                        user: (0, helpers_1.sanitizeUser)(user),
                        token: token,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_1.message || 'Server error during registration',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.register = register;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
var login = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, isMatch, token, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, User_1.default.findOne({ email: email }).select('+password')];
            case 1:
                user = _b.sent();
                if (!user) {
                    res.status(401).json({
                        success: false,
                        message: 'Invalid credentials',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, user.comparePassword(password)];
            case 2:
                isMatch = _b.sent();
                if (!isMatch) {
                    res.status(401).json({
                        success: false,
                        message: 'Invalid credentials',
                    });
                    return [2 /*return*/];
                }
                token = (0, helpers_1.generateToken)(user._id.toString());
                res.json({
                    success: true,
                    data: {
                        user: (0, helpers_1.sanitizeUser)(user),
                        token: token,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Server error during login',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.login = login;
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
var getMe = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, User_1.default.findById(req.userId)];
            case 1:
                user = _a.sent();
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found',
                    });
                    return [2 /*return*/];
                }
                res.json({
                    success: true,
                    data: (0, helpers_1.sanitizeUser)(user),
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Server error',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getMe = getMe;
// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
var logout = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
        return [2 /*return*/];
    });
}); };
exports.logout = logout;
