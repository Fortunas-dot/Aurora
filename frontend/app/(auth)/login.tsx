import React from 'react';
import { useSettingsStore } from '../../src/store/settingsStore';
import { LoginExperience } from '../../src/components/auth/LoginExperience';

export default function LoginScreen() {
  const loginScreenVariant = useSettingsStore((s) => s.loginScreenVariant);

  return <LoginExperience variant={loginScreenVariant} />;
}
