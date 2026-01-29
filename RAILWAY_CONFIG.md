# Railway Configuration for PersonaPlex Auto-Start/Stop

## Environment Variables to Add

Go to your **Railway backend service** → **Variables** tab and add these:

```env
RUNPOD_API_KEY=your_runpod_api_key_here
RUNPOD_POD_ID=your_pod_id_here
PERSONAPLEX_SERVER_URL=wss://your-pod-host-8998.proxy.runpod.net
```

## Step-by-Step in Railway

1. **Go to Railway Dashboard**
   - Open your project
   - Click on your **backend service**

2. **Open Variables Tab**
   - Click **"Variables"** in the top menu
   - Or go to **Settings** → **Variables**

3. **Add Each Variable**
   - Click **"+ New Variable"** or **"Add Variable"**
   - Add all 3 variables above
   - Click **"Save"** or **"Deploy"**

4. **Redeploy (if needed)**
   - Railway should auto-deploy when you save variables
   - Or manually trigger a redeploy

## How It Works Now

✅ **User opens PersonaPlex in app**
   → App connects to Railway `/api/personaplex/ws`

✅ **Railway checks if pod is running**
   → If stopped → Railway **starts it automatically** via RunPod API
   → Waits up to 2 minutes for pod to be ready

✅ **Railway bridges connection**
   → WebSocket to PersonaPlex server

✅ **After 15 minutes idle**
   → Railway **stops pod automatically**

## Testing

1. **Stop your pod manually in RunPod** (to test auto-start)
2. **Open app** → Voice Therapy → Select "PersonaPlex 7B"
3. **Check RunPod** → Pod should start automatically
4. **Wait 15 minutes with no connections** → Pod should stop automatically

## Troubleshooting

### Pod doesn't start
- Check `RUNPOD_API_KEY` is correct
- Check `RUNPOD_POD_ID` is correct
- Check RunPod API key has proper permissions (restricted or all)

### Connection fails
- Check `PERSONAPLEX_SERVER_URL` is correct (wss:// not https://)
- Verify PersonaPlex server is running on pod
- Check port 8998 is exposed in RunPod

### Pod doesn't stop
- Check logs for idle timeout errors
- Verify no active connections remain

