"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var journalController_1 = require("../controllers/journalController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Validation
var entryValidation = [
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ max: 10000 })
        .withMessage('Content cannot exceed 10000 characters'),
    (0, express_validator_1.body)('mood')
        .isInt({ min: 1, max: 10 })
        .withMessage('Mood must be between 1 and 10'),
];
var updateValidation = [
    (0, express_validator_1.body)('content')
        .optional()
        .isLength({ max: 10000 })
        .withMessage('Content cannot exceed 10000 characters'),
    (0, express_validator_1.body)('mood')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Mood must be between 1 and 10'),
];
// All routes require authentication
router.use(auth_1.protect);
// Insights and prompts (before :id routes)
router.get('/insights', journalController_1.getInsights);
router.get('/prompt', journalController_1.getPrompt);
router.get('/aurora-context', journalController_1.getAuroraContext);
// CRUD routes
router.get('/', journalController_1.getEntries);
router.get('/:id', journalController_1.getEntry);
router.post('/', entryValidation, journalController_1.createEntry);
router.put('/:id', updateValidation, journalController_1.updateEntry);
router.delete('/:id', journalController_1.deleteEntry);
// AI analysis
router.post('/:id/analyze', journalController_1.analyzeEntry);
exports.default = router;
