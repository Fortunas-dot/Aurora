/**
 * Simple WebSocket Proxy Server for OpenAI Realtime API
 * 
 * This proxy adds the Authorization header that React Native WebSocket can't send.
 * 
 * Usage:
 * 1. Install dependencies: npm install ws
 * 2. Set OPENAI_API_KEY environment variable
 * 3. Run: node proxy-server.js
 * 4. The app will automatically connect via ws://localhost:8080
 */

const WebSocket = require('ws');
const http = require('http');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const PROXY_PORT = 8080;
const REALTIME_API_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable not set!');
  console.error('Set it with:');
  console.error('  Windows PowerShell: $env:OPENAI_API_KEY="sk-..."');
  console.error('  Windows CMD: set OPENAI_API_KEY=sk-...');
  console.error('  Mac/Linux: export OPENAI_API_KEY=sk-...');
  process.exit(1);
}

const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWs, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);

  // Create connection to OpenAI Realtime API with proper headers
  const openaiWs = new WebSocket(REALTIME_API_URL, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  // Forward messages from client to OpenAI
  clientWs.on('message', (data) => {
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(data);
    }
  });

  // Forward messages from OpenAI to client
  openaiWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });

  // Handle errors
  clientWs.on('error', (error) => {
    console.error('Client WebSocket error:', error);
  });

  openaiWs.on('error', (error) => {
    console.error('OpenAI WebSocket error:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });

  // Handle close
  clientWs.on('close', () => {
    console.log('Client disconnected');
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });

  openaiWs.on('close', () => {
    console.log('OpenAI connection closed');
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });

  openaiWs.on('open', () => {
    console.log('Connected to OpenAI Realtime API');
  });
});

server.listen(PROXY_PORT, () => {
  console.log('='.repeat(50));
  console.log(`WebSocket proxy server running on ws://localhost:${PROXY_PORT}`);
  console.log('The app will connect automatically via this proxy');
  console.log('Keep this server running while using the app');
  console.log('='.repeat(50));
});



