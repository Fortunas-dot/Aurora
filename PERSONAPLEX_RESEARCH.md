# PersonaPlex Deployment Research - Officiële Aanbevelingen

## 📋 Wat PersonaPlex Zelf Adviseert

### Officiële Launch Commands

**Standaard (GPU):**
```bash
SSL_DIR=$(mktemp -d); python -m moshi.server --ssl "$SSL_DIR"
```

**CPU Offload (alleen voor GPU's met onvoldoende VRAM):**
```bash
SSL_DIR=$(mktemp -d); python -m moshi.server --ssl "$SSL_DIR" --cpu-offload
```

**Belangrijk:** `--cpu-offload` is **NIET** bedoeld voor CPU-only deployment. Het is een fallback voor GPU's die niet genoeg VRAM hebben. Het model blijft grotendeels op GPU draaien, alleen sommige layers worden naar CPU verplaatst.

### Offline Evaluation (CPU)

Voor **offline batch processing** (niet real-time):
```bash
# Install cpu-only PyTorch for offline evaluation on pure CPU
python -m moshi.offline --cpu-offload ...
```

**Dit is NIET voor real-time voice therapy** - alleen voor batch processing van audio files.

## 🎯 Kernbevindingen

### 1. PersonaPlex is Ontworpen voor Real-Time
- **"Real-time, full-duplex speech-to-speech conversational model"**
- **"Low-latency spoken interactions"**
- Dit vereist GPU voor acceptabele performance

### 2. CPU-Only is NIET Officieel Ondersteund voor Real-Time
- `--cpu-offload` = GPU met onvoldoende VRAM
- Offline CPU = alleen voor batch processing
- Geen officiële CPU-only real-time deployment guide

### 3. GPU Requirements
- Model is 7B parameters
- Vereist GPU met voldoende VRAM (waarschijnlijk 16GB+)
- Blackwell GPU's hebben speciale PyTorch installatie nodig

## 🌐 Hoe Anderen Het Draaien

### Community Patterns (gebaseerd op README)

1. **Lokale GPU Server**
   - Direct op eigen hardware met GPU
   - Web UI op `localhost:8998`

2. **Cloud GPU Instances**
   - Geen specifieke provider genoemd
   - Maar vereist GPU met voldoende VRAM
   - WebSocket server op poort 8998

3. **Docker Deployment**
   - `Dockerfile` aanwezig in repo
   - `docker-compose.yaml` voor containerized deployment
   - Vereist nog steeds GPU in container

## ⚠️ Conclusie voor Jouw Situatie

### Railway (CPU-Only) is NIET Aanbevolen
- ❌ Geen officiële CPU-only real-time support
- ❌ 5-15 seconden latency is niet "real-time"
- ❌ Niet geschikt voor "low-latency spoken interactions"
- ✅ Werkt technisch, maar niet voor productie use case

### GPU Providers Zijn Vereist
- ✅ RunPod (huidige keuze) - heeft GPU availability issues
- ✅ Lambda Labs - statische IPs, betrouwbaarder
- ✅ Vast.ai - alternatief met betere beschikbaarheid
- ✅ OVHcloud - enterprise optie met statische IPs

## 💡 Aanbeveling

**Voor Real-Time Voice Therapy:**
1. **Gebruik GPU provider** (Lambda Labs, Vast.ai, of OVHcloud)
2. **Vermijd CPU-only** voor productie
3. **Test Railway CPU** alleen als proof-of-concept

**Voor Development/Testing:**
- Railway CPU kan werken voor testing
- Maar verwacht 5-15 seconden latency
- Niet geschikt voor echte gebruikers

## 📚 Bronnen

- [PersonaPlex GitHub](https://github.com/NVIDIA/personaplex)
- [PersonaPlex HuggingFace](https://huggingface.co/nvidia/personaplex-7b-v1)
- [PersonaPlex Paper](https://research.nvidia.com/labs/adlr/files/personaplex/personaplex_preprint.pdf)
- [PersonaPlex Discord](https://discord.gg/5jAXrrbwRb)

