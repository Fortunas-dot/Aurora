import type { TranslationKey } from '../en';
import { coreJa } from './core';
import { authJa } from './auth';
import { onboardingJa } from './onboarding';
import { tabsJa } from './tabs';
import { profileJa } from './profile';
import { settingsScreensJa } from './settingsScreens';
import { subscriptionJa } from './subscription';
import { feedJa } from './feed';
import { notificationsJa } from './notifications';
import { chatJa } from './chat';
import { createPostJa } from './createPost';

export const JA: Partial<Record<TranslationKey, string>> = {
  ...coreJa,
  ...authJa,
  ...onboardingJa,
  ...tabsJa,
  ...profileJa,
  ...settingsScreensJa,
  ...subscriptionJa,
  ...feedJa,
  ...notificationsJa,
  ...chatJa,
  ...createPostJa,
};
