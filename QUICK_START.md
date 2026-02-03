# Quick Start - Realtime API Setup

## Authenticatie Fout Oplossen

De fout "Missing bearer or basic authentication in header" komt omdat React Native WebSocket geen custom headers ondersteunt.

## Oplossing: Proxy Server

### Stap 1: Installeer dependencies
```bash
npm install ws
```

### Stap 2: Set environment variable
```bash
# Windows PowerShell:
$env:OPENAI_API_KEY="sk-your-key-here"

# Windows CMD:
set OPENAI_API_KEY=sk-your-key-here

# Mac/Linux:
export OPENAI_API_KEY=sk-your-key-here
```

### Stap 3: Start de proxy server
```bash
node proxy-server.js
```

Je zou moeten zien:
```
WebSocket proxy server running on ws://localhost:8080
```

### Stap 4: Start je app
De app verbindt automatisch via de proxy server.

## Troubleshooting

- **"Kon niet verbinden"**: Zorg dat de proxy server draait
- **"Authenticatie fout"**: Controleer of OPENAI_API_KEY is gezet
- **Port al in gebruik**: Stop andere processen op poort 8080

## Voor Productie

Deploy de proxy server naar een hosting service (Heroku, Railway, etc.) en update `REALTIME_API_URL` in `mobile/src/services/realtime.service.ts`.












