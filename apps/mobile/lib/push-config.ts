import Constants from 'expo-constants';

export function getExpoProjectId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const fromExtra = extra?.eas?.projectId?.trim();
  if (fromExtra) return fromExtra;

  const fromEasConfig = Constants.easConfig?.projectId?.trim();
  if (fromEasConfig) return fromEasConfig;

  return undefined;
}

export function getPushSetupHint(): string {
  return 'Run `cd apps/mobile && npx eas-cli login && npx eas-cli init` to link an Expo project, then set EXPO_PUBLIC_EAS_PROJECT_ID in apps/mobile/.env.';
}
