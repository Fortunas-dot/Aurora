# RunPod Auto-Start/Stop Setup

## Environment Variables

Add these to your Railway backend environment variables:

```env
RUNPOD_API_KEY=your_runpod_api_key
RUNPOD_POD_ID=your_pod_id
PERSONAPLEX_SERVER_URL=wss://your-pod-host:8998
```

## How It Works

1. **User connects** → App connects to Railway `/api/personaplex/ws`
2. **Railway checks** → Is RunPod pod running?
3. **If stopped** → Railway calls RunPod API to start pod
4. **Railway waits** → Until pod is ready (max 2 minutes)
5. **Railway bridges** → WebSocket connection to PersonaPlex
6. **After 15 min idle** → Railway stops the pod automatically

## Getting Your RunPod API Key

1. Go to RunPod Dashboard → Settings → API Keys
2. Create new key (name: `railway-backend`)
3. Copy the key

## Getting Your Pod ID

1. Go to RunPod Dashboard → Pods
2. Click your pod
3. Copy the Pod ID (looks like `1gqm690112vqbi`)

## Getting PersonaPlex URL

After exposing port 8998 in RunPod:
1. Go to Pod → Connect tab
2. Find "Port 8998 → HTTP Service"
3. Copy the URL
4. Convert to WebSocket: `https://...` → `wss://...`

Example:
- HTTP: `https://xxxxx-8998.proxy.runpod.net`
- WebSocket: `wss://xxxxx-8998.proxy.runpod.net`

## Testing

1. Set environment variables in Railway
2. Deploy backend
3. Connect from app → PersonaPlex should auto-start
4. Wait 15 minutes with no connections → Pod should auto-stop

## Troubleshooting

### Pod doesn't start
- Check `RUNPOD_API_KEY` is correct
- Check `RUNPOD_POD_ID` is correct
- Check RunPod API permissions

### Pod doesn't stop
- Check logs for idle timeout errors
- Verify no active connections remain

### Connection fails after pod starts
- Check `PERSONAPLEX_SERVER_URL` is correct
- Verify PersonaPlex server is running on pod
- Check port 8998 is exposed

