/**
 * Stub module for expo-tracking-transparency
 * Used to prevent bundling errors in dev/web environments
 */
export const requestTrackingPermissionsAsync = async () => {
  return { status: 'granted' };
};

export const getTrackingPermissionsAsync = async () => {
  return { status: 'granted' };
};
