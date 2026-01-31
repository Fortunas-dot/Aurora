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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuroraContext = exports.getPrompt = exports.analyzeEntry = exports.getInsights = exports.deleteEntry = exports.updateEntry = exports.createEntry = exports.getEntry = exports.getEntries = void 0;
var JournalEntry_1 = require("../models/JournalEntry");
var User_1 = require("../models/User");
var openai_1 = require("openai");
// Lazy-load OpenAI client only when needed and if API key is available
var getOpenAIClient = function () {
    var apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn('⚠️  OPENAI_API_KEY not set - OpenAI features will be disabled');
        return null;
    }
    try {
        return new openai_1.default({ apiKey: apiKey });
    }
    catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        return null;
    }
};
// Initialize OpenAI client (can be null if API key is missing)
var openai = getOpenAIClient();
// @desc    Get all journal entries for current user
// @route   GET /api/journal
// @access  Private
var getEntries = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, startDate, endDate, mood, tag, query, moodNum, entries, total, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                skip = (page - 1) * limit;
                startDate = req.query.startDate;
                endDate = req.query.endDate;
                mood = req.query.mood;
                tag = req.query.tag;
                query = { author: req.userId };
                // Date range filter
                if (startDate || endDate) {
                    query.createdAt = {};
                    if (startDate) {
                        query.createdAt.$gte = new Date(startDate);
                    }
                    if (endDate) {
                        query.createdAt.$lte = new Date(endDate);
                    }
                }
                // Mood filter
                if (mood) {
                    moodNum = parseInt(mood);
                    if (!isNaN(moodNum)) {
                        query.mood = moodNum;
                    }
                }
                // Tag filter
                if (tag) {
                    query.tags = tag.toLowerCase();
                }
                return [4 /*yield*/, JournalEntry_1.default.find(query)
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)];
            case 1:
                entries = _a.sent();
                return [4 /*yield*/, JournalEntry_1.default.countDocuments(query)];
            case 2:
                total = _a.sent();
                res.json({
                    success: true,
                    data: entries,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_1.message || 'Error fetching journal entries',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getEntries = getEntries;
// @desc    Get single journal entry
// @route   GET /api/journal/:id
// @access  Private
var getEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var entry, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, JournalEntry_1.default.findOne({
                        _id: req.params.id,
                        author: req.userId,
                    })];
            case 1:
                entry = _a.sent();
                if (!entry) {
                    res.status(404).json({
                        success: false,
                        message: 'Journal entry not found',
                    });
                    return [2 /*return*/];
                }
                res.json({
                    success: true,
                    data: entry,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_2.message || 'Error fetching journal entry',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getEntry = getEntry;
// @desc    Create journal entry
// @route   POST /api/journal
// @access  Private
var createEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, audioUrl, transcription, mood, symptoms, tags, promptId, promptText, entry, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, content = _a.content, audioUrl = _a.audioUrl, transcription = _a.transcription, mood = _a.mood, symptoms = _a.symptoms, tags = _a.tags, promptId = _a.promptId, promptText = _a.promptText;
                return [4 /*yield*/, JournalEntry_1.default.create({
                        author: req.userId,
                        content: content,
                        audioUrl: audioUrl,
                        transcription: transcription,
                        mood: mood,
                        symptoms: symptoms || [],
                        tags: tags || [],
                        promptId: promptId,
                        promptText: promptText,
                    })];
            case 1:
                entry = _b.sent();
                // Trigger AI analysis in background (don't await)
                analyzeEntryBackground(entry._id.toString());
                res.status(201).json({
                    success: true,
                    data: entry,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_3.message || 'Error creating journal entry',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createEntry = createEntry;
// @desc    Update journal entry
// @route   PUT /api/journal/:id
// @access  Private
var updateEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, mood, symptoms, tags, entry, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, content = _a.content, mood = _a.mood, symptoms = _a.symptoms, tags = _a.tags;
                return [4 /*yield*/, JournalEntry_1.default.findOne({
                        _id: req.params.id,
                        author: req.userId,
                    })];
            case 1:
                entry = _b.sent();
                if (!entry) {
                    res.status(404).json({
                        success: false,
                        message: 'Journal entry not found',
                    });
                    return [2 /*return*/];
                }
                // Update fields
                if (content !== undefined)
                    entry.content = content;
                if (mood !== undefined)
                    entry.mood = mood;
                if (symptoms !== undefined)
                    entry.symptoms = symptoms;
                if (tags !== undefined)
                    entry.tags = tags;
                return [4 /*yield*/, entry.save()];
            case 2:
                _b.sent();
                // Re-analyze if content changed
                if (content !== undefined) {
                    analyzeEntryBackground(entry._id.toString());
                }
                res.json({
                    success: true,
                    data: entry,
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                res.status(500).json({
                    success: false,
                    message: error_4.message || 'Error updating journal entry',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateEntry = updateEntry;
// @desc    Delete journal entry
// @route   DELETE /api/journal/:id
// @access  Private
var deleteEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var entry, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, JournalEntry_1.default.findOneAndDelete({
                        _id: req.params.id,
                        author: req.userId,
                    })];
            case 1:
                entry = _a.sent();
                if (!entry) {
                    res.status(404).json({
                        success: false,
                        message: 'Journal entry not found',
                    });
                    return [2 /*return*/];
                }
                res.json({
                    success: true,
                    message: 'Journal entry deleted',
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_5.message || 'Error deleting journal entry',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteEntry = deleteEntry;
// @desc    Get journal insights and patterns
// @route   GET /api/journal/insights
// @access  Private
var getInsights = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var days, startDate, entries, moodSum, averageMood, moodByDay_1, moodTrend, themeCounts_1, topThemes, patternCounts_1, commonPatterns, symptomFrequency_1, today, streakDays, entriesSet, i, checkDate, dateStr, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                days = parseInt(req.query.days) || 30;
                startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                return [4 /*yield*/, JournalEntry_1.default.find({
                        author: req.userId,
                        createdAt: { $gte: startDate },
                    }).sort({ createdAt: -1 })];
            case 1:
                entries = _a.sent();
                if (entries.length === 0) {
                    res.json({
                        success: true,
                        data: {
                            totalEntries: 0,
                            averageMood: null,
                            moodTrend: [],
                            topThemes: [],
                            commonPatterns: [],
                            symptomFrequency: {},
                            streakDays: 0,
                        },
                    });
                    return [2 /*return*/];
                }
                moodSum = entries.reduce(function (sum, entry) { return sum + entry.mood; }, 0);
                averageMood = moodSum / entries.length;
                moodByDay_1 = {};
                entries.forEach(function (entry) {
                    var day = entry.createdAt.toISOString().split('T')[0];
                    if (!moodByDay_1[day]) {
                        moodByDay_1[day] = { sum: 0, count: 0 };
                    }
                    moodByDay_1[day].sum += entry.mood;
                    moodByDay_1[day].count += 1;
                });
                moodTrend = Object.entries(moodByDay_1)
                    .map(function (_a) {
                    var date = _a[0], _b = _a[1], sum = _b.sum, count = _b.count;
                    return ({
                        date: date,
                        mood: Math.round((sum / count) * 10) / 10,
                    });
                })
                    .sort(function (a, b) { return a.date.localeCompare(b.date); });
                themeCounts_1 = {};
                entries.forEach(function (entry) {
                    var _a;
                    if ((_a = entry.aiInsights) === null || _a === void 0 ? void 0 : _a.themes) {
                        entry.aiInsights.themes.forEach(function (theme) {
                            themeCounts_1[theme] = (themeCounts_1[theme] || 0) + 1;
                        });
                    }
                });
                topThemes = Object.entries(themeCounts_1)
                    .sort(function (a, b) { return b[1] - a[1]; })
                    .slice(0, 5)
                    .map(function (_a) {
                    var theme = _a[0], count = _a[1];
                    return ({ theme: theme, count: count });
                });
                patternCounts_1 = {};
                entries.forEach(function (entry) {
                    var _a;
                    if ((_a = entry.aiInsights) === null || _a === void 0 ? void 0 : _a.cognitivePatterns) {
                        entry.aiInsights.cognitivePatterns.forEach(function (pattern) {
                            patternCounts_1[pattern] = (patternCounts_1[pattern] || 0) + 1;
                        });
                    }
                });
                commonPatterns = Object.entries(patternCounts_1)
                    .sort(function (a, b) { return b[1] - a[1]; })
                    .slice(0, 5)
                    .map(function (_a) {
                    var pattern = _a[0], count = _a[1];
                    return ({ pattern: pattern, count: count });
                });
                symptomFrequency_1 = {};
                entries.forEach(function (entry) {
                    entry.symptoms.forEach(function (symptom) {
                        var key = symptom.type ? "".concat(symptom.condition, " (").concat(symptom.type, ")") : symptom.condition;
                        if (!symptomFrequency_1[key]) {
                            symptomFrequency_1[key] = { count: 0, avgSeverity: 'moderate' };
                        }
                        symptomFrequency_1[key].count += 1;
                    });
                });
                today = new Date();
                today.setHours(0, 0, 0, 0);
                streakDays = 0;
                entriesSet = new Set(entries.map(function (e) { return e.createdAt.toISOString().split('T')[0]; }));
                for (i = 0; i < days; i++) {
                    checkDate = new Date(today);
                    checkDate.setDate(checkDate.getDate() - i);
                    dateStr = checkDate.toISOString().split('T')[0];
                    if (entriesSet.has(dateStr)) {
                        streakDays++;
                    }
                    else if (i > 0) {
                        break;
                    }
                }
                res.json({
                    success: true,
                    data: {
                        totalEntries: entries.length,
                        averageMood: Math.round(averageMood * 10) / 10,
                        moodTrend: moodTrend,
                        topThemes: topThemes,
                        commonPatterns: commonPatterns,
                        symptomFrequency: symptomFrequency_1,
                        streakDays: streakDays,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_6.message || 'Error fetching insights',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getInsights = getInsights;
// @desc    Analyze a journal entry with AI
// @route   POST /api/journal/:id/analyze
// @access  Private
var analyzeEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var entry, user, healthContext, insights, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, JournalEntry_1.default.findOne({
                        _id: req.params.id,
                        author: req.userId,
                    })];
            case 1:
                entry = _a.sent();
                if (!entry) {
                    res.status(404).json({
                        success: false,
                        message: 'Journal entry not found',
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, User_1.default.findById(req.userId)];
            case 2:
                user = _a.sent();
                healthContext = (user === null || user === void 0 ? void 0 : user.healthInfo) ? formatHealthContext(user.healthInfo) : '';
                return [4 /*yield*/, performAIAnalysis(entry.content, healthContext)];
            case 3:
                insights = _a.sent();
                entry.aiInsights = insights;
                return [4 /*yield*/, entry.save()];
            case 4:
                _a.sent();
                res.json({
                    success: true,
                    data: entry,
                });
                return [3 /*break*/, 6];
            case 5:
                error_7 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_7.message || 'Error analyzing entry',
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.analyzeEntry = analyzeEntry;
// @desc    Get personalized journal prompt
// @route   GET /api/journal/prompt
// @access  Private
var getPrompt = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, recentEntries, prompt_1, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, User_1.default.findById(req.userId)];
            case 1:
                user = _a.sent();
                return [4 /*yield*/, JournalEntry_1.default.find({ author: req.userId })
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .select('content mood createdAt aiInsights')];
            case 2:
                recentEntries = _a.sent();
                return [4 /*yield*/, generatePersonalizedPrompt(user === null || user === void 0 ? void 0 : user.healthInfo, recentEntries)];
            case 3:
                prompt_1 = _a.sent();
                res.json({
                    success: true,
                    data: prompt_1,
                });
                return [3 /*break*/, 5];
            case 4:
                error_8 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_8.message || 'Error generating prompt',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getPrompt = getPrompt;
// @desc    Get recent entries for Aurora context
// @route   GET /api/journal/aurora-context
// @access  Private
var getAuroraContext = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, entries, context, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                limit = parseInt(req.query.limit) || 5;
                return [4 /*yield*/, JournalEntry_1.default.find({ author: req.userId })
                        .sort({ createdAt: -1 })
                        .limit(limit)
                        .select('content mood symptoms aiInsights createdAt')];
            case 1:
                entries = _a.sent();
                context = entries.map(function (entry) {
                    var _a, _b;
                    return ({
                        date: entry.createdAt.toISOString().split('T')[0],
                        mood: entry.mood,
                        summary: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
                        themes: ((_a = entry.aiInsights) === null || _a === void 0 ? void 0 : _a.themes) || [],
                        sentiment: (_b = entry.aiInsights) === null || _b === void 0 ? void 0 : _b.sentiment,
                    });
                });
                res.json({
                    success: true,
                    data: context,
                });
                return [3 /*break*/, 3];
            case 2:
                error_9 = _a.sent();
                res.status(500).json({
                    success: false,
                    message: error_9.message || 'Error fetching Aurora context',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAuroraContext = getAuroraContext;
// Helper function: Background AI analysis
function analyzeEntryBackground(entryId) {
    return __awaiter(this, void 0, void 0, function () {
        var entry, author, healthContext, insights, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, JournalEntry_1.default.findById(entryId).populate('author')];
                case 1:
                    entry = _a.sent();
                    if (!entry)
                        return [2 /*return*/];
                    return [4 /*yield*/, User_1.default.findById(entry.author)];
                case 2:
                    author = _a.sent();
                    healthContext = (author === null || author === void 0 ? void 0 : author.healthInfo) ? formatHealthContext(author.healthInfo) : '';
                    return [4 /*yield*/, performAIAnalysis(entry.content, healthContext)];
                case 3:
                    insights = _a.sent();
                    entry.aiInsights = insights;
                    return [4 /*yield*/, entry.save()];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_10 = _a.sent();
                    console.error('Background analysis failed:', error_10);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Helper function: Format health context
function formatHealthContext(healthInfo) {
    var _a, _b;
    var parts = [];
    if (((_a = healthInfo.mentalHealth) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        parts.push("Mental health: ".concat(healthInfo.mentalHealth.map(function (h) {
            return typeof h === 'string' ? h : "".concat(h.condition).concat(h.type ? " (".concat(h.type, ")") : '');
        }).join(', ')));
    }
    if (((_b = healthInfo.physicalHealth) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        parts.push("Physical health: ".concat(healthInfo.physicalHealth.map(function (h) {
            return typeof h === 'string' ? h : "".concat(h.condition).concat(h.type ? " (".concat(h.type, ")") : '');
        }).join(', ')));
    }
    return parts.join('. ');
}
// Helper function: Perform AI analysis
function performAIAnalysis(content, healthContext) {
    return __awaiter(this, void 0, void 0, function () {
        var systemPrompt, response, result, error_11;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    systemPrompt = "Je bent een therapeutische AI-assistent die dagboekentries analyseert. Analyseer de volgende dagboekentry en geef gestructureerde inzichten terug.\n\n".concat(healthContext ? "Context over de gebruiker: ".concat(healthContext) : '', "\n\nGeef je analyse in het volgende JSON-formaat:\n{\n  \"sentiment\": \"positive\" | \"neutral\" | \"negative\" | \"mixed\",\n  \"themes\": [\"thema1\", \"thema2\"],\n  \"cognitivePatterns\": [\"patroon1\", \"patroon2\"],\n  \"therapeuticFeedback\": \"korte, empathische feedback in het Nederlands\",\n  \"followUpQuestions\": [\"vraag1\", \"vraag2\"]\n}\n\nWees empathisch en begripvol. Focus op:\n- Identificeer emotionele thema's\n- Herken cognitieve patronen (zwart-wit denken, catastroferen, etc.)\n- Geef ondersteunende, niet-oordelende feedback\n- Stel doordachte vervolgvragen");
                    if (!openai) {
                        res.status(503).json({
                            success: false,
                            message: 'OpenAI service is not configured. Please set OPENAI_API_KEY environment variable.',
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: 'gpt-4o-mini',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: content },
                            ],
                            response_format: { type: 'json_object' },
                            max_tokens: 500,
                        })];
                case 1:
                    response = _c.sent();
                    result = JSON.parse(((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '{}');
                    return [2 /*return*/, {
                            sentiment: result.sentiment || 'neutral',
                            themes: result.themes || [],
                            cognitivePatterns: result.cognitivePatterns || [],
                            therapeuticFeedback: result.therapeuticFeedback || '',
                            followUpQuestions: result.followUpQuestions || [],
                            analyzedAt: new Date(),
                        }];
                case 2:
                    error_11 = _c.sent();
                    console.error('AI analysis error:', error_11);
                    return [2 /*return*/, {
                            sentiment: 'neutral',
                            themes: [],
                            analyzedAt: new Date(),
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Helper function: Generate personalized prompt
function generatePersonalizedPrompt(healthInfo, recentEntries) {
    return __awaiter(this, void 0, void 0, function () {
        var prompts, relevantPrompts, mentalConditions, recentPromptIds, unusedPrompts, promptPool, selectedPrompt;
        return __generator(this, function (_a) {
            prompts = {
                general: [
                    { id: 'gen1', text: 'Hoe voel je je op dit moment? Beschrijf je emoties zonder oordeel.', category: 'Reflectie' },
                    { id: 'gen2', text: 'Wat was het beste moment van vandaag, hoe klein ook?', category: 'Dankbaarheid' },
                    { id: 'gen3', text: 'Als je huidige stemming een kleur was, welke zou het zijn en waarom?', category: 'Creatief' },
                    { id: 'gen4', text: 'Waar maak je je op dit moment zorgen over? Schrijf het van je af.', category: 'Verwerking' },
                    { id: 'gen5', text: 'Wat heb je vandaag voor jezelf gedaan?', category: 'Zelfzorg' },
                ],
                depression: [
                    { id: 'dep1', text: 'Hoe was je energieniveau vandaag op een schaal van 1-10? Wat heeft het beïnvloed?', category: 'Symptomen' },
                    { id: 'dep2', text: 'Noem drie dingen waar je dankbaar voor bent, hoe klein ook.', category: 'Dankbaarheid' },
                    { id: 'dep3', text: 'Welke activiteit, hoe klein ook, bracht vandaag een beetje vreugde?', category: 'Gedragsactivatie' },
                    { id: 'dep4', text: 'Welke negatieve gedachte kwam vandaag naar boven? Kun je er een alternatief perspectief op geven?', category: 'CBT' },
                ],
                anxiety: [
                    { id: 'anx1', text: 'Welke zorgen kwamen vandaag op? Hoe realistisch zijn ze op een schaal van 1-10?', category: 'Bezorgdheid' },
                    { id: 'anx2', text: 'Beschrijf een moment van kalmte vandaag. Wat maakte het rustgevend?', category: 'Grounding' },
                    { id: 'anx3', text: 'Welke fysieke sensaties merk je op wanneer je angstig bent? Waar in je lichaam voel je het?', category: 'Lichaamsbewustzijn' },
                    { id: 'anx4', text: 'Schrijf over een situatie die je vermijdt. Wat is het ergste dat zou kunnen gebeuren?', category: 'Exposure' },
                ],
                bipolar: [
                    { id: 'bip1', text: 'Hoe zou je je stemming vandaag omschrijven? Is er een patroon de afgelopen dagen?', category: 'Monitoring' },
                    { id: 'bip2', text: 'Hoe was je slaap afgelopen nacht? Merk je veranderingen in je slaappatroon?', category: 'Slaap' },
                    { id: 'bip3', text: 'Heb je veel energie of juist weinig? Hoe beïnvloedt dit je dag?', category: 'Energie' },
                ],
                trauma: [
                    { id: 'trm1', text: 'Wat is een veilige plek in je gedachten waar je nu naartoe kunt gaan?', category: 'Grounding' },
                    { id: 'trm2', text: 'Wat heb je vandaag gedaan om voor jezelf te zorgen?', category: 'Zelfzorg' },
                    { id: 'trm3', text: 'Beschrijf vijf dingen die je nu kunt zien, vier die je kunt horen, drie die je kunt voelen.', category: 'Grounding' },
                ],
            };
            relevantPrompts = __spreadArray([], prompts.general, true);
            if (healthInfo) {
                mentalConditions = healthInfo.mentalHealth || [];
                mentalConditions.forEach(function (condition) {
                    var conditionName = typeof condition === 'string' ? condition : condition.condition;
                    var conditionLower = conditionName.toLowerCase();
                    if (conditionLower.includes('depress')) {
                        relevantPrompts = __spreadArray(__spreadArray([], relevantPrompts, true), prompts.depression, true);
                    }
                    if (conditionLower.includes('angst') || conditionLower.includes('anxiety')) {
                        relevantPrompts = __spreadArray(__spreadArray([], relevantPrompts, true), prompts.anxiety, true);
                    }
                    if (conditionLower.includes('bipolair') || conditionLower.includes('bipolar')) {
                        relevantPrompts = __spreadArray(__spreadArray([], relevantPrompts, true), prompts.bipolar, true);
                    }
                    if (conditionLower.includes('trauma') || conditionLower.includes('ptss') || conditionLower.includes('ptsd')) {
                        relevantPrompts = __spreadArray(__spreadArray([], relevantPrompts, true), prompts.trauma, true);
                    }
                });
            }
            recentPromptIds = recentEntries
                .filter(function (e) { return e.promptId; })
                .map(function (e) { return e.promptId; });
            unusedPrompts = relevantPrompts.filter(function (p) { return !recentPromptIds.includes(p.id); });
            promptPool = unusedPrompts.length > 0 ? unusedPrompts : relevantPrompts;
            selectedPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];
            return [2 /*return*/, selectedPrompt];
        });
    });
}
