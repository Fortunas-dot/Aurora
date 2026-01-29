# Wat Je Nodig Hebt voor Lambda Labs Setup

## ✅ Wat Ik Heb Gedaan

1. ✅ **Lambda Labs service gemaakt** (`backend/src/services/lambdalabs.service.ts`)
   - Start/stop instance via API
   - Check instance status
   - Get statische IP
   - Wait for instance ready

2. ✅ **PersonaPlex proxy aangepast** (`backend/src/services/personaplexProxy.service.ts`)
   - Ondersteunt nu zowel Lambda Labs als RunPod
   - Lambda Labs heeft prioriteit als beide geconfigureerd zijn
   - Auto start/stop werkt voor beide providers

3. ✅ **Documentatie gemaakt** (`backend/LAMBDALABS_SETUP.md`)
   - Stap-voor-stap setup guide
   - Environment variables
   - Troubleshooting

## 📋 Wat Jij Nodig Hebt

### 1. Lambda Labs Account
- [ ] Account aanmaken op [lambdalabs.com](https://lambdalabs.com)
- [ ] Account verificatie (kan goedkeuring vereisen)

### 2. Lambda Labs API Key
- [ ] Ga naar [Lambda Labs Dashboard](https://cloud.lambdalabs.com)
- [ ] Settings → API Keys → Create API Key
- [ ] **Kopieer de API key** (je ziet hem maar één keer!)

### 3. Lambda Labs Instance
- [ ] Launch een GPU instance (RTX 3090 of A10 voor PersonaPlex 7B)
- [ ] **Noteer de Instance ID** (bijv. `i-1234567890abcdef0`)
- [ ] **Noteer de Instance IP** (statisch!)

### 4. PersonaPlex Installeren op Instance
- [ ] SSH naar instance
- [ ] PersonaPlex installeren (zie `backend/LAMBDALABS_SETUP.md`)
- [ ] PersonaPlex server starten op poort 8998
- [ ] Test of het werkt (Web UI op `https://<ip>:8998`)

### 5. Railway Environment Variables
Voeg deze toe aan je Railway backend service:

```env
LAMBDALABS_API_KEY=your_api_key_here
LAMBDALABS_INSTANCE_ID=i-1234567890abcdef0
PERSONAPLEX_SERVER_URL=wss://<instance-ip>:8998
```

### 6. Firewall Rules
- [ ] Poort 8998 openzetten op Lambda Labs instance
- [ ] Security group configureren

## 🚀 Volgende Stappen

1. **Account & Instance aanmaken** (stap 1-3 hierboven)
2. **PersonaPlex installeren** (stap 4)
3. **Railway configureren** (stap 5)
4. **Testen** - Deploy en test of auto start/stop werkt

## 📚 Documentatie

- **Setup Guide**: `backend/LAMBDALABS_SETUP.md`
- **Lambda Labs API Docs**: [docs.lambdalabs.com](https://docs.lambdalabs.com/)

## ⚠️ Belangrijk

- **Lambda Labs heeft prioriteit** - Als beide (Lambda Labs + RunPod) geconfigureerd zijn, gebruikt de code Lambda Labs
- **Statische IPs** - Lambda Labs instances hebben statische IPs, dus URL verandert niet
- **On-demand billing** - Betaal alleen per uur dat instance draait
- **Auto stop** - Instance stopt automatisch na 15 minuten idle

## 💡 Tips

- **Test eerst lokaal** - Zorg dat PersonaPlex werkt op je instance voordat je Railway configureert
- **Monitor kosten** - Check Lambda Labs dashboard voor gebruik/kosten
- **Keep RunPod** - Je kunt RunPod config behouden als fallback tijdens migratie

## ❓ Vragen?

Als je hulp nodig hebt met:
- Lambda Labs account setup
- Instance aanmaken
- PersonaPlex installeren
- Railway configuratie

Laat het weten!

