# WebSocket Proxy Server Setup

## Probleem
React Native's native WebSocket ondersteunt geen custom headers, terwijl de OpenAI Realtime API authenticatie via HTTP headers vereist (`Authorization: Bearer <key>`).

## Oplossing: Proxy Server

Een eenvoudige proxy server draait lokaal en voegt de Authorization header toe.

### Stappen:

1. **Installeer dependencies:**
   ```bash
   cd mobile
   npm install ws
   ```

2. **Set environment variable:**
   ```bash
   export OPENAI_API_KEY=sk-your-key-here
   ```
   Of op Windows:
   ```powershell
   $env:OPENAI_API_KEY="sk-your-key-here"
   ```

3. **Start de proxy server:**
   ```bash
   node proxy-server.js
   ```

4. **De app verbindt automatisch:**
   - In development mode gebruikt de app `ws://localhost:8080`
   - De proxy voegt de Authorization header toe en verbindt met OpenAI

### Voor Productie:

Voor productie, deploy de proxy server naar een hosting service (bijv. Heroku, Railway, etc.) en update `REALTIME_API_URL` in `realtime.service.ts` naar je hosted proxy URL.

### Alternatief:

Als je geen proxy wilt gebruiken, kun je teruggaan naar de oude implementatie (Whisper + Chat + OpenAI TTS) die wel werkt zonder proxy.





