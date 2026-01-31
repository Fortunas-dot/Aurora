"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
var errorHandler = function (err, req, res, next) {
    console.error('Error:', err.message);
    // Mongoose duplicate key error
    if (err.code === 11000) {
        res.status(400).json({
            success: false,
            message: 'Duplicate field value entered',
        });
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired',
        });
        return;
    }
    var statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error',
    });
};
exports.errorHandler = errorHandler;
