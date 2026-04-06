import type { TranslationKey } from '../en';
import { coreAr } from './core';
import { authAr } from './auth';
import { onboardingAr } from './onboarding';
import { tabsAr } from './tabs';
import { profileAr } from './profile';
import { settingsScreensAr } from './settingsScreens';
import { subscriptionAr } from './subscription';
import { feedAr } from './feed';
import { notificationsAr } from './notifications';
import { chatAr } from './chat';
import { createPostAr } from './createPost';

export const AR: Partial<Record<TranslationKey, string>> = {
  ...coreAr,
  ...authAr,
  ...onboardingAr,
  ...tabsAr,
  ...profileAr,
  ...settingsScreensAr,
  ...subscriptionAr,
  ...feedAr,
  ...notificationsAr,
  ...chatAr,
  ...createPostAr,
};
