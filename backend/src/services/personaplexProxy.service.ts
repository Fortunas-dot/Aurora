import WebSocket from 'ws';
import { runpodService } from './runpod.service';

export class PersonaPlexProxy {
  private personaplexUrl: string;
  private rejectUnauthorized: boolean;
  private activeConnections: Set<WebSocket> = new Set();
  private idleTimeout: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // RunPod pod URL (will be set dynamically)
    this.personaplexUrl = process.env.PERSONAPLEX_SERVER_URL || 
      'wss://localhost:8998';
    
    // Accept self-signed certs (PersonaPlex gebruikt temporary SSL)
    this.rejectUnauthorized = false;
  }

  /**
   * Ensure pod is running before connecting
   */
  private async ensurePodRunning(): Promise<void> {
    // Check if RunPod is configured
    if (!process.env.RUNPOD_API_KEY || !process.env.RUNPOD_POD_ID) {
      console.warn('⚠️ RunPod not configured - skipping pod auto-start');
      console.warn('⚠️ Using static PERSONAPLEX_SERVER_URL:', this.personaplexUrl);
      return; // Continue with static URL if configured
    }

    console.log('🔍 Checking RunPod pod status...');
    let isRunning = false;
    try {
      isRunning = await runpodService.isPodRunning();
    } catch (error: any) {
      console.warn('⚠️ Error checking pod status:', error.message);
      console.warn('⚠️ Will attempt to start pod anyway...');
    }
    
    if (!isRunning) {
      console.log('🚀 Pod is stopped, starting it...');
      const started = await runpodService.startPod();
      
      if (!started) {
        // Check if we have a static URL configured - if so, use that as fallback
        if (process.env.PERSONAPLEX_SERVER_URL && process.env.PERSONAPLEX_SERVER_URL !== 'wss://localhost:8998') {
          console.warn('⚠️ Failed to start RunPod pod (possibly no free GPUs available)');
          console.warn('⚠️ Using static PERSONAPLEX_SERVER_URL as fallback:', process.env.PERSONAPLEX_SERVER_URL);
          this.personaplexUrl = process.env.PERSONAPLEX_SERVER_URL;
          return; // Continue with static URL
        }
        throw new Error('Failed to start RunPod pod. No free GPUs available or check RunPod API credentials.');
      }

      console.log('⏳ Waiting for pod to be ready...');
      // Wait for pod to be ready
      const ready = await runpodService.waitForPodReady(120); // 2 minutes max
      if (!ready) {
        // Check if we have a static URL configured - if so, use that as fallback
        if (process.env.PERSONAPLEX_SERVER_URL && process.env.PERSONAPLEX_SERVER_URL !== 'wss://localhost:8998') {
          console.warn('⚠️ Pod did not become ready in time');
          console.warn('⚠️ Using static PERSONAPLEX_SERVER_URL as fallback:', process.env.PERSONAPLEX_SERVER_URL);
          this.personaplexUrl = process.env.PERSONAPLEX_SERVER_URL;
          return; // Continue with static URL
        }
        throw new Error('Pod did not become ready in time');
      }

      // Get updated URL (in case IP changed)
      const newUrl = await runpodService.getPodPublicUrl();
      if (newUrl) {
        console.log('🔄 Updated PersonaPlex URL:', newUrl);
        this.personaplexUrl = newUrl;
      }
    } else {
      console.log('✅ Pod is already running');
    }
  }

  /**
   * Reset idle timeout (pod will stop after inactivity)
   */
  private resetIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    // Only set timeout if no active connections
    if (this.activeConnections.size === 0) {
      this.idleTimeout = setTimeout(async () => {
        console.log('⏰ No activity for 15 minutes, stopping pod...');
        await runpodService.stopPod();
      }, this.IDLE_TIMEOUT_MS);
    }
  }

  /**
   * Create WebSocket bridge between client and PersonaPlex server
   */
  async createBridge(
    clientWs: WebSocket,
    textPrompt: string,
    voicePrompt: string = 'NATF2.pt'
  ): Promise<void> {
    // Ensure pod is running
    await this.ensurePodRunning();

    // Add to active connections
    this.activeConnections.add(clientWs);
    this.resetIdleTimeout();

    // Remove from active connections when closed
    clientWs.on('close', () => {
      this.activeConnections.delete(clientWs);
      this.resetIdleTimeout();
    });

    return new Promise((resolve, reject) => {
      console.log(`🔗 Connecting to PersonaPlex at: ${this.personaplexUrl}`);

      // Store PersonaPlex WebSocket reference
      let personaplexWs: WebSocket | null = null;

      // Forward messages from client to PersonaPlex
      // Register this handler early so we don't miss messages
      const clientMessageHandler = (data: WebSocket.Data) => {
        if (personaplexWs && personaplexWs.readyState === WebSocket.OPEN) {
          console.log('📤 Forwarding client message to PersonaPlex');
          personaplexWs.send(data);
        } else {
          console.warn('⚠️ PersonaPlex not ready, buffering message');
          // Could buffer messages here if needed
        }
      };
      clientWs.on('message', clientMessageHandler);

      // Forward messages from PersonaPlex to client
      const personaplexMessageHandler = (data: WebSocket.Data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          console.log('📥 Forwarding PersonaPlex message to client');
          clientWs.send(data);
        }
      };

      // Connect to PersonaPlex server
      personaplexWs = new WebSocket(this.personaplexUrl, {
        rejectUnauthorized: this.rejectUnauthorized,
      });

      personaplexWs.on('open', () => {
        console.log('✅ Connected to PersonaPlex server');
        
        // Register message handler after connection is open
        personaplexWs!.on('message', personaplexMessageHandler);
        
        // Send initial configuration
        // Note: Exact format depends on PersonaPlex API
        // This is a placeholder - adjust based on actual API
        const config = {
          type: 'session.update',
          text_prompt: textPrompt,
          voice_prompt: voicePrompt,
        };

        try {
          personaplexWs!.send(JSON.stringify(config));
          console.log('📤 Sent PersonaPlex configuration:', JSON.stringify(config, null, 2));
          resolve();
        } catch (error) {
          console.error('❌ Error sending config:', error);
          reject(error);
        }
      });

      // Handle errors
      personaplexWs.on('error', (error: Error) => {
        console.error('❌ PersonaPlex connection error:', error);
        console.error('Error details:', error.message, error.stack);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1011, 'PersonaPlex connection failed');
        }
        reject(error);
      });

      personaplexWs.on('close', (code: number, reason: Buffer) => {
        console.log(`PersonaPlex connection closed: ${code} - ${reason.toString()}`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
      });

      clientWs.on('close', () => {
        console.log('Client connection closed');
        this.activeConnections.delete(clientWs);
        this.resetIdleTimeout();
        
        if (personaplexWs.readyState === WebSocket.OPEN) {
          personaplexWs.close();
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (personaplexWs.readyState !== WebSocket.OPEN) {
          reject(new Error('PersonaPlex connection timeout'));
        }
      }, 30000);
    });
  }
}

export const personaplexProxy = new PersonaPlexProxy();


