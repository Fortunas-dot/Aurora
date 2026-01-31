"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUser = exports.generateToken = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var generateToken = function (userId) {
    return jsonwebtoken_1.default.sign({ userId: userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};
exports.generateToken = generateToken;
var sanitizeUser = function (user) {
    var _a = user.toObject ? user.toObject() : user, password = _a.password, sanitized = __rest(_a, ["password"]);
    return sanitized;
};
exports.sanitizeUser = sanitizeUser;
