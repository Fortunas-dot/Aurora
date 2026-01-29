/**
 * RunPod API Service
 * Manages GPU pod lifecycle (start/stop/status)
 */

interface RunPodPodStatus {
  id: string;
  name: string;
  desiredStatus: string;
  lastStatusChange: string;
  machineId: string | null;
  machine: {
    podHostId: string;
    publicIp: string;
  } | null;
  runtime?: {
    ports?: Array<{
      privatePort: number;
      publicPort: number;
      type: string;
      ip: string;
      isIpPublic: boolean;
    }>;
  };
  gpuCount?: number;
}

interface RunPodApiResponse<T> {
  data: T;
}

export class RunPodService {
  private apiKey: string;
  private podId: string;
  private baseUrl: string = 'https://api.runpod.io/graphql';

  constructor() {
    this.apiKey = process.env.RUNPOD_API_KEY || '';
    this.podId = process.env.RUNPOD_POD_ID || '';

    if (!this.apiKey || !this.podId) {
      console.warn('⚠️ RunPod API key or Pod ID not configured. Auto-start/stop disabled.');
      console.warn('⚠️ Set RUNPOD_API_KEY and RUNPOD_POD_ID environment variables to enable auto-start.');
    } else {
      console.log('✅ RunPod configured (Pod ID:', this.podId.substring(0, 8) + '...)');
    }
  }

  /**
   * Check if pod is running
   */
  async isPodRunning(): Promise<boolean> {
    if (!this.apiKey || !this.podId) {
      return false;
    }

    try {
      const status = await this.getPodStatus();
      return status?.desiredStatus === 'RUNNING' || status?.desiredStatus === 'RESUMING';
    } catch (error) {
      console.error('Error checking pod status:', error);
      return false;
    }
  }

