import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { AuroraCore as SphereAuroraCore } from './AuroraCore.sphere';
import { AuroraCore as BlobsAuroraCore } from './AuroraCore.blobs';

interface AuroraCoreProps {
  state: 'idle' | 'listening' | 'speaking';
  audioLevel?: number;
  size?: number;
}

export const AuroraCore: React.FC<AuroraCoreProps> = (props) => {
  const { auroraStyle } = useSettingsStore();

  if (auroraStyle === 'blobs') {
    return <BlobsAuroraCore {...props} />;
  }

  // Default to sphere
  return <SphereAuroraCore {...props} />;
};
