import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import { VoiceSocketHandler } from './websocket/VoiceSocketHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for Express and WebSocket
const server = createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server, path: '/api/voice' });

// Initialize voice socket handler
const voiceSocketHandler = new VoiceSocketHandler(wss);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'TherapyAI API',
    version: '1.0.0',
    message: 'Welcome to the TherapyAI API',
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Session routes
app.use('/api/sessions', sessionRoutes);

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  voiceSocketHandler.handleConnection(ws, req);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║          TherapyAI Backend Server             ║
║                                               ║
╚═══════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
🔌 WebSocket server ready on ws://localhost:${PORT}/api/voice
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started at: ${new Date().toLocaleString()}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  voiceSocketHandler.shutdown();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
