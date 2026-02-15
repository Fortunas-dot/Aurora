# RevenueCat Integration Guide

## Overview

RevenueCat SDK has been successfully integrated into the Aurora app. This guide explains how to use it and what needs to be configured.

## What's Been Implemented

### 1. RevenueCat Service (`src/services/revenuecat.service.ts`)
- SDK initialization
- Customer info retrieval
- Offerings and packages management
- Purchase handling
- Restore purchases
- Premium entitlement checking
- User identification and reset

### 2. Premium Store (`src/store/premiumStore.ts`)
- Zustand store for premium state management
- Premium status checking
- Offerings loading
- Purchase flow
- Restore purchases flow

### 3. Premium Hooks (`src/hooks/usePremium.ts`)
- `usePremium()` - Check premium status
- `useRequirePremium()` - Require premium access with automatic navigation

### 4. Subscription Page (`app/subscription.tsx`)
- Full subscription UI
- Package selection
- Purchase flow
- Restore purchases
- RevenueCat Paywall integration
- Customer Center support

## Configuration Required

### 1. RevenueCat Dashboard Setup

1. **Create Products in App Store Connect / Google Play Console**
   - Product ID: `monthly`
   - Type: Auto-Renewable Subscription (iOS) / Subscription (Android)
   - Price: €4.99/month
   - Free Trial: 7 days

2. **Configure RevenueCat Dashboard**
   - Go to https://app.revenuecat.com
   - Navigate to your project
   - Add the products:
     - Product ID: `monthly`
     - Store Product ID: Match your App Store/Play Store product ID
   
3. **Create Entitlement**
   - Name: `Aurora Premium`
   - Attach the `monthly` product to this entitlement

4. **Create Offering**
   - Create a default offering
   - Add the `monthly` package to the offering
   - Set it as the current offering

### 2. API Key

The API key is already configured in `src/services/revenuecat.service.ts`:
- Test API Key: `test_yYRUjzZYwhwcCQuMjtwlfAbTCMI`

**Important**: For production, you should:
1. Move the API key to environment variables
2. Use the production API key from RevenueCat dashboard

### 3. App Configuration

**Note**: RevenueCat doesn't require an Expo config plugin. The native modules will be automatically linked when you run `npx expo prebuild`.

To use RevenueCat, you need to rebuild your app with native code:

```bash
# For iOS
npx expo prebuild --clean
npx expo run:ios

# For Android
npx expo prebuild --clean
npx expo run:android
```

**Important**: RevenueCat requires native code, so it won't work in Expo Go. You must use a development build or production build.

## Usage Examples

### Check Premium Status

```tsx
import { usePremium } from '../hooks/usePremium';

function MyComponent() {
  const { isPremium, isLoading } = usePremium();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isPremium) {
    return <UpgradePrompt />;
  }

  return <PremiumFeature />;
}
```

### Require Premium Access

```tsx
import { useRequirePremium } from '../hooks/usePremium';

function MyComponent() {
  const { requirePremium } = useRequirePremium();

  const handlePremiumAction = () => {
    if (!requirePremium()) {
      // User will be redirected to subscription page
      return;
    }
    
    // Execute premium feature
    doPremiumThing();
  };

  return <Button onPress={handlePremiumAction} />;
}
```

### Direct Store Access

```tsx
import { usePremiumStore } from '../store/premiumStore';

function MyComponent() {
  const { isPremium, loadOfferings, purchasePackage, availablePackages } = usePremiumStore();

  useEffect(() => {
    loadOfferings();
  }, []);

  const handlePurchase = async () => {
    if (availablePackages.length > 0) {
      await purchasePackage(availablePackages[0]);
    }
  };

  return <Button onPress={handlePurchase} />;
}
```

## Testing

### Sandbox Testing (iOS)
1. Create a sandbox test account in App Store Connect
2. Sign out of your Apple ID on the device
3. When prompted during purchase, sign in with the sandbox account

### Test Account (Android)
1. Add test accounts in Google Play Console
2. Use those accounts to test purchases

### RevenueCat Test Mode
- The current API key is a test key
- All purchases will be in test mode until you switch to production

## Important Notes

1. **User Identification**: RevenueCat automatically identifies users when they log in (handled in `app/_layout.tsx`)

2. **Premium Status Sync**: Premium status is checked:
   - On app initialization
   - After user login
   - After purchase
   - After restore

3. **Customer Center**: Users can manage subscriptions via:
   - The "Manage Subscription" button on the subscription page
   - This opens the native subscription management UI

4. **Error Handling**: All RevenueCat operations include proper error handling:
   - Purchase cancellations are handled gracefully
   - Network errors are caught and displayed
   - Invalid states are handled

## Next Steps

1. **Configure Products**: Set up products in App Store Connect / Google Play Console
2. **Create Entitlement**: Create "Aurora Premium" entitlement in RevenueCat
3. **Create Offering**: Set up offering with monthly package
4. **Test Purchases**: Test the full purchase flow in sandbox/test mode
5. **Production**: Switch to production API key when ready

## Support

- RevenueCat Documentation: https://www.revenuecat.com/docs
- RevenueCat React Native SDK: https://www.revenuecat.com/docs/reactnative
- RevenueCat Dashboard: https://app.revenuecat.com
