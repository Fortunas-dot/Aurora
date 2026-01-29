# NVIDIA PersonaPlex 7B Setup

Deze documentatie beschrijft hoe je de NVIDIA PersonaPlex 7B integratie configureert voor de Voice Therapy functionaliteit.

## Overzicht

De app ondersteunt nu twee AI-modellen voor voice therapy:
- **OpenAI Realtime API** (huidige implementatie)
- **NVIDIA PersonaPlex 7B** (nieuwe implementatie)

Je kunt tussen beide modellen schakelen via de model selector in de Voice Therapy screen.

## Configuratie

### 1. API Key en URL

Voeg de volgende environment variabelen toe aan je `.env` bestand:

```env
PERSONAPLEX_API_KEY=your_nvidia_api_key_here
PERSONAPLEX_API_URL=https://integrate.api.nvidia.com/v1
```

### 2. App Configuratie

De configuratie is al toegevoegd aan `app.config.js`:

```javascript
extra: {
  PERSONAPLEX_API_KEY: process.env.PERSONAPLEX_API_KEY || '',
  PERSONAPLEX_API_URL: process.env.PERSONAPLEX_API_URL || 'https://integrate.api.nvidia.com/v1',
}
```

## NVIDIA PersonaPlex 7B API Details

**Let op:** De exacte API specificaties voor PersonaPlex 7B moeten nog worden geverifieerd. De huidige implementatie is gebaseerd op een generieke NVIDIA NIM (NVIDIA Inference Microservice) structuur.

### Mogelijke API Endpoints

PersonaPlex 7B kan beschikbaar zijn via:
1. **NVIDIA NIM API** - `https://integrate.api.nvidia.com/v1`
2. **Direct Model Endpoint** - Specifiek endpoint voor PersonaPlex 7B
3. **WebSocket API** - Real-time streaming (zoals OpenAI Realtime)

### Aanpassingen Nodig

De service in `frontend/src/services/personaplex.service.ts` moet mogelijk worden aangepast op basis van:
- De exacte API endpoint URL
- De request/response format
- Authenticatie methode
- Audio format specificaties

## Implementatie Details

### Service: `personaplex.service.ts`

De service implementeert:
- WebSocket verbinding (kan aangepast worden naar REST API indien nodig)
- Audio streaming
- Session management
- Health info context integratie

### Hook: `useVoiceTherapyPersonaPlex.ts`

De hook biedt dezelfde interface als `useVoiceTherapy`:
- State management (idle, listening, processing, speaking)
- Audio level tracking
- Mute/unmute functionaliteit
- Error handling

### UI: `voice.tsx`

De Voice Therapy screen bevat nu:
- Model selector (OpenAI / PersonaPlex 7B)
- Dynamische hook switching
- Model indicator in de UI

## Testen

1. Zorg dat beide API keys zijn geconfigureerd
2. Open de Voice Therapy screen
3. Schakel tussen modellen via de selector
4. Test beide implementaties en vergelijk de resultaten

## Troubleshooting

### "Kon niet verbinden met PersonaPlex 7B API"

- Controleer of `PERSONAPLEX_API_KEY` is ingesteld
- Verifieer de `PERSONAPLEX_API_URL`
- Controleer of de API endpoint correct is

### Audio werkt niet

- Controleer audio format specificaties in `personaplex.service.ts`
- Pas `sampleRate`, `channels`, en `bitDepth` aan indien nodig

### WebSocket verbinding faalt

- Mogelijk gebruikt PersonaPlex 7B een REST API in plaats van WebSocket
- Pas de `connect()` methode aan om HTTP requests te gebruiken

## Volgende Stappen

1. Verifieer de exacte PersonaPlex 7B API documentatie
2. Pas de service aan op basis van de werkelijke API specificaties
3. Test en vergelijk beide modellen
4. Optimaliseer op basis van testresultaten

## Referenties

- [NVIDIA NIM Documentation](https://docs.nvidia.com/nim/)
- [NVIDIA API Portal](https://build.nvidia.com/)


