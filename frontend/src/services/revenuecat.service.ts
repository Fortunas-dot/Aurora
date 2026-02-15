import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesError,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'appl_sWTFSjeziQTCKynmANwKPTmDOFp';

// Entitlement identifier
export const PREMIUM_ENTITLEMENT = 'Aurora Premium';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'com.aurora.app.monthly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

interface RevenueCatService {
  initialized: boolean;
  initialize: (userId?: string) => Promise<void>;
  getCustomerInfo: () => Promise<CustomerInfo | null>;
  getOfferings: () => Promise<PurchasesOffering | null>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  isPremiumActive: () => Promise<boolean>;
  checkPremiumStatus: () => Promise<boolean>;
  identifyUser: (userId: string) => Promise<void>;
  resetUser: () => Promise<void>;
  logLevel: LOG_LEVEL;
}

class RevenueCatServiceImpl implements RevenueCatService {
  public initialized = false;
  public logLevel: LOG_LEVEL = __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO;
  private isAvailable = false;

  /**
   * Public method to check if RevenueCat is available
   */
  public isAvailableCheck(): boolean {
    return this.isAvailable;
  }

  /**
   * Check if RevenueCat native module is available
   */
  private checkAvailability(): boolean {
    try {
      // Check if Purchases object exists and has required methods
      if (!Purchases) {
        return false;
      }
      
      // Try to access a method that requires native module
      // If native module isn't available, this will throw
      if (typeof Purchases.configure === 'function' && typeof Purchases.setLogLevel === 'function') {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize RevenueCat SDK
   * Should be called once when the app starts
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    // Skip initialization if not on iOS or Android
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.warn('RevenueCat is not supported on this platform');
      return;
    }

    try {
      // Try to configure SDK - this will throw if native module isn't available
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      
      // Set log level after successful configuration
      try {
        Purchases.setLogLevel(this.logLevel);
      } catch (logError) {
        // Log level setting might fail, but that's okay
        console.warn('Could not set RevenueCat log level:', logError);
      }

      // Set user ID if provided
      if (userId) {
        try {
          await Purchases.logIn(userId);
        } catch (loginError) {
          console.warn('Could not log in user to RevenueCat:', loginError);
        }
      }

      // Enable debug logs in development
      if (__DEV__) {
        try {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        } catch (logError) {
          // Ignore log level errors
        }
      }

      this.initialized = true;
      this.isAvailable = true;
      console.log('✅ RevenueCat initialized successfully');

      // Sync customer info on initialization (non-blocking)
      this.getCustomerInfo().catch(() => {
        // Ignore errors during initial customer info fetch
      });
    } catch (error: any) {
      // Check if error is about native module not being available
      const errorMessage = error?.message || '';
      if (
        errorMessage.includes('Native module') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('RNPurchases')
      ) {
        console.warn('⚠️ RevenueCat native module not available. This is expected in Expo Go. For full functionality, create a development build.');
        this.isAvailable = false;
        this.initialized = true; // Mark as initialized to prevent retry loops
        return;
      }
      console.warn('⚠️ RevenueCat initialization failed:', error?.message || error);
      // Mark as initialized to prevent retry loops, but mark as unavailable
      this.isAvailable = false;
      this.initialized = true;
    }
  }

  /**
   * Identify user with RevenueCat
   * Call this after user logs in
   */
  async identifyUser(userId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize(userId);
      return;
    }

    if (!this.isAvailable) {
      return;
    }

    try {
      await Purchases.logIn(userId);
      console.log('✅ RevenueCat user identified:', userId);

      // Sync customer info after identifying (non-blocking)
      this.getCustomerInfo().catch(() => {
        // Ignore errors
      });
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (
        errorMessage.includes('Native module') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('RNPurchases')
      ) {
        console.warn('⚠️ RevenueCat not available, skipping user identification');
        this.isAvailable = false;
        return;
      }
      console.warn('⚠️ RevenueCat identify user failed:', errorMessage);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Reset user (call on logout)
   */
  async resetUser(): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    try {
      await Purchases.logOut();
      console.log('✅ RevenueCat user reset');
    } catch (error: any) {
      if (error?.message?.includes('Native module') || error?.message?.includes('not found')) {
        console.warn('⚠️ RevenueCat not available, skipping user reset');
        return;
      }
      console.error('❌ RevenueCat reset user failed:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (
        errorMessage.includes('Native module') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('RNPurchases')
      ) {
        this.isAvailable = false;
        return null;
      }
      // Only log as warning, not error, to reduce console noise
      if (__DEV__) {
        console.warn('⚠️ Error getting customer info:', errorMessage);
      }
      return null;
    }
  }

  /**
   * Get available offerings (products/packages)
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null) {
        return offerings.current;
      }

      // If no current offering, return the first available
      if (offerings.all && Object.keys(offerings.all).length > 0) {
        return Object.values(offerings.all)[0];
      }

      return null;
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (
        errorMessage.includes('Native module') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('RNPurchases')
      ) {
        this.isAvailable = false;
        return null;
      }
      if (__DEV__) {
        console.warn('⚠️ Error getting offerings:', errorMessage);
      }
      return null;
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!this.isAvailable) {
      throw new Error('RevenueCat is not available. Please create a development build to use subscriptions.');
    }

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.isAvailable) {
        throw new Error('RevenueCat is not available. Please create a development build to use subscriptions.');
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('✅ Purchase successful');
      return customerInfo;
    } catch (error) {
      const purchasesError = error as PurchasesError;
      
      if (purchasesError.userCancelled) {
        console.log('Purchase cancelled by user');
        throw new Error('Purchase cancelled');
      } else if (purchasesError.code === PurchasesError.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        console.log('Payment pending');
        throw new Error('Payment is pending');
      } else {
        console.error('❌ Purchase error:', purchasesError.message);
        throw new Error(purchasesError.message || 'Purchase failed');
      }
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo | null> {
    if (!this.isAvailable && !this.checkAvailability()) {
      throw new Error('RevenueCat is not available. Please create a development build to use subscriptions.');
    }

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.isAvailable) {
        throw new Error('RevenueCat is not available. Please create a development build to use subscriptions.');
      }

      const customerInfo = await Purchases.restorePurchases();
      console.log('✅ Purchases restored');
      return customerInfo;
    } catch (error: any) {
      if (error?.message?.includes('Native module') || error?.message?.includes('not found')) {
        throw new Error('RevenueCat is not available. Please create a development build to use subscriptions.');
      }
      console.error('❌ Error restoring purchases:', error);
      throw error;
    }
  }

  /**
   * Check if user has active premium entitlement
   */
  async isPremiumActive(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      if (!customerInfo) {
        return false;
      }

      const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
      return entitlement !== undefined;
    } catch (error) {
      console.error('❌ Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Check premium status and return detailed info
   */
  async checkPremiumStatus(): Promise<boolean> {
    try {
      const isActive = await this.isPremiumActive();
      
      if (isActive) {
        const customerInfo = await this.getCustomerInfo();
        if (customerInfo) {
          const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
          if (entitlement) {
            console.log('✅ Premium active:', {
              productIdentifier: entitlement.productIdentifier,
              expirationDate: entitlement.expirationDate,
              willRenew: entitlement.willRenew,
            });
          }
        }
      }

      return isActive;
    } catch (error) {
      console.error('❌ Error checking premium status:', error);
      return false;
    }
  }
}

export const revenueCatService = new RevenueCatServiceImpl();
