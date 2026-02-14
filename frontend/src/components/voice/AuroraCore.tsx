import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { AuroraCore as ClassicAuroraCore } from './AuroraCore.sphere.classic';
import { AuroraCore as OrganicAuroraCore } from './AuroraCore.sphere.organic';
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

  if (auroraStyle === 'classic') {
    return <ClassicAuroraCore {...props} />;
  }

  // Default to organic (new, more alive version)
  return <OrganicAuroraCore {...props} />;
};
