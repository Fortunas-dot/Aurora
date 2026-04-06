import type { TranslationKey } from '../en';
import { coreEs } from './core';
import { authEs } from './auth';
import { onboardingEs } from './onboarding';
import { tabsEs } from './tabs';
import { profileEs } from './profile';
import { settingsScreensEs } from './settingsScreens';
import { subscriptionEs } from './subscription';
import { feedEs } from './feed';
import { notificationsEs } from './notifications';
import { chatEs } from './chat';
import { createPostEs } from './createPost';

export const ES: Partial<Record<TranslationKey, string>> = {
  ...coreEs,
  ...authEs,
  ...onboardingEs,
  ...tabsEs,
  ...profileEs,
  ...settingsScreensEs,
  ...subscriptionEs,
  ...feedEs,
  ...notificationsEs,
  ...chatEs,
  ...createPostEs,
};
