import Constants from 'expo-constants';

function getBackendUrl(): string {
  // Try process.env first (works in web/dev builds)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.length > 0) return envUrl;

  // Fallback to expo constants
  const extra = Constants.expoConfig?.extra;
  if (extra?.backendUrl) return extra.backendUrl;

  // Final fallback - hardcoded for production
  return 'https://clawnorder.onrender.com';
}

export const BACKEND_URL = getBackendUrl();
