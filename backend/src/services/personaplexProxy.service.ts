import WebSocket from 'ws';
import { runpodService } from './runpod.service';
import { lambdalabsService } from './lambdalabs.service';

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
   * Ensure instance/pod is running before connecting
   * Supports Railway (static URL), Lambda Labs, and RunPod
   * Railway takes priority (no management needed, just use static URL)
   */
  private async ensurePodRunning(): Promise<void> {
    // Check if Railway is configured (static URL, no management needed)
    const railwayUrl = process.env.PERSONAPLEX_SERVER_URL;
    const isRailway = railwayUrl && 
      (railwayUrl.includes('railway.app') || railwayUrl.includes('railway.railway.app'));
    
    if (isRailway) {
      console.log('✅ Using Railway PersonaPlex service (static URL, no management needed)');
      this.personaplexUrl = railwayUrl;
      return; // Railway is always "running", just use the URL
    }

    // Check which GPU provider is configured (Lambda Labs takes priority)
    const useLambdaLabs = process.env.LAMBDALABS_API_KEY && process.env.LAMBDALABS_INSTANCE_ID;
    const useRunPod = process.env.RUNPOD_API_KEY && process.env.RUNPOD_POD_ID;

    if (!useLambdaLabs && !useRunPod) {
      console.warn('⚠️ No provider configured - using static PERSONAPLEX_SERVER_URL:', this.personaplexUrl);
      return; // Continue with static URL if configured
    }

    // Use Lambda Labs if configured
    if (useLambdaLabs) {
      return this.ensureLambdaLabsInstanceRunning();
    }

    // Fallback to RunPod
    if (useRunPod) {
      return this.ensureRunPodRunning();
    }
  }

  /**
   * Ensure Lambda Labs instance is running
   */
  private async ensureLambdaLabsInstanceRunning(): Promise<void> {
    console.log('🔍 Checking Lambda Labs instance status...');
    let isRunning = false;
    try {
      isRunning = await lambdalabsService.isInstanceRunning();
    } catch (error: any) {
      console.warn('⚠️ Error checking instance status:', error.message);
      console.warn('⚠️ Will attempt to start instance anyway...');
    }
    
    if (!isRunning) {
      console.log('🚀 Instance is stopped, starting it...');
      const started = await lambdalabsService.startInstance();
      
      if (!started) {
        // Check if we have a static URL configured - if so, use that as fallback
        if (process.env.PERSONAPLEX_SERVER_URL && process.env.PERSONAPLEX_SERVER_URL !== 'wss://localhost:8998') {
          console.warn('⚠️ Failed to start Lambda Labs instance');
          console.warn('⚠️ Using static PERSONAPLEX_SERVER_URL as fallback:', process.env.PERSONAPLEX_SERVER_URL);
          this.personaplexUrl = process.env.PERSONAPLEX_SERVER_URL;
          return; // Continue with static URL
        }
        throw new Error('Failed to start Lambda Labs instance. Check Lambda Labs dashboard and API credentials.');
      }

      console.log('⏳ Waiting for instance to be ready...');
      // Wait for instance to be ready
      const ready = await lambdalabsService.waitForInstanceReady(120); // 2 minutes max
      if (!ready) {
        // Check if we have a static URL configured - if so, use that as fallback
        if (process.env.PERSONAPLEX_SERVER_URL && process.env.PERSONAPLEX_SERVER_URL !== 'wss://localhost:8998') {
          console.warn('⚠️ Instance did not become ready in time');
          console.warn('⚠️ Using static PERSONAPLEX_SERVER_URL as fallback:', process.env.PERSONAPLEX_SERVER_URL);
          this.personaplexUrl = process.env.PERSONAPLEX_SERVER_URL;
          return; // Continue with static URL
        }
        throw new Error('Instance did not become ready in time');
      }

      // Get instance URL (Lambda Labs has static IPs)
      const newUrl = await lambdalabsService.getInstancePublicUrl();
      if (newUrl) {
        console.log('🔄 Updated PersonaPlex URL:', newUrl);
        this.personaplexUrl = newUrl;
      }
    } else {
      console.log('✅ Instance is already running');
      // Update URL in case it changed
      const newUrl = await lambdalabsService.getInstancePublicUrl();
      if (newUrl) {
        this.personaplexUrl = newUrl;
      }
    }
  }

  /**
   * Ensure RunPod pod is running (legacy support)
   */
  private async ensureRunPodRunning(): Promise<void> {
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
          console.warn('⚠️ Failed to start RunPod pod');
          console.warn('⚠️ Possible reasons:');
          console.warn('   - GPUs are no longer available (reassigned or maintenance)');
          console.warn('   - No free GPUs on the host machine');
          console.warn('   - Pod needs to be recreated with new GPUs');
          console.warn('⚠️ Using static PERSONAPLEX_SERVER_URL as fallback:', process.env.PERSONAPLEX_SERVER_URL);
          console.warn('⚠️ Note: This will only work if you have a manually started pod running');
          this.personaplexUrl = process.env.PERSONAPLEX_SERVER_URL;
          return; // Continue with static URL
        }
        throw new Error('Failed to start RunPod pod. GPUs may no longer be available. Check RunPod dashboard and manually start a pod, then update RUNPOD_POD_ID.');
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
   * Reset idle timeout (instance/pod will stop after inactivity)
   * Note: Railway doesn't need stop management (always available)
   */
  private resetIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    // Check if Railway is configured (no idle timeout needed)
    const railwayUrl = process.env.PERSONAPLEX_SERVER_URL;
    const isRailway = railwayUrl && 
      (railwayUrl.includes('railway.app') || railwayUrl.includes('railway.railway.app'));
    
    if (isRailway) {
      // Railway is always available, no need to stop
      return;
    }

    // Only set timeout if no active connections (for GPU providers)
    if (this.activeConnections.size === 0) {
      this.idleTimeout = setTimeout(async () => {
        console.log('⏰ No activity for 15 minutes, stopping instance/pod...');
        
        // Check which provider is configured
        const useLambdaLabs = process.env.LAMBDALABS_API_KEY && process.env.LAMBDALABS_INSTANCE_ID;
        const useRunPod = process.env.RUNPOD_API_KEY && process.env.RUNPOD_POD_ID;

        if (useLambdaLabs) {
          // Lambda Labs doesn't support "stop" - only "terminate" (permanent)
          // We log the idle timeout but don't terminate (would lose all data)
          await lambdalabsService.stopInstance();
          console.warn('⚠️ Lambda Labs instance is still running (costs money)');
          console.warn('⚠️ Manually terminate in dashboard if you want to save costs');
        } else if (useRunPod) {
          await runpodService.stopPod();
        }
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


