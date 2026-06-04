import type { useRouter } from 'expo-router';
import type { TranslationKey } from '../../../locales/translate';

export type LoginShellRouter = ReturnType<typeof useRouter>;

export type LoginShellRenderProps = {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  displayError: string;
  authSubmitting: boolean;
  onSubmit: () => void;
  t: (key: TranslationKey) => string;
  router: LoginShellRouter;
};
