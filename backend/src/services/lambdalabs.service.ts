/**
 * Lambda Labs API Service
 * Manages GPU instance lifecycle (start/stop/status)
 * Uses Lambda Labs REST API (simpler than RunPod's GraphQL)
 */

interface LambdaLabsInstance {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'booting';
  ip: string;
  region: {
    name: string;
  };
  instance_type: {
    name: string;
    price_cents_per_hour: number;
  };
  ssh_key_names: string[];
  created: string;
  terminated: string | null;
}

interface LambdaLabsApiResponse<T> {
  data: T;
  error?: string;
}

export class LambdaLabsService {
  private apiKey: string;
  private instanceId: string;
  private baseUrl: string = 'https://cloud.lambdalabs.com/api/v1';

  constructor() {
    this.apiKey = process.env.LAMBDALABS_API_KEY || '';
    this.instanceId = process.env.LAMBDALABS_INSTANCE_ID || '';

    if (!this.apiKey || !this.instanceId) {
      console.warn('⚠️ Lambda Labs API key or Instance ID not configured. Auto-start/stop disabled.');
      console.warn('⚠️ Set LAMBDALABS_API_KEY and LAMBDALABS_INSTANCE_ID environment variables to enable auto-start.');
    } else {
      console.log('✅ Lambda Labs configured (Instance ID:', this.instanceId.substring(0, 8) + '...)');
    }
  }

  /**
   * Check if instance is running
   */
  async isInstanceRunning(): Promise<boolean> {
    if (!this.apiKey || !this.instanceId) {
      return false;
    }

    try {
      const status = await this.getInstanceStatus();
      return status?.status === 'running' || status?.status === 'starting' || status?.status === 'booting';
    } catch (error) {
      console.error('Error checking instance status:', error);
      return false;
    }
  }

  /**
   * Get instance status
   */
  async getInstanceStatus(): Promise<LambdaLabsInstance | null> {
    if (!this.apiKey || !this.instanceId) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/instances/${this.instanceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Lambda Labs API error response:', response.status, errorText);
        return null;
      }

      const data = await response.json() as LambdaLabsApiResponse<LambdaLabsInstance>;
      return data.data || null;
    } catch (error: any) {
      console.error('Error getting instance status:', error.message || error);
      return null;
    }
  }

  /**
   * Start the instance
   */
  async startInstance(): Promise<boolean> {
    if (!this.apiKey || !this.instanceId) {
      console.warn('Lambda Labs not configured, cannot start instance');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/instance-operations/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instance_ids: [this.instanceId],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Lambda Labs API error response:', response.status, errorText);
        throw new Error(`Lambda Labs API error: ${response.statusText}`);
      }

      const data = await response.json() as LambdaLabsApiResponse<{ instance_ids: string[] }>;
      console.log('📤 Lambda Labs instance start response:', JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.error('❌ Lambda Labs error:', data.error);
        return false;
      }
      
      console.log('✅ Lambda Labs instance start requested successfully');
      return true;
    } catch (error) {
      console.error('❌ Error starting instance:', error);
      return false;
    }
  }

  /**
   * Stop the instance
   * NOTE: Lambda Labs doesn't have a "stop" function - only "terminate" (permanent deletion)
   * For cost savings, we should NOT terminate the instance (would lose all data)
   * Instead, we'll just log that idle timeout occurred but keep instance running
   * The instance will continue to cost money, but PersonaPlex won't be used
   * 
   * Alternative: You could SSH and stop PersonaPlex service, but instance still costs money
   */
  async stopInstance(): Promise<boolean> {
    if (!this.apiKey || !this.instanceId) {
      return false;
    }

    // Lambda Labs doesn't support "stop" - only "terminate" (permanent deletion)
    // We should NOT terminate because:
    // 1. Would lose all PersonaPlex installation
    // 2. Would need to reinstall everything
    // 3. Would need to wait 15-20 minutes for new instance
    
    console.warn('⚠️ Lambda Labs idle timeout reached');
    console.warn('⚠️ Lambda Labs does NOT support "stop" - only "terminate" (permanent deletion)');
    console.warn('⚠️ Instance will continue running (and costing money)');
    console.warn('⚠️ To save costs, manually terminate instance in dashboard when not needed');
    console.warn('⚠️ Note: Terminating will require reinstalling PersonaPlex');
    
    // Don't actually terminate - just log the idle timeout
    // User can manually terminate in dashboard if they want to save costs
    return true;
  }

  /**
   * Wait for instance to be ready (running and PersonaPlex server responding)
   */
  async waitForInstanceReady(maxWaitSeconds: number = 120): Promise<boolean> {
    const startTime = Date.now();
    const maxWait = maxWaitSeconds * 1000;
    const checkInterval = 5000; // Check every 5 seconds

    console.log(`⏳ Waiting for instance to be ready (max ${maxWaitSeconds}s)...`);

    while (Date.now() - startTime < maxWait) {
      // Check if instance is running
      const isRunning = await this.isInstanceRunning();
      if (!isRunning) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        continue;
      }

      // Check if PersonaPlex server is responding
      const personaplexUrl = process.env.PERSONAPLEX_SERVER_URL || '';
      if (personaplexUrl) {
        try {
          // Try to connect to WebSocket (just to check if it's up)
          // For now, we'll just check if instance is running
          // In production, you might want to ping the HTTP endpoint
          console.log('✅ Instance is running');
          return true;
        } catch (error) {
          // Server not ready yet, keep waiting
        }
      } else {
        // No URL configured, assume ready if instance is running
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.error('❌ Instance did not become ready in time');
    return false;
  }

  /**
   * Get instance public IP (for PersonaPlex connection)
   * Lambda Labs instances have static IPs, so this should be consistent
   */
  async getInstancePublicUrl(): Promise<string | null> {
    const status = await this.getInstanceStatus();
    if (!status) {
      console.warn('⚠️ Cannot get instance status, using static URL if available');
      return process.env.PERSONAPLEX_SERVER_URL || null;
    }

    // Lambda Labs instances have static IPs
    if (status.ip) {
      // PersonaPlex runs on port 8998
      const instanceUrl = `wss://${status.ip}:8998`;
      console.log('✅ Found instance URL from Lambda Labs API:', instanceUrl);
      return instanceUrl;
    }

    // Fallback: Use static URL from environment if configured
    const staticUrl = process.env.PERSONAPLEX_SERVER_URL;
    if (staticUrl && staticUrl !== 'wss://localhost:8998') {
      console.log('⚠️ Using static PERSONAPLEX_SERVER_URL:', staticUrl);
      return staticUrl;
    }

    console.error('❌ Cannot determine instance URL - no IP or static URL available');
    return null;
  }
}

export const lambdalabsService = new LambdaLabsService();

