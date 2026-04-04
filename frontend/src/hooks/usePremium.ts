import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AppState } from 'react-native';
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

  // Refresh entitlement when app returns to foreground to keep status in sync.
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshCustomerInfo();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, refreshCustomerInfo]);

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
  const { isPremium, isLoading, hasCheckedPremium, suppressSubscriptionRedirect } = usePremiumStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const requirePremium = (): boolean => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return false;
    }

    // Don't redirect while premium status is loading or hasn't been checked yet.
    // This prevents false redirects on cold start before RevenueCat responds.
    if (isLoading || !hasCheckedPremium) {
      return false;
    }

    if (isPremium) {
      return true;
    }

    if (suppressSubscriptionRedirect) {
      return false;
    }

    router.push('/subscription');
    return false;
  };

  return {
    isPremium,
    requirePremium,
  };
}
