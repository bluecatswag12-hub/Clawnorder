import Constants from 'expo-constants';

function getBackendUrl(): string {
  // Try process.env first (works in web/dev builds and EAS-injected env)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.length > 0) return envUrl;

  // Fallback to expo constants (populated from app.json extra or EAS build env)
  const extra = Constants.expoConfig?.extra;
  if (extra?.backendUrl) return extra.backendUrl;

  // No URL configured — warn loudly but don't throw (throwing at module-load crashes the app pre-React).
  // Requests will simply fail until env is configured, which surfaces a visible error in UI.
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[api] EXPO_PUBLIC_BACKEND_URL is not configured. Backend calls will fail. Set it in frontend/.env or app.json extra.backendUrl.');
  }
  return '';
}

export const BACKEND_URL = getBackendUrl();
