# Railway PersonaPlex Setup - Complete Guide

## ✅ Voordelen Railway

- ✅ **Statische URL** - Geen dynamische URL problemen
- ✅ **Geen GPU availability issues** - Altijd beschikbaar
- ✅ **Eenvoudige setup** - Geen pod management
- ✅ **Geen externe API's** - Alles in Railway
- ⚠️ **CPU-only** - Traag (5-15 seconden per response)

## 📋 Stap 1: PersonaPlex Service op Railway

### 1.1 Nieuwe Service Aanmaken

1. **Ga naar Railway Dashboard**
   - [railway.app](https://railway.app)
   - Log in met je account

2. **Open je bestaande project** (of maak een nieuw project)
   - Klik op je project (bijv. "Aurora" of "TherapyAI")

3. **Nieuwe Service Toevoegen**
   - Klik **"+ New"** → **"GitHub Repo"**
   - Selecteer je **TherapyAI** repository
   - **BELANGRIJK:** Bij "Root Directory" selecteer: **`personaplex`**
   - Klik **"Deploy"**

### 1.2 Environment Variables Instellen

1. **Klik op de nieuwe service** (bijv. "personaplex")
2. **Ga naar "Variables" tab**
3. **Voeg deze variables toe:**

```env
HF_TOKEN=your_huggingface_token_here
PORT=8998
```

**Hoe HF_TOKEN te krijgen:**
1. Ga naar [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Klik **"New token"**
3. Geef het een naam (bijv. `railway-personaplex`)
4. Selecteer **"Read"** permissions
5. **Kopieer de token** (je ziet hem maar één keer!)

**Belangrijk:** 
- Accepteer de PersonaPlex license op HuggingFace: [nvidia/personaplex-7b-v1](https://huggingface.co/nvidia/personaplex-7b-v1)
- Zonder licentie acceptatie kan het model niet gedownload worden

### 1.3 Deployment

1. **Railway start automatisch de build**
   - Dit duurt **10-20 minuten** de eerste keer
   - Model download (~7-14GB)
   - Dependencies installeren

2. **Check de logs:**
   - Ga naar **"Deployments"** tab
   - Klik op de deployment
   - Check logs voor:
     - `✅ Model loaded successfully`
     - `Access the Web UI directly at https://...`

3. **Noteer de Service URL:**
   - Ga naar **"Settings"** → **"Networking"**
   - Of check de **"Deployments"** tab
   - URL ziet eruit als: `https://personaplex-production.up.railway.app`
   - **Kopieer deze URL!**

## 📋 Stap 2: Backend Service Configureren

### 2.1 Environment Variable Toevoegen

1. **Ga naar je backend service** in Railway
2. **Ga naar "Variables" tab**
3. **Voeg deze variable toe:**

```env
PERSONAPLEX_SERVER_URL=wss://personaplex-production.up.railway.app
```

**Belangrijk:**
- Gebruik **`wss://`** (niet `https://`) voor WebSocket
- Vervang `personaplex-production.up.railway.app` met jouw echte URL

### 2.2 Verwijder Oude Configuratie (optioneel)

Als je RunPod of Lambda Labs configuratie hebt, kun je die verwijderen:

```env
# Verwijder deze (niet meer nodig):
# RUNPOD_API_KEY=...
# RUNPOD_POD_ID=...
# LAMBDALABS_API_KEY=...
# LAMBDALABS_INSTANCE_ID=...
```

**Of laat ze staan** - De code gebruikt Railway als `PERSONAPLEX_SERVER_URL` is ingesteld.

### 2.3 Deploy Backend

- Railway detecteert wijzigingen automatisch
- Of klik **"Redeploy"** in de backend service

## 📋 Stap 3: Testen

### 3.1 Check PersonaPlex Service

1. **Open de PersonaPlex URL** in browser:
   ```
   https://personaplex-production.up.railway.app
   ```
2. **Je zou de PersonaPlex Web UI moeten zien**
3. **Als het werkt** → Service is klaar!

### 3.2 Test in App

1. **Open je app** → Voice Therapy
2. **Selecteer "PersonaPlex 7B"** in model selector
3. **Start een conversatie**
4. **Verwacht:** 5-15 seconden latency (CPU is traag)

## ⚠️ Performance Notities

### CPU vs GPU

| Metric | CPU (Railway) | GPU (Lambda Labs) |
|--------|---------------|-------------------|
| **Response tijd** | 5-15 seconden | <1 seconde |
| **Real-time** | ❌ Nee | ✅ Ja |
| **Geschikt voor** | Testing | Productie |

### Wanneer Railway Gebruiken

- ✅ **Development/Testing** - Om te testen of PersonaPlex werkt
- ✅ **Low-traffic** - Als je weinig gebruikers hebt
- ✅ **Budget-conscious** - Als GPU te duur is
- ❌ **Real-time voice therapy** - CPU is te traag

## 💰 Kosten

- **Railway betaalt per gebruik**
- **Model blijft in geheugen** = altijd "in gebruik"
- **CPU instances** zijn goedkoper dan GPU
- **Voor 24/7 gebruik:** ~$50-150/maand (afhankelijk van plan)

## 🔧 Troubleshooting

### Build Fails

**Probleem:** Build faalt tijdens deployment

**Oplossing:**
- Check of `HF_TOKEN` is ingesteld
- Check of je PersonaPlex license hebt geaccepteerd
- Check logs voor specifieke foutmeldingen
- Verifieer dat Python 3.10+ wordt gebruikt

### Model Download Fails

**Probleem:** Model wordt niet gedownload

**Oplossing:**
- Verifieer `HF_TOKEN` is geldig
- Check of je de PersonaPlex license hebt geaccepteerd op HuggingFace
- Check internet connectiviteit tijdens build
- Probeer opnieuw te deployen

### Server Start Fails

**Probleem:** PersonaPlex server start niet

**Oplossing:**
- Check of `PORT` environment variable is ingesteld
- Check logs voor Python errors
- Verifieer dat alle dependencies zijn geïnstalleerd
- Check memory limits (upgrade plan indien nodig)

### Connection Fails in App

**Probleem:** App kan niet verbinden met PersonaPlex

**Oplossing:**
- Check `PERSONAPLEX_SERVER_URL` is correct (wss:// not https://)
- Check PersonaPlex service is running (check logs)
- Check backend logs voor connection errors
- Verifieer WebSocket support in Railway (moet automatisch werken)

### High Memory Usage

**Probleem:** Service gebruikt te veel geheugen

**Oplossing:**
- CPU-offload is al ingeschakeld (`--cpu-offload` flag)
- Railway heeft memory limits - upgrade plan indien nodig
- Model blijft in geheugen = continue kosten
- Overweeg auto-sleep/wake mechanisme

## 📚 Volgende Stappen

1. **Test Railway setup** - Zie of het werkt
2. **Monitor performance** - Check latency
3. **Beslis:** Railway (CPU) of Lambda Labs (GPU)?
4. **Optimaliseer:** Als Railway te traag is, overweeg GPU

## 🔄 Migratie naar GPU (Later)

Als Railway te traag is, kun je later migreren naar:
- **Lambda Labs** - Statische IPs, betere availability
- **RunPod** - Goedkoper, maar dynamische URLs
- **Andere GPU providers** - Vast.ai, Paperspace, etc.

De backend code ondersteunt al meerdere providers, dus migratie is eenvoudig!

