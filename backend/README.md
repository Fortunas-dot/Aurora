# TherapyAI Backend

Production-ready Node.js/Express backend for the TherapyAI mobile application.

## Features

- RESTful API with Express.js
- WebSocket support for real-time voice streaming
- PostgreSQL database with Prisma ORM
- JWT-based authentication
- End-to-end encryption for messages
- OpenAI GPT-4 integration for therapy conversations
- Deepgram speech-to-text
- ElevenLabs text-to-speech
- Redis caching
- TypeScript for type safety

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- OpenAI API key
- Deepgram API key
- ElevenLabs API key

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Development

```bash
# Start development server with hot reload
npm run dev
```

The server will start on `http://localhost:3000`

### 5. Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── models/                # Data models
│   ├── services/              # Business logic
│   │   ├── ai/                # OpenAI integration
│   │   ├── voice/             # Deepgram + ElevenLabs
│   │   ├── memory/            # Session memory
│   │   └── encryption/        # E2EE services
│   ├── websocket/             # WebSocket handlers
│   ├── types/                 # TypeScript types
│   └── index.ts               # Entry point
├── .env.example               # Environment template
├── package.json
└── tsconfig.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/profile/insights` - Get user insights

### Sessions
- `POST /api/sessions` - Create new therapy session
- `GET /api/sessions` - List user sessions
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id/end` - End session
- `GET /api/sessions/:id/summary` - Get session summary

### Insights
- `GET /api/insights` - List user insights
- `GET /api/insights/:id` - Get specific insight
- `PUT /api/insights/:id` - Update insight
- `DELETE /api/insights/:id` - Archive insight

### WebSocket
- `WS /api/voice` - Real-time voice streaming

## WebSocket Protocol

### Client → Server Messages

```typescript
// Audio chunk
{
  type: 'AUDIO_CHUNK',
  sessionId: string,
  data: ArrayBuffer,
  timestamp: number
}

// Session control
{
  type: 'START_SESSION' | 'END_SESSION',
  sessionId: string
}
```

### Server → Client Messages

```typescript
// Transcription
{
  type: 'TRANSCRIPTION',
  text: string,
  isFinal: boolean,
  timestamp: number
}

// Audio response
{
  type: 'AUDIO_RESPONSE',
  data: ArrayBuffer,
  timestamp: number
}

// State change
{
  type: 'STATE_CHANGE',
  state: 'idle' | 'listening' | 'processing' | 'speaking'
}
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens for authentication
- End-to-end encryption for message content (AES-256-GCM)
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet.js security headers
- Input validation with Zod

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## License

MIT
