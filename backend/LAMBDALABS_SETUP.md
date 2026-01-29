# Lambda Labs Setup voor PersonaPlex

## ✅ Wat Lambda Labs Oplost

- ✅ **Statische IPs** - URL verandert niet (geen dynamische URL problemen)
- ✅ **Betere GPU availability** - Geen "GPUs no longer available" errors
- ✅ **REST API** - Simpeler dan RunPod's GraphQL
- ✅ **99.9% uptime SLA** - Betrouwbaarder dan RunPod
- ✅ **On-demand billing** - Betaal alleen per uur dat instance draait

## 📋 Stap 1: Lambda Labs Account & Instance Aanmaken

### 1.1 Account Aanmaken
1. Ga naar [Lambda Labs](https://lambdalabs.com)
2. Maak een account aan
3. Verifieer je account (kan goedkeuring vereisen)

### 1.2 API Key Aanmaken
1. Ga naar [Lambda Labs Dashboard](https://cloud.lambdalabs.com)
2. Ga naar **Settings** → **API Keys**
3. Klik **"Create API Key"**
4. Geef het een naam (bijv. `railway-backend`)
5. **Kopieer de API key** - je ziet hem maar één keer!

### 1.3 Instance Aanmaken
1. Ga naar **Instances** in het dashboard
2. Klik **"Launch Instance"**
3. Kies een GPU type (bijv. **RTX 3090** of **A10** voor PersonaPlex 7B)
4. Kies een **region** (bijv. `us-east-1`)
5. Kies een **SSH key** (maak er een aan als je die nog niet hebt)
6. Klik **"Launch"**
7. **Noteer de Instance ID** (bijv. `i-1234567890abcdef0`)

### 1.4 PersonaPlex Installeren op Instance
1. **SSH naar je instance:**
   ```bash
   ssh ubuntu@<instance-ip>
   ```

2. **Installeer PersonaPlex:**
   ```bash
   # Clone PersonaPlex repo
   git clone https://github.com/NVIDIA/personaplex.git
   cd personaplex
   
   # Install dependencies
   sudo apt update
   sudo apt install -y libopus-dev python3.10 python3-pip
   
   # Install PersonaPlex
   pip install moshi/.
   pip install accelerate
   
   # Set HuggingFace token
   export HF_TOKEN=your_huggingface_token_here
   ```

3. **Start PersonaPlex server:**
   ```bash
   SSL_DIR=$(mktemp -d)
   python -m moshi.server --ssl "$SSL_DIR" --host 0.0.0.0 --port 8998
   ```

4. **Test of het werkt:**
   - Open `https://<instance-ip>:8998` in browser
   - Je zou de PersonaPlex Web UI moeten zien

5. **Maak een systemd service (optioneel, voor auto-start):**
   ```bash
   sudo nano /etc/systemd/system/personaplex.service
   ```
   
   Voeg toe:
   ```ini
   [Unit]
   Description=PersonaPlex Server
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/personaplex
   Environment="HF_TOKEN=your_huggingface_token_here"
   ExecStart=/usr/bin/python3 -m moshi.server --ssl /tmp/ssl --host 0.0.0.0 --port 8998
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   
   Start de service:
   ```bash
   sudo systemctl enable personaplex
   sudo systemctl start personaplex
   ```

## 📋 Stap 2: Railway Environment Variables

Voeg deze environment variables toe aan je **Railway backend service**:

```env
# Lambda Labs Configuration
LAMBDALABS_API_KEY=your_lambda_labs_api_key_here
LAMBDALABS_INSTANCE_ID=i-1234567890abcdef0

# PersonaPlex Server URL (optioneel - wordt automatisch opgehaald)
# Format: wss://<instance-ip>:8998
PERSONAPLEX_SERVER_URL=wss://<instance-ip>:8998
```

### Hoe te vinden:
- **LAMBDALABS_API_KEY**: Dashboard → Settings → API Keys
- **LAMBDALABS_INSTANCE_ID**: Dashboard → Instances → Instance ID
- **PERSONAPLEX_SERVER_URL**: Instance IP (statisch!) + poort 8998

## 📋 Stap 3: Firewall Rules

Zorg dat poort **8998** open is op je Lambda Labs instance:

1. Ga naar Lambda Labs Dashboard → Instances
2. Klik op je instance
3. Ga naar **Security Groups** of **Firewall**
4. Voeg regel toe:
   - **Port**: `8998`
   - **Protocol**: `TCP`
   - **Source**: `0.0.0.0/0` (of specifiek Railway IP range)

## 🔄 Hoe Het Werkt Nu

1. **User verbindt** → App verbindt naar Railway `/api/personaplex/ws`
2. **Railway checkt** → Is Lambda Labs instance running?
3. **Als gestopt** → Railway start instance via Lambda Labs API
4. **Railway wacht** → Tot instance ready is (max 2 minuten)
5. **Railway bridge** → WebSocket verbinding naar PersonaPlex
6. **Na 15 min idle** → Railway stopt instance automatisch

## 🧪 Testen

1. **Stop je instance handmatig** in Lambda Labs dashboard
2. **Open app** → Voice Therapy → Select "PersonaPlex 7B"
3. **Check Lambda Labs** → Instance zou automatisch moeten starten
4. **Wacht 15 minuten** met geen verbindingen → Instance zou moeten stoppen

## 💰 Kosten

- **Hourly billing** - Betaal alleen per uur dat instance draait
- **Voorbeeld**: RTX 3090 = ~$0.50-1.00/uur
- **Bij laag gebruik** (bijv. 50 uur/maand): ~$25-50/maand
- **Bij hoog gebruik** (bijv. 200 uur/maand): ~$100-200/maand

## ⚠️ Troubleshooting

### Instance start niet
- Check `LAMBDALABS_API_KEY` is correct
- Check `LAMBDALABS_INSTANCE_ID` is correct
- Check Lambda Labs API key heeft juiste permissions
- Check instance bestaat nog in dashboard

### Connection fails
- Check `PERSONAPLEX_SERVER_URL` is correct (wss:// not https://)
- Check PersonaPlex server draait op instance
- Check firewall rules (poort 8998 open)
- Check instance IP is correct (statisch, zou niet moeten veranderen)

### Instance stopt niet
- Check logs voor idle timeout errors
- Verify geen actieve verbindingen meer
- Check Lambda Labs API werkt correct

## 🔄 Migratie van RunPod

Als je al RunPod gebruikt:

1. **Behoud RunPod config** (voor fallback):
   ```env
   RUNPOD_API_KEY=...
   RUNPOD_POD_ID=...
   ```

2. **Voeg Lambda Labs toe** (heeft prioriteit):
   ```env
   LAMBDALABS_API_KEY=...
   LAMBDALABS_INSTANCE_ID=...
   ```

3. **Deploy** - Code gebruikt automatisch Lambda Labs als die geconfigureerd is

4. **Test** - Verifieer dat Lambda Labs werkt

5. **Verwijder RunPod** (optioneel) - Als alles werkt, kun je RunPod config verwijderen

## 📚 API Documentatie

- [Lambda Labs API Docs](https://docs.lambdalabs.com/)
- [Lambda Labs Dashboard](https://cloud.lambdalabs.com)

