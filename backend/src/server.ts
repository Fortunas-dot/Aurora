import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import expressWs from 'express-ws';

// Routes
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import groupRoutes from './routes/groups';
import messageRoutes from './routes/messages';
import userRoutes from './routes/users';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import journalRoutes from './routes/journal';
import journalsRoutes from './routes/journals';
import ideaRoutes from './routes/ideas';
import aiRoutes from './routes/ai';
import therapistRoutes from './routes/therapists';
import seedRoutes from './routes/seed';
import calendarRoutes from './routes/calendar';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import {
  validateEnv,
  corsOptions,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  helmetConfig,
  securityHeaders,
} from './middleware/security';

// Load environment variables
dotenv.config();

// Validate required environment variables
validateEnv();

const app: Application = express() as any;
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Trust proxy (required for Railway and other platforms that use reverse proxies)
// This allows express-rate-limit to correctly identify users behind proxies
// Updated: 2026-02-19 - Fix for Railway deployment
app.set('trust proxy', true);

// Security Middleware (must be first)
app.use(helmetConfig);
app.use(securityHeaders);
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files (uploads)
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Enable WebSocket support (must be before routes that use WebSocket)
expressWs(app);
console.log('✅ WebSocket support enabled');

// WebSocket Routes (must be before regular API routes)
import { handleNotificationWebSocket } from './controllers/notificationWebSocket';
import { handleChatWebSocket } from './controllers/chatWebSocket';
(app as any).ws('/ws/notifications', handleNotificationWebSocket);
(app as any).ws('/ws/chat', handleChatWebSocket);

// API Routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes); // Stricter rate limiting for auth
app.use('/api/upload', uploadLimiter, uploadRoutes); // Stricter rate limiting for uploads
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/therapists', therapistRoutes);
// Seed routes should be disabled in production
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/seed', seedRoutes);
}
app.use('/api/calendar', calendarRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║            Aurora Backend API Server                       ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${PORT}                                                ║
║  Health: /health                                           ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;

