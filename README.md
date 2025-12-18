# TherapyAI

Production-ready iOS and Android mobile application for a high-tech, humanoid AI therapist with voice and chat interaction.

## Overview

TherapyAI is a cross-platform mobile app that provides real-time therapeutic conversations with an AI that feels warm, organic, alive, and emotionally intelligent. This is not a basic chatbot - the experience is designed to feel like interacting with a living, empathetic presence.

## Core Features

### 🎙️ Voice & Chat Interaction
- Real-time voice conversations with natural, therapeutic responses
- Low-latency voice pipeline (< 2 seconds)
- Text chat alternative
- Conversational turn-based interaction

### 👁️ Visual Presence
- Abstract humanoid entity with organic, glowing appearance
- State-driven animations (idle, listening, speaking)
- Audio-reactive visual responses
- Smooth, fluid 60fps animations using Skia

### 🧠 Session-Based Memory
- Finite memory within each session
- AI identifies important emotional data and recurring themes
- Session summaries with key findings
- Long-term user profile with structured insights

### 🔒 Privacy & Security
- End-to-end encryption for conversations
- 30-day message retention with automatic deletion
- Structured memory objects (not raw conversations)
- HIPAA-compliant architecture

## Tech Stack

### Frontend (Mobile)
- **React Native 0.73** - Cross-platform framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation system
- **Zustand** - State management
- **React Query** - Server state management
- **Reanimated v3** - High-performance animations
- **Skia** - Hardware-accelerated canvas rendering

### Backend (API)
- **Node.js + Express** - REST API
- **TypeScript** - Type safety
- **PostgreSQL** - Primary database
- **Prisma** - Type-safe ORM
- **Redis** - Caching and sessions
- **WebSocket (ws)** - Real-time voice streaming

### AI & Voice Services
- **OpenAI GPT-4** - Therapeutic AI conversations
- **Deepgram Nova-2** - Speech-to-text (STT)
- **ElevenLabs Turbo v2** - Text-to-speech (TTS)

## Project Structure

```
TherapyAI/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   │   ├── ai/          # OpenAI GPT-4 integration
│   │   │   ├── voice/       # Deepgram + ElevenLabs
│   │   │   └── memory/      # Session memory & insights
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   └── websocket/       # WebSocket handlers
│   ├── prisma/              # Database schema
│   └── package.json
│
├── mobile/                  # React Native app
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── common/      # Reusable UI components
│   │   │   └── therapy/     # Therapy-specific components
│   │   ├── screens/         # Screen components
│   │   ├── services/        # API & WebSocket clients
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand stores
│   │   ├── theme/           # Design system
│   │   └── types/           # TypeScript types
│   ├── App.tsx
│   └── package.json
│
└── shared/                  # Shared types between frontend/backend
    └── types/
```

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 15+**
- **Redis 7+**
- For mobile development:
  - **iOS**: macOS, Xcode 14+, CocoaPods
  - **Android**: Android Studio, Java JDK 11+

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend will run on `http://localhost:3000`

### Mobile Setup

```bash
cd mobile
npm install

# iOS only (macOS)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/therapyai
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-openai-key
DEEPGRAM_API_KEY=your-deepgram-key
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=your-voice-id
```

### Mobile (.env)

```env
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
```

## Design Philosophy

**"Minimalist High-Tech Organic"**

The UI/UX is designed to feel:
- **Calming**: Dark-mode-first with soothing colors
- **High-Tech**: Glassmorphic UI, gradient effects
- **Organic**: Fluid animations, breathing entity
- **Alive**: Audio-reactive responses, state-driven visuals

### Color Palette

- **Background**: Deep space blue (#0A0E27) → Midnight purple (#1A1B3E)
- **Entity**: Purple-blue gradients (state-driven)
- **Accent**: Vibrant purple (#8B5CF6)
- **Text**: Almost white (#F9FAFB)

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Backend Node.js/Express setup
- [x] React Native mobile setup
- [x] Design system (colors, typography, spacing)
- [x] Common UI components (Button, Card, Input)

### Phase 2: Authentication (In Progress)
- [ ] JWT-based authentication
- [ ] Login/Register screens
- [ ] Secure token storage

### Phase 3: Text Chat
- [ ] OpenAI GPT-4 integration
- [ ] Prompt engineering for therapeutic tone
- [ ] Chat interface
- [ ] Session management

### Phase 4: Voice Integration
- [ ] Deepgram STT integration
- [ ] ElevenLabs TTS integration
- [ ] WebSocket voice pipeline
- [ ] Audio recording & playback

### Phase 5: Visual Entity
- [ ] Abstract entity with Skia
- [ ] State-driven animations
- [ ] Audio-reactive effects

### Phase 6: Memory System
- [ ] Session memory
- [ ] Insight extraction
- [ ] Long-term user profile

### Phase 7: Security & Privacy
- [ ] End-to-end encryption
- [ ] Data retention policies
- [ ] HIPAA compliance

### Phase 8: Testing & Deployment
- [ ] Unit & integration tests
- [ ] Performance optimization
- [ ] App store deployment

## API Documentation

### REST Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/profile
POST   /api/sessions
GET    /api/sessions/:id
PUT    /api/sessions/:id/end
GET    /api/insights
```

### WebSocket

```
WS /api/voice
```

Messages:
- `AUDIO_CHUNK` - Audio data from client
- `TRANSCRIPTION` - Speech-to-text result
- `AUDIO_RESPONSE` - AI voice response

## Testing

### Backend

```bash
cd backend
npm test
```

### Mobile

```bash
cd mobile
npm test
```

## Deployment

### Backend

```bash
cd backend
npm run build
npm start
```

Deploy to AWS, GCP, or Azure with:
- EC2/Compute Engine for API servers
- RDS/Cloud SQL for PostgreSQL
- ElastiCache/Memorystore for Redis
- Load balancer for auto-scaling

### Mobile

Build and submit to:
- Apple App Store (iOS)
- Google Play Store (Android)

## Contributing

This is a production application. Please follow these guidelines:
- Write TypeScript with strict types
- Follow the established code style
- Add tests for new features
- Update documentation

## License

MIT

## Support

For issues or questions, please create an issue on GitHub.

---

**Built with ❤️ for mental health and emotional wellbeing**
