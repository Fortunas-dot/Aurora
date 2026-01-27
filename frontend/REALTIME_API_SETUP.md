# OpenAI Realtime API Setup

## Probleem
React Native's native WebSocket ondersteunt geen custom headers, terwijl de OpenAI Realtime API authenticatie via HTTP headers vereist (`Authorization: Bearer <key>`).

## Oplossingen

### Optie 1: Proxy Server (Aanbevolen)
Maak een proxy server die:
- WebSocket verbindingen accepteert
- De Authorization header toevoegt
- Doorverbindt naar OpenAI Realtime API

### Optie 2: WebSocket Library met Header Support
Gebruik een library zoals:
- `react-native-websocket` (verouderd)
- Custom native module
- Expo module met WebSocket header support

### Optie 3: API Key in URL (Niet Aanbevolen)
Minder veilig, maar werkt voor development:
```
wss://api.openai.com/v1/realtime?model=...&api_key=sk-...
```

## Huidige Status
De `realtime.service.ts` is gemaakt maar vereist nog een werkende authenticatie methode.

## Volgende Stappen
1. Kies een authenticatie methode
2. Implementeer de gekozen oplossing
3. Test de verbinding
4. Integreer in `useVoiceTherapy` hook





