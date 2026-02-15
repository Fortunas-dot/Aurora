import { create } from 'zustand';
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { revenueCatService, PREMIUM_ENTITLEMENT } from '../services/revenuecat.service';

interface PremiumState {
  // State
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering | null;
  availablePackages: PurchasesPackage[];
  error: string | null;

  // Actions
  checkPremiumStatus: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
  clearError: () => void;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  // Initial state
  isPremium: false,
  isLoading: false,
  customerInfo: null,
  offerings: null,
  availablePackages: [],
  error: null,

  // Check premium status
  checkPremiumStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const isPremium = await revenueCatService.checkPremiumStatus();
      const customerInfo = await revenueCatService.getCustomerInfo();
      
      set({
        isPremium,
        customerInfo,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Error checking premium status:', error);
      set({
        error: error.message || 'Failed to check premium status',
        isLoading: false,
      });
    }
  },

  // Load available offerings
  loadOfferings: async () => {
    set({ isLoading: true, error: null });
    try {
      const offerings = await revenueCatService.getOfferings();
      
      if (offerings) {
        const availablePackages = offerings.availablePackages || [];
        set({
          offerings,
          availablePackages,
          isLoading: false,
        });
      } else {
        set({
          error: 'No offerings available',
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Error loading offerings:', error);
      set({
        error: error.message || 'Failed to load offerings',
        isLoading: false,
      });
    }
  },

  // Purchase a package
  purchasePackage: async (packageToPurchase: PurchasesPackage) => {
    set({ isLoading: true, error: null });
    try {
      const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
        set({
          isPremium,
          customerInfo,
          isLoading: false,
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error: any) {
      console.error('Error purchasing package:', error);
      set({
        error: error.message || 'Purchase failed',
        isLoading: false,
      });
      return false;
    }
  },

  // Restore purchases
  restorePurchases: async () => {
    set({ isLoading: true, error: null });
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      
      if (customerInfo) {
        const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
        set({
          isPremium,
          customerInfo,
          isLoading: false,
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error: any) {
      console.error('Error restoring purchases:', error);
      set({
        error: error.message || 'Failed to restore purchases',
        isLoading: false,
      });
      return false;
    }
  },

  // Refresh customer info
  refreshCustomerInfo: async () => {
    try {
      const customerInfo = await revenueCatService.getCustomerInfo();
      if (customerInfo) {
        const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
        set({
          isPremium,
          customerInfo,
        });
      }
    } catch (error: any) {
      console.error('Error refreshing customer info:', error);
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
