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
    const isRunning = await runpodService.isPodRunning();
    
    if (!isRunning) {
      console.log('🚀 Pod is stopped, starting it...');
      const started = await runpodService.startPod();
      
      if (!started) {
        throw new Error('Failed to start RunPod pod');
      }

      // Wait for pod to be ready
      const ready = await runpodService.waitForPodReady(120); // 2 minutes max
      if (!ready) {
        throw new Error('Pod did not become ready in time');
      }

      // Get updated URL (in case IP changed)
      const newUrl = await runpodService.getPodPublicUrl();
      if (newUrl) {
        this.personaplexUrl = newUrl;
      }
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

      // Connect to PersonaPlex server
      const personaplexWs = new WebSocket(this.personaplexUrl, {
        rejectUnauthorized: this.rejectUnauthorized,
      });

      personaplexWs.on('open', () => {
        console.log('✅ Connected to PersonaPlex server');
        
        // Send initial configuration
        // Note: Exact format depends on PersonaPlex API
        // This is a placeholder - adjust based on actual API
        const config = {
          type: 'session.update',
          text_prompt: textPrompt,
          voice_prompt: voicePrompt,
        };

        try {
          personaplexWs.send(JSON.stringify(config));
          console.log('📤 Sent PersonaPlex configuration');
          resolve();
        } catch (error) {
          console.error('❌ Error sending config:', error);
          reject(error);
        }
      });

      // Forward messages from client to PersonaPlex
      clientWs.on('message', (data: WebSocket.Data) => {
        if (personaplexWs.readyState === WebSocket.OPEN) {
          personaplexWs.send(data);
        }
      });

      // Forward messages from PersonaPlex to client
      personaplexWs.on('message', (data: WebSocket.Data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data);
        }
      });

      // Handle errors
      personaplexWs.on('error', (error: Error) => {
        console.error('❌ PersonaPlex connection error:', error);
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


