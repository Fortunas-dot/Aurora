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
  const { isPremium, isLoading, suppressSubscriptionRedirect } = usePremiumStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const requirePremium = (): boolean => {
    // Keep auth behavior consistent for gated actions triggered from deep links/notifications.
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return false;
    }

    // Avoid false redirects while premium status is still being fetched.
    if (isLoading) {
      return false;
    }

    // If user is premium, always allow.
    if (isPremium) {
      return true;
    }

    // Avoid redirect during flows where we intentionally refresh entitlement first
    // (e.g. notification taps). The caller will navigate once the refresh completes.
    if (suppressSubscriptionRedirect) {
      return false;
    }

    // Non-premium users are always redirected to subscription for gated features.
    router.push('/subscription');
    return false;
  };

  return {
    isPremium,
    requirePremium,
  };
}
