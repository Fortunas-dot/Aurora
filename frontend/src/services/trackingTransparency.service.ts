import { Platform } from 'react-native';

// #region agent log
fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'trackingTransparency.service.ts:1',message:'Module file loaded',data:{platform:Platform.OS},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
// #endregion

/**
 * Service to handle App Tracking Transparency (ATT) on iOS
 * Required for iOS 14.5+ when using analytics/tracking services like PostHog
 */
class TrackingTransparencyService {
  private permissionStatus: 'not-determined' | 'restricted' | 'denied' | 'authorized' | null = null;
  private isModuleAvailable: boolean | null = null;
  private trackingModule: any = null;

  /**
   * Check if we're in a native iOS environment
   * Returns false for web, development, or non-iOS platforms
   */
  private isNativeIOS(): boolean {
    return Platform.OS === 'ios' && Platform.OS !== 'web';
  }

  /**
   * Safely load the tracking transparency module
   * This prevents errors in web/dev environments where the native module isn't available
   */
  private async loadModule(): Promise<any | null> {
    // Only try to load on native iOS
    if (!this.isNativeIOS()) {
      return null;
    }

    // Return cached module if already loaded
    if (this.trackingModule !== null) {
      return this.trackingModule;
    }

    // Return null if we already know it's not available
    if (this.isModuleAvailable === false) {
      return null;
    }

    try {
      // Use dynamic import with comprehensive error handling
      // Wrap in additional try-catch to handle module loading errors
      let module: any;
      try {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'trackingTransparency.service.ts:45',message:'Attempting dynamic import',data:{platform:Platform.OS},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        module = await import('expo-tracking-transparency');
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'trackingTransparency.service.ts:47',message:'Dynamic import succeeded',data:{hasModule:!!module},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } catch (importError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'trackingTransparency.service.ts:49',message:'Dynamic import failed',data:{error:importError?.message,code:importError?.code},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Handle import errors (module not available, native module missing, etc.)
        if (
          importError?.message?.includes('native module') ||
          importError?.message?.includes('Cannot find') ||
          importError?.message?.includes('ExpoTrackingTransparency') ||
          importError?.code === 'MODULE_NOT_FOUND'
        ) {
          // Expected in web/dev environments
          this.isModuleAvailable = false;
          return null;
        }
        // Re-throw unexpected errors
        throw importError;
      }
      
      // Check if the module has the required methods
      if (module && typeof module.requestTrackingPermissionsAsync === 'function') {
        this.trackingModule = module;
        this.isModuleAvailable = true;
        return module;
      }
      
      this.isModuleAvailable = false;
      return null;
    } catch (error: any) {
      // Catch any other errors during module initialization
      if (
        error?.message?.includes('native module') ||
        error?.message?.includes('Cannot find') ||
        error?.message?.includes('ExpoTrackingTransparency') ||
        error?.code === 'MODULE_NOT_FOUND'
      ) {
        // Expected in web/dev environments - silently handle
        this.isModuleAvailable = false;
        return null;
      }
      
      // Log unexpected errors but don't crash
      console.warn('⚠️ Unexpected error loading tracking transparency module:', error);
      this.isModuleAvailable = false;
      return null;
    }
  }

  /**
   * Check if the tracking transparency module is available
   * This is needed because the native module may not be available in web/dev environments
   */
  private async checkModuleAvailability(): Promise<boolean> {
    if (this.isModuleAvailable !== null) {
      return this.isModuleAvailable;
    }

    // Only check on native iOS
    if (!this.isNativeIOS()) {
      this.isModuleAvailable = false;
      return false;
    }

    // Try to load the module
    const module = await this.loadModule();
    return module !== null;
  }

  /**
   * Request tracking permission from user
   * Should be called before initializing analytics services
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  async requestPermission(): Promise<boolean> {
    // Only required on native iOS
    if (!this.isNativeIOS()) {
      return true; // Android/web doesn't require ATT
    }

    // Load the module safely
    const module = await this.loadModule();
    if (!module) {
      // Module not available (web/dev environment) - allow tracking
      return true;
    }

    try {
      // Request tracking permission
      const { status } = await module.requestTrackingPermissionsAsync();
      
      this.permissionStatus = status;
      
      if (status === 'granted') {
        console.log('✅ User granted tracking permission');
        return true;
      } else {
        console.log(`⚠️ User ${status} tracking permission`);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Error requesting tracking permission:', error);
      return true; // Allow tracking if there's an error
    }
  }

  /**
   * Get current tracking permission status
   * @returns Promise<string | null> - permission status or null if not determined
   */
  async getPermissionStatus(): Promise<string | null> {
    // Only required on native iOS
    if (!this.isNativeIOS()) {
      return 'granted'; // Android/web doesn't require ATT
    }

    // Load the module safely
    const module = await this.loadModule();
    if (!module) {
      // Module not available (web/dev environment) - default to granted
      return 'granted';
    }

    try {
      const { status } = await module.getTrackingPermissionsAsync();
      this.permissionStatus = status;
      return status;
    } catch (error) {
      console.warn('⚠️ Error getting tracking permission status:', error);
      return 'granted'; // Default to granted if there's an error
    }
  }

  /**
   * Check if tracking is allowed
   * @returns Promise<boolean> - true if tracking is allowed
   */
  async isTrackingAllowed(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status === 'granted';
  }

  /**
   * Get the current permission status (cached)
   * @returns string | null
   */
  getCachedStatus(): string | null {
    return this.permissionStatus;
  }
}

// Create a stub service that handles errors gracefully
// The actual service will be created lazily to avoid bundling issues
class StubTrackingTransparencyService {
  async requestPermission(): Promise<boolean> {
    // Return true to allow tracking in dev/web environments
    return true;
  }

  async getPermissionStatus(): Promise<string | null> {
    return 'granted';
  }

  async isTrackingAllowed(): Promise<boolean> {
    return true;
  }

  getCachedStatus(): string | null {
    return null;
  }
}

// Create service instance lazily
let serviceInstance: TrackingTransparencyService | StubTrackingTransparencyService | null = null;

/**
 * Get the tracking transparency service instance
 * This lazy initialization helps avoid module loading errors during bundling
 */
export const getTrackingTransparencyService = (): TrackingTransparencyService | StubTrackingTransparencyService => {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'trackingTransparency.service.ts:221',message:'getTrackingTransparencyService called',data:{hasInstance:!!serviceInstance,platform:Platform.OS},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!serviceInstance) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'trackingTransparency.service.ts:225',message:'Creating service instance',data:{platform:Platform.OS,isIOS:Platform.OS==='ios'},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Only create the real service if we're on iOS
      // This prevents the module from being loaded during bundling
      if (Platform.OS === 'ios') {
        serviceInstance = new TrackingTransparencyService();
      } else {
        serviceInstance = new StubTrackingTransparencyService();
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'trackingTransparency.service.ts:233',message:'Error creating service',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // If there's any error creating the service, use the stub
      console.warn('⚠️ Error creating tracking transparency service, using stub:', error);
      serviceInstance = new StubTrackingTransparencyService();
    }
  }
  return serviceInstance;
};

// Export a lazy getter instead of calling the function at module load time
// This prevents Metro from trying to bundle expo-tracking-transparency during module evaluation
// The service will only be created when it's actually accessed
export const trackingTransparencyService = new Proxy({} as TrackingTransparencyService | StubTrackingTransparencyService, {
  get(target, prop) {
    const service = getTrackingTransparencyService();
    const value = (service as any)[prop];
    // If it's a function, bind it to the service instance
    if (typeof value === 'function') {
      return value.bind(service);
    }
    return value;
  }
});
