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

// Models
import Idea from './models/Idea';

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
connectDB().then(async () => {
  // One-time maintenance: ensure no invalid compound index exists on parallel
  // array fields upvotes/downvotes in the ideas collection.
  //
  // MongoDB does not allow a compound index where multiple indexed fields are
  // arrays. If such an index was ever created (e.g. { upvotes: 1, downvotes: 1 }),
  // any write can fail with:
  //   "cannot index parallel arrays [downvotes] [upvotes]"
  //
  // This block is safe to keep: it only drops the specific invalid index if
  // present, and logs a warning instead of crashing the app.
  try {
    const collection = (Idea as any).collection;
    if (collection?.indexes) {
      const indexes = await collection.indexes();
      for (const idx of indexes) {
        const key = idx.key || {};
        const fields = Object.keys(key);
        if (fields.includes('upvotes') && fields.includes('downvotes')) {
          console.warn(
            `[Idea] Dropping invalid compound index "${idx.name}" on parallel arrays upvotes/downvotes to fix "cannot index parallel arrays" error`
          );
          await collection.dropIndex(idx.name);
        }
      }
    }
  } catch (err) {
    console.warn('[Idea] Failed to inspect/drop invalid upvotes/downvotes index:', err);
  }
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
});

// Trust proxy (required for Railway and other platforms that use reverse proxies)
// This allows express-rate-limit to correctly identify users behind proxies
// Updated: 2026-02-19 - Fix for Railway deployment
app.set('trust proxy', true);

// Security Middleware (must be first)
app.use(helmetConfig);
app.use(securityHeaders);
app.use(cors(corsOptions));

// Body parsing middleware - skip for upload routes (multer handles multipart/form-data)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/upload')) {
    // Skip body parsing for upload routes - multer will handle it
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/upload')) {
    // Skip body parsing for upload routes - multer will handle it
    return next();
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// Increase timeout for uploads (especially for large video files)
app.use('/api/upload', (req, res, next) => {
  req.setTimeout(300000); // 5 minutes timeout for uploads
  res.setTimeout(300000);
  next();
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files (uploads and public assets)
import path from 'path';
import fs from 'fs';
import { getFile, getFileInfo } from './services/mongoStorage';

// Serve uploads: first try MongoDB GridFS, then fall back to local filesystem
app.use('/uploads', async (req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  // Extract filename from URL path (remove leading slash)
  const filename = req.path.startsWith('/') ? req.path.slice(1) : req.path;
  
  if (!filename) {
    return next();
  }

  try {
    // Try to serve from MongoDB GridFS first (persistent storage)
    const fileInfo = await getFileInfo(filename);
    if (fileInfo) {
      const totalLength = fileInfo.length;
      
      // Always advertise Range request support
      res.setHeader('Accept-Ranges', 'bytes');
      // Cache for 1 year (files are immutable - filename includes timestamp)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      // Handle Range requests (required for video/audio streaming on iOS/Android)
      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
        const chunkSize = end - start + 1;

        const file = await getFile(filename, start, end);
        if (!file) {
          res.status(404).json({ success: false, message: 'File not found' });
          return;
        }

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalLength}`,
          'Content-Length': chunkSize,
          'Content-Type': fileInfo.contentType,
        });
        file.stream.pipe(res);
        return;
      }

      // No Range header - serve the full file
      const file = await getFile(filename);
      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      res.setHeader('Content-Type', fileInfo.contentType);
      res.setHeader('Content-Length', totalLength.toString());
      file.stream.pipe(res);
      return;
    }
  } catch (err) {
    // GridFS not available yet (e.g., during startup) - fall through to local
    console.warn('GridFS lookup failed, falling back to local filesystem:', err);
  }

  // Fall back to local filesystem (for backward compatibility during transition)
  const localPath = path.join(__dirname, '../uploads', filename);
  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  // File not found in either location
  res.status(404).json({
    success: false,
    message: 'File not found',
  });
});
app.use('/public', express.static(path.join(__dirname, '../public')));

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

