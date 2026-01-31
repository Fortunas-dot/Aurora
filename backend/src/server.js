"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var database_1 = require("./config/database");
var express_ws_1 = require("express-ws");
// Routes
var auth_1 = require("./routes/auth");
var posts_1 = require("./routes/posts");
var comments_1 = require("./routes/comments");
var groups_1 = require("./routes/groups");
var messages_1 = require("./routes/messages");
var users_1 = require("./routes/users");
var notifications_1 = require("./routes/notifications");
var upload_1 = require("./routes/upload");
var journal_1 = require("./routes/journal");
var personaplex_1 = require("./routes/personaplex");
// Middleware
var errorHandler_1 = require("./middleware/errorHandler");
// Load environment variables
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3000;
// Connect to MongoDB
(0, database_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files (uploads)
var path_1 = require("path");
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check
app.get('/health', function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Enable WebSocket support (must be before routes that use WebSocket)
var wsInstance = (0, express_ws_1.default)(app);
console.log('✅ WebSocket support enabled');
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/posts', posts_1.default);
app.use('/api/comments', comments_1.default);
app.use('/api/groups', groups_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/users', users_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/journal', journal_1.default);
app.use('/api/personaplex', (0, personaplex_1.default)());
console.log('✅ PersonaPlex routes registered at /api/personaplex');
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(PORT, function () {
    console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n\u2551            Aurora Backend API Server                       \u2551\n\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563\n\u2551  Status: Running                                           \u2551\n\u2551  Port: ".concat(PORT, "                                                \u2551\n\u2551  Health: /health                                           \u2551\n\u2551  PersonaPlex: /api/personaplex/ws                          \u2551\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n  "));
});
exports.default = app;
