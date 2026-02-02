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
import ideaRoutes from './routes/ideas';

// Middleware
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express() as any;
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/ideas', ideaRoutes);

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

