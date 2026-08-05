/**
 * Google Maps / Geocoding API key for client-side requests (web + geocoding).
 * Native MapView keys are injected at build time via app.config.js.
 *
 * GCP setup: enable Geocoding API, Maps Static API, Maps SDK for iOS/Android.
 * Restrict this key to HTTP referrers (web) or use separate keys per platform.
 */
export function getGoogleMapsApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || null;
}
