/**
 * OpenAI Realtime API WebSocket Proxy
 * 
 * This proxy adds the Authorization header that mobile WebSocket clients can't send.
 * Deploy to Railway, Render, Heroku, or any Node.js hosting.
 * 
 * Environment Variables:
 * - OPENAI_API_KEY: Your OpenAI API key (required)
 * - PORT: Server port (auto-set by Railway/Heroku)
 */

const WebSocket = require('ws');
const http = require('http');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const PORT = process.env.PORT || 8080;
// Use the standard realtime preview model
const REALTIME_API_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview';

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable not set!');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Health check endpoint for Railway/monitoring
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OpenAI Realtime API Proxy - Connect via WebSocket');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWs, req) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`Client connected from ${clientIP}`);

  // Create connection to OpenAI Realtime API with proper headers
  const openaiWs = new WebSocket(REALTIME_API_URL, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  let isOpenAIConnected = false;
  const messageQueue = [];

  // Forward messages from client to OpenAI
  clientWs.on('message', (data) => {
    // IMPORTANT: Convert to string before forwarding - fixes encoding issues
    const msgStr = data.toString();
    try {
      const parsed = JSON.parse(msgStr);
      console.log(`📤 Client -> OpenAI: ${parsed.type}`);
      console.log(`📤 Full message: ${msgStr.substring(0, 500)}`);
    } catch (e) {
      console.log(`📤 Client -> OpenAI: (binary or invalid JSON)`);
      console.log(`📤 Raw data (first 200 chars): ${msgStr.substring(0, 200)}`);
    }
    
    if (isOpenAIConnected && openaiWs.readyState === WebSocket.OPEN) {
      // Send as STRING, not Buffer - this fixes the server_error!
      openaiWs.send(msgStr);
    } else {
      console.log('⏳ Queuing message - OpenAI not ready');
      messageQueue.push(msgStr);
    }
  });

  // Forward messages from OpenAI to client
  openaiWs.on('message', (data, isBinary) => {
    const msgStr = isBinary ? '(binary)' : data.toString();
    try {
      const parsed = JSON.parse(msgStr);
      if (parsed.type === 'error') {
        console.log(`📥 OpenAI -> Client: ERROR`);
        console.log(`📥 Full error: ${JSON.stringify(parsed, null, 2)}`);
      } else {
        console.log(`📥 OpenAI -> Client: ${parsed.type}`);
      }
    } catch (e) {
      console.log(`📥 OpenAI -> Client: (binary or non-JSON)`);
    }
    
    if (clientWs.readyState === WebSocket.OPEN) {
      const message = isBinary ? data : data.toString();
      clientWs.send(message);
    }
  });

  // Handle OpenAI connection open
  openaiWs.on('open', () => {
    console.log('Connected to OpenAI Realtime API');
    isOpenAIConnected = true;
    
    // Send any queued messages (as strings)
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      openaiWs.send(msg);
    }
  });

  // Handle errors
  clientWs.on('error', (error) => {
    console.error('Client WebSocket error:', error.message);
  });

  openaiWs.on('error', (error) => {
    console.error('OpenAI WebSocket error:', error.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1011, 'OpenAI connection error');
    }
  });

  // Handle close
  clientWs.on('close', (code, reason) => {
    console.log(`Client disconnected: ${code} ${reason}`);
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });

  openaiWs.on('close', (code, reason) => {
    console.log(`OpenAI connection closed: ${code} ${reason}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code, reason);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     OpenAI Realtime API Proxy Server                       ║
╠════════════════════════════════════════════════════════════╣
║  Status:  Running                                          ║
║  Port:    ${String(PORT).padEnd(47)}║
║  Health:  /health                                          ║
╚════════════════════════════════════════════════════════════╝

Ready to accept WebSocket connections.
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


