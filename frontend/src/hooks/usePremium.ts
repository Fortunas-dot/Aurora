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
  const { isPremium, isPaywallEnforced } = usePremiumStore();
  const router = useRouter();

  const requirePremium = (): boolean => {
    // If user is premium, always allow
    if (isPremium) {
      return true;
    }

    // Before the paywall is enforced (e.g. before user has seen/dismissed it),
    // allow access so they can experience the app.
    if (!isPaywallEnforced) {
      return true;
    }

    // Once the paywall is enforced and user is not premium, redirect to subscription
    router.push('/subscription');
    return false;
  };

  return {
    isPremium,
    requirePremium,
  };
}