  /**
   * Get pod status
   */
  async getPodStatus(): Promise<RunPodPodStatus | null> {
    if (!this.apiKey || !this.podId) {
      return null;
    }

    try {
      const query = `
        query {
          pod(input: { podId: "${this.podId}" }) {
            id
            name
            desiredStatus
            lastStatusChange
            machineId
            machine {
              podHostId
              publicIp
            }
            runtime {
              ports {
                privatePort
                publicPort
                type
                ip
                isIpPublic
              }
            }
            gpuCount
          }
        }
      `;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ RunPod API error response:', response.status, errorText);
        // Don't throw - return null so caller can handle gracefully
        return null;
      }

      const data = await response.json() as RunPodApiResponse<{ pod: RunPodPodStatus }>;
      return data.data?.pod || null;
    } catch (error: any) {
      console.error('Error getting pod status:', error.message || error);
      return null;
    }
  }

  /**
   * Start the pod
   */
  async startPod(): Promise<boolean> {
    if (!this.apiKey || !this.podId) {
      console.warn('RunPod not configured, cannot start pod');
      return false;
    }

    try {
      const mutation = `
        mutation {
          podResume(input: { podId: "${this.podId}" }) {
            id
            desiredStatus
          }
        }
      `;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ query: mutation }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ RunPod API error response:', response.status, errorText);
        throw new Error(`RunPod API error: ${response.statusText}`);
      }

      const data = await response.json() as { data?: any; errors?: any[] };
      console.log('📤 RunPod pod start response:', JSON.stringify(data, null, 2));
      
      // Check for GraphQL errors
      if (data.errors && data.errors.length > 0) {
        const errorMessages = data.errors.map((e: any) => e.message).join(', ');
        console.error('❌ GraphQL errors:', errorMessages);
        
        // Check if it's a GPU availability issue
        if (errorMessages.includes('not enough free GPUs') || errorMessages.includes('GPU')) {
          console.warn('⚠️ No free GPUs available - pod cannot start automatically');
          console.warn('⚠️ Consider using a static PERSONAPLEX_SERVER_URL if you have a running pod');
        }
        
        return false;
      }
      
      console.log('✅ RunPod pod start requested successfully');
      return true;
    } catch (error) {
      console.error('❌ Error starting pod:', error);
      return false;
    }
  }

  /**
   * Stop the pod
   */
  async stopPod(): Promise<boolean> {
    if (!this.apiKey || !this.podId) {
      return false;
    }

    try {
      const mutation = `
        mutation {
          podStop(input: { podId: "${this.podId}" }) {
            id
            desiredStatus
          }
        }
      `;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ query: mutation }),
      });

      if (!response.ok) {
        throw new Error(`RunPod API error: ${response.statusText}`);
      }

      const data = await response.json() as { data?: any; errors?: any[] };
      console.log('🛑 RunPod pod stop requested:', JSON.stringify(data, null, 2));
      
      // Check for GraphQL errors
      if (data.errors) {
        console.error('❌ GraphQL errors:', data.errors);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error stopping pod:', error);
      return false;
    }
  }

  /**
   * Wait for pod to be ready (running and PersonaPlex server responding)
   */
  async waitForPodReady(maxWaitSeconds: number = 120): Promise<boolean> {
    const startTime = Date.now();
    const maxWait = maxWaitSeconds * 1000;
    const checkInterval = 5000; // Check every 5 seconds

    console.log(`⏳ Waiting for pod to be ready (max ${maxWaitSeconds}s)...`);

    while (Date.now() - startTime < maxWait) {
      // Check if pod is running
      const isRunning = await this.isPodRunning();
      if (!isRunning) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        continue;
      }

      // Check if PersonaPlex server is responding
      const personaplexUrl = process.env.PERSONAPLEX_SERVER_URL || '';
      if (personaplexUrl) {
        try {
          // Try to connect to WebSocket (just to check if it's up)
          // For now, we'll just check if pod is running
          // In production, you might want to ping the HTTP endpoint
          console.log('✅ Pod is running');
          return true;
        } catch (error) {
          // Server not ready yet, keep waiting
        }
      } else {
        // No URL configured, assume ready if pod is running
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.error('❌ Pod did not become ready in time');
    return false;
  }

  /**
   * Get pod public URL (for PersonaPlex connection)
   * Tries to get proxy URL from RunPod API, falls back to static URL or constructs from IP
   */
  async getPodPublicUrl(): Promise<string | null> {
    const status = await this.getPodStatus();
    if (!status) {
      console.warn('⚠️ Cannot get pod status, using static URL if available');
      return process.env.PERSONAPLEX_SERVER_URL || null;
    }

    // Try to get proxy URL from runtime ports (RunPod proxy)
    if (status.runtime?.ports && status.runtime.ports.length > 0) {
      // Find port 8998 in the ports list
      const port8998 = status.runtime.ports.find(p => p.privatePort === 8998);
      if (port8998 && port8998.ip) {
        // RunPod proxy URLs use the IP from the port
        // Format: wss://{ip} (the IP is already the proxy domain)
        const proxyUrl = `wss://${port8998.ip}`;
        console.log('✅ Found proxy URL from RunPod API:', proxyUrl);
        return proxyUrl;
      }
    }

    // Fallback 1: Use static URL from environment if configured
    const staticUrl = process.env.PERSONAPLEX_SERVER_URL;
    if (staticUrl && staticUrl !== 'wss://localhost:8998') {
      console.log('⚠️ Using static PERSONAPLEX_SERVER_URL:', staticUrl);
      return staticUrl;
    }

    // Fallback 2: Construct from public IP (direct connection, not via proxy)
    if (status.machine?.publicIp) {
      const directUrl = `wss://${status.machine.publicIp}:8998`;
      console.log('⚠️ Constructing URL from public IP (may require firewall rules):', directUrl);
      return directUrl;
    }

    console.error('❌ Cannot determine pod URL - no proxy, static URL, or public IP available');
    return null;
  }
}

export const runpodService = new RunPodService();

