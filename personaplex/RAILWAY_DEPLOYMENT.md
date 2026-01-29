# PersonaPlex Railway Deployment Guide

## Stap 1: Environment Variables

In Railway, voeg de volgende environment variables toe:

```
HF_TOKEN=your_huggingface_token_here
PORT=8998
```

**Belangrijk:**
- `HF_TOKEN`: Je HuggingFace token (verkrijg via https://huggingface.co/settings/tokens)
- `PORT`: Railway zet dit automatisch, maar je kunt het expliciet zetten

## Stap 2: Railway Service Setup

1. **Nieuwe Service Aanmaken:**
   - Ga naar Railway dashboard
   - Klik "New Project" of voeg service toe aan bestaand project
   - Selecteer "GitHub Repo" en kies je TherapyAI repo
   - **Belangrijk:** Selecteer de `personaplex/` folder als root directory

2. **Build Settings:**
   - Railway detecteert automatisch Python via `nixpacks.toml`
   - Build command wordt automatisch uitgevoerd: `pip install moshi/. && pip install accelerate`

3. **Start Command:**
   - Wordt automatisch ingesteld via `railway.json`
   - Command: `python -m moshi.server --ssl /tmp/ssl --host 0.0.0.0 --port $PORT --cpu-offload`

## Stap 3: Deployment

1. Railway start automatisch de build
2. **Eerste deployment duurt lang** (10-20 minuten):
   - Python dependencies installeren
   - Model weights downloaden van HuggingFace (~7-14GB)
   - Model laden in geheugen

3. Check logs voor:
   - `✅ Model loaded successfully`
   - `Access the Web UI directly at https://...`

## Stap 4: Service URL

Na deployment krijg je een Railway URL zoals:
```
https://personaplex-production.up.railway.app
```

**Noteer deze URL** - je hebt deze nodig voor de backend configuratie.

## Stap 5: Backend Configuration

In je backend service op Railway, voeg toe:

```
PERSONAPLEX_SERVER_URL=wss://personaplex-production.up.railway.app
```

## Troubleshooting

### Build Fails
- Check of `HF_TOKEN` is ingesteld
- Check logs voor specifieke foutmeldingen
- Verifieer dat Python 3.10+ wordt gebruikt

### Model Download Fails
- Verifieer `HF_TOKEN` is geldig
- Check of je de PersonaPlex license hebt geaccepteerd op HuggingFace
- Check internet connectiviteit tijdens build

### Server Start Fails
- Check of `PORT` environment variable is ingesteld
- Check logs voor Python errors
- Verifieer dat alle dependencies zijn geïnstalleerd

### High Memory Usage
- CPU-offload is al ingeschakeld (`--cpu-offload` flag)
- Railway heeft memory limits - upgrade plan indien nodig
- Model blijft in geheugen = continue kosten

## Performance Notes

⚠️ **Belangrijk:** PersonaPlex op CPU is **zeer traag**:
- Response tijd: 5-15 seconden (vs <1 seconde op GPU)
- Niet geschikt voor real-time conversaties
- Alleen geschikt voor testing/comparison

Voor productie gebruik, overweeg:
- GPU cloud service (RunPod, Vast.ai, Lambda Labs)
- Of lokale GPU server

## Kosten

- Railway betaalt per gebruik
- Model blijft in geheugen = altijd "in gebruik"
- CPU instances zijn goedkoper dan GPU, maar nog steeds duur voor 24/7 gebruik
- Overweeg auto-sleep/wake mechanisme voor kostenbesparing


