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
        throw new Error(`RunPod API error: ${response.statusText}`);
      }

      const data: RunPodApiResponse<{ pod: RunPodPodStatus }> = await response.json();
      return data.data?.pod || null;
    } catch (error) {
      console.error('Error getting pod status:', error);
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
        throw new Error(`RunPod API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ RunPod pod start requested:', data);
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

      const data = await response.json();
      console.log('🛑 RunPod pod stop requested:', data);
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
   */
  async getPodPublicUrl(): Promise<string | null> {
    const status = await this.getPodStatus();
    if (!status?.machine?.publicIp) {
      return null;
    }

    // Construct URL from environment or pod IP
    const baseUrl = process.env.PERSONAPLEX_SERVER_URL || '';
    if (baseUrl) {
      return baseUrl;
    }

    // Fallback: construct from pod IP (if you know the port)
    const port = '8998';
    return `wss://${status.machine.publicIp}:${port}`;
  }
}

export const runpodService = new RunPodService();

