"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var uploadController_1 = require("../controllers/uploadController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
router.post('/', auth_1.protect, uploadController_1.upload.single('file'), uploadController_1.uploadFile);
exports.default = router;
