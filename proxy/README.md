# OpenAI Realtime API Proxy

WebSocket proxy server that adds authentication headers for OpenAI's Realtime API.

## Why This Exists

React Native's WebSocket implementation cannot send custom headers during the connection handshake. OpenAI's Realtime API requires:
- `Authorization: Bearer <api-key>`
- `OpenAI-Beta: realtime=v1`

This proxy accepts connections from your mobile app and forwards them to OpenAI with the required headers.

## Deploy to Railway (Recommended)

### 1. Push to GitHub

Create a new repository with just the `proxy` folder contents, or deploy from a subdirectory.

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. If using a monorepo, set **Root Directory** to `proxy`
5. Add environment variable:
   - `OPENAI_API_KEY` = `sk-your-key-here`
6. Deploy!

### 3. Get Your URL

Railway will provide a URL like: `https://your-app.up.railway.app`

For WebSocket, use: `wss://your-app.up.railway.app`

### 4. Update Your App

In `mobile/.env` or environment:
```
PROXY_URL=wss://your-app.up.railway.app
```

Or directly in `mobile/app.config.js`:
```javascript
extra: {
  PROXY_URL: 'wss://your-app.up.railway.app',
}
```

## Deploy to Other Platforms

### Render
1. Create new **Web Service**
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add `OPENAI_API_KEY` environment variable

### Heroku
```bash
heroku create your-proxy-name
heroku config:set OPENAI_API_KEY=sk-your-key
git push heroku main
```

### Fly.io
```bash
fly launch
fly secrets set OPENAI_API_KEY=sk-your-key
fly deploy
```

## Local Development

```bash
cd proxy
npm install
OPENAI_API_KEY=sk-your-key npm start
```

## Health Check

The server exposes a `/health` endpoint for monitoring:
```
GET https://your-app.up.railway.app/health
→ {"status":"ok","timestamp":"2024-..."}
```

## Security Notes

- Never commit your API key to git
- Use environment variables for secrets
- Consider adding rate limiting for production
- The proxy should be behind HTTPS in production (Railway handles this automatically)


