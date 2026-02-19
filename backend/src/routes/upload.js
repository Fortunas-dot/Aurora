"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var multer_1 = require("multer");
var uploadController_1 = require("../controllers/uploadController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Wrap multer in error handler to return proper error messages
router.post('/', auth_1.protect, function (req, res, next) {
    uploadController_1.upload.single('file')(req, res, function (err) {
        if (err instanceof multer_1.default.MulterError) {
            console.error('Multer error:', err.message, err.code);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 50MB.' });
            }
            return res.status(400).json({ success: false, message: err.message });
        }
        else if (err) {
            console.error('Upload middleware error:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, uploadController_1.uploadFile);
exports.default = router;
