import Constants from 'expo-constants';

function getBackendUrl(): string {
  // Try process.env first (works in web/dev builds)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.length > 0) return envUrl;

  // Fallback to expo constants (populated from app.json extra or EAS build env)
  const extra = Constants.expoConfig?.extra;
  if (extra?.backendUrl) return extra.backendUrl;

  // No URL configured — fail loudly so misconfiguration is caught at startup
  throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured. Set it in frontend/.env or app.json extra.backendUrl before building.');
}

export const BACKEND_URL = getBackendUrl();
