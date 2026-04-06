import { coreEn } from './core';
import { authEn } from './auth';
import { onboardingEn } from './onboarding';
import { tabsEn } from './tabs';
import { profileEn } from './profile';
import { settingsScreensEn } from './settingsScreens';
import { subscriptionEn } from './subscription';
import { feedEn } from './feed';
import { notificationsEn } from './notifications';
import { chatEn } from './chat';
import { createPostEn } from './createPost';

export const EN = {
  ...coreEn,
  ...authEn,
  ...onboardingEn,
  ...tabsEn,
  ...profileEn,
  ...settingsScreensEn,
  ...subscriptionEn,
  ...feedEn,
  ...notificationsEn,
  ...chatEn,
  ...createPostEn,
} as const;

export type TranslationKey = keyof typeof EN;
