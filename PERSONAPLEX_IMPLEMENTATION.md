# PersonaPlex 7B Implementatie - Compleet Overzicht

## ✅ Wat is geïmplementeerd

### 1. Railway Configuratie
- ✅ `railway.json` (root) - Algemene configuratie
- ✅ `personaplex/railway.json` - PersonaPlex service configuratie
- ✅ `personaplex/nixpacks.toml` - Python en system dependencies
- ✅ `personaplex/runtime.txt` - Python 3.10 specificatie
- ✅ `personaplex/.railwayignore` - Deployment exclusions

### 2. Backend Implementatie
- ✅ `backend/src/services/personaplexProxy.service.ts` - WebSocket bridge service
- ✅ `backend/src/routes/personaplex.ts` - WebSocket route met authenticatie
- ✅ `backend/src/utils/healthInfoFormatter.ts` - Health info en journal context formatting
- ✅ `backend/src/types/express-ws.d.ts` - TypeScript declarations
- ✅ `backend/src/server.ts` - Express-ws integratie en route registratie
- ✅ Dependencies: `express-ws`, `ws`, `@types/ws`

### 3. Frontend Implementatie
- ✅ `frontend/src/services/personaplex.service.ts` - Aangepast om via backend te verbinden
- ✅ `frontend/src/hooks/useVoiceTherapyPersonaPlex.ts` - Hook voor PersonaPlex voice therapy
- ✅ `frontend/app/voice.tsx` - Model selector (OpenAI / PersonaPlex 7B)

## 🏗️ Architectuur

```
┌─────────────┐
│   Mobile    │
│    App      │
└──────┬──────┘
       │ WebSocket
       │ (authenticated)
       ▼
┌─────────────┐
│   Backend   │
│  (Railway)  │
│             │
│  - Auth     │
│  - Context  │
│  - Bridge   │
└──────┬──────┘
       │ WebSocket
       │ (to PersonaPlex)
       ▼
┌─────────────┐
│ PersonaPlex │
│  (Railway)  │
│             │
│  - Model    │
│  - Server   │
└─────────────┘
```

## 📋 Deployment Stappen

### Stap 1: PersonaPlex Service op Railway

1. **Nieuwe Service Aanmaken:**
   - Railway Dashboard → New Service
   - Selecteer GitHub repo → `personaplex/` folder
   - Set environment variables:
     ```
     HF_TOKEN=your_huggingface_token
     PORT=8998
     ```

2. **Deploy:**
   - Railway start automatisch build
   - Eerste deploy duurt 10-20 minuten (model download)
   - Noteer de service URL (bijv. `https://personaplex-production.up.railway.app`)

### Stap 2: Backend Service Configuratie

1. **Environment Variable Toevoegen:**
   ```
   PERSONAPLEX_SERVER_URL=wss://personaplex-production.up.railway.app
   ```

2. **Deploy Backend:**
   - Railway detecteert wijzigingen automatisch
   - Backend verbindt nu met PersonaPlex service

### Stap 3: Frontend

- Geen extra configuratie nodig
- Frontend verbindt automatisch via backend API
- Model selector is beschikbaar in Voice Therapy screen

## 🔧 Configuratie Details

### Backend Environment Variables

```env
# Backend service
PERSONAPLEX_SERVER_URL=wss://personaplex-production.up.railway.app
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_uri
PORT=3000
```

### PersonaPlex Service Environment Variables

```env
# PersonaPlex service
HF_TOKEN=your_huggingface_token
PORT=8998
```

### Frontend (app.config.js)

```javascript
extra: {
  API_URL: 'https://aurora-production.up.railway.app/api',
  // PersonaPlex gaat via backend, geen directe config nodig
}
```

## 🧪 Testen

### 1. Lokaal Testen (Backend + PersonaPlex)

```bash
# Terminal 1: Start PersonaPlex server lokaal
cd personaplex
export HF_TOKEN=your_token
SSL_DIR=$(mktemp -d)
python -m moshi.server --ssl "$SSL_DIR" --host 0.0.0.0 --port 8998 --cpu-offload

# Terminal 2: Start backend
cd backend
npm run dev

# Backend .env:
PERSONAPLEX_SERVER_URL=wss://localhost:8998
```

### 2. App Testen

1. Open app → Voice Therapy
2. Selecteer "PersonaPlex 7B" in model selector
3. Test voice conversation
4. Vergelijk met OpenAI Realtime

## ⚠️ Belangrijke Opmerkingen

### Performance
- **CPU-only is traag**: 5-15 seconden latency per response
- **Niet geschikt voor real-time**: Alleen voor testing/comparison
- **Voor productie**: Gebruik GPU cloud service (RunPod, Vast.ai, etc.)

### Kosten
- Railway betaalt per gebruik
- Model blijft in geheugen = continue kosten
- Overweeg auto-sleep/wake voor kostenbesparing

### PersonaPlex API Protocol
- **Exacte message format moet worden geverifieerd**
- Huidige implementatie is flexibel en kan worden aangepast
- Test eerst lokaal om protocol te verifiëren

## 🔄 Volgende Stappen

1. **Verifieer PersonaPlex API Protocol**
   - Test WebSocket messages lokaal
   - Pas message handling aan indien nodig

2. **Audio Format**
   - PersonaPlex gebruikt Opus codec
   - Mogelijk conversie nodig in frontend

3. **Error Handling**
   - Verbeter error messages
   - Add retry logic

4. **Performance Monitoring**
   - Track response times
   - Monitor memory usage

## 📚 Referenties

- [PersonaPlex GitHub](https://github.com/NVIDIA/personaplex)
- [PersonaPlex Model](https://huggingface.co/nvidia/personaplex-7b-v1)
- [Railway Documentation](https://docs.railway.app/)


