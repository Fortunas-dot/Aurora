import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../store/premiumStore';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to check premium status and provide premium-related utilities
 * 
 * @example
 * ```tsx
 * const { isPremium, isLoading, checkPremium } = usePremium();
 * 
 * if (!isPremium) {
 *   return <UpgradePrompt />;
 * }
 * ```
 */
export function usePremium() {
  const { isPremium, isLoading, checkPremiumStatus, refreshCustomerInfo } = usePremiumStore();
  const { isAuthenticated } = useAuthStore();

  // Refresh premium status when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkPremiumStatus();
    }
  }, [isAuthenticated, checkPremiumStatus]);

  return {
    isPremium,
    isLoading,
    checkPremium: checkPremiumStatus,
    refreshPremium: refreshCustomerInfo,
  };
}

/**
 * Hook to require premium access - shows upgrade prompt if not premium
 * 
 * @example
 * ```tsx
 * const { requirePremium } = useRequirePremium();
 * 
 * const handlePremiumFeature = () => {
 *   if (!requirePremium()) return;
 *   // Premium feature code
 * };
 * ```
 */
export function useRequirePremium() {
  const { isPremium } = usePremiumStore();
  const router = useRouter();

  const requirePremium = (): boolean => {
    if (!isPremium) {
      // Navigate to subscription page
      router.push('/subscription');
      return false;
    }
    return true;
  };

  return {
    isPremium,
    requirePremium,
  };
}
