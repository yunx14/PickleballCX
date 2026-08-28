# Maps & Geocoding

Court addresses are geocoded on save. Session coordinates are copied from courts automatically.

## Google Cloud setup

Enable these APIs in [Google Cloud Console](https://console.cloud.google.com/):

| API | Used for |
|-----|----------|
| **Geocoding API** | Court address → lat/lng on save |
| **Maps Static API** | Web session card previews + court detail fallback |
| **Maps SDK for iOS** | Native `MapView` on iOS (EAS build) |
| **Maps SDK for Android** | Native `MapView` on Android (EAS build) |

Create API keys with restrictions:

| Key | Restrict to |
|-----|-------------|
| iOS native | iOS app bundle `com.pickleballcx.app` |
| Android native | Android package `com.pickleballcx.app` + SHA-1 from EAS |
| Web / client | HTTP referrers (`pickleballcx.vercel.app`, `localhost`) |

Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `apps/mobile/.env` (and Vercel for web). The same key can be used for geocoding and Static Maps; native SDK keys are injected at build time via `app.config.js`.

**Billing:** Google Maps Platform includes ~$200/month free credit. Restrict keys to stay within free tier for pilot traffic.

**Security:** Geocoding runs client-side (key is exposed, same as prior Mapbox setup). For production hardening, move geocoding to a Supabase Edge Function later.

## Geocoding

Requires `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`. Used when saving courts and profile city.

Implementation: [`lib/geocoding.ts`](../lib/geocoding.ts)

## Native maps (iOS / Android)

Interactive and list-card maps use `react-native-maps` with `PROVIDER_GOOGLE`.

**Expo Go does not support Google Maps reliably** — use an EAS development build:

```bash
cd apps/mobile
npx eas build --profile development --platform ios
```

Implementation: [`components/ui/CourtMapView.native.tsx`](../components/ui/CourtMapView.native.tsx)

## Web maps

Web uses Google Static Maps images (no `react-native-maps` on web export).

Implementation: [`components/ui/CourtMapView.web.tsx`](../components/ui/CourtMapView.web.tsx), [`lib/static-map.ts`](../lib/static-map.ts)

## Session card map previews

Session cards show a small map with a pin at the court location via `CourtMapPreview` → `CourtMapView`.

Implementation: [`components/ui/CourtMapPreview.tsx`](../components/ui/CourtMapPreview.tsx)

## Directions

Opening directions in Google Maps / Apple Maps uses [`lib/maps-links.ts`](../lib/maps-links.ts) (unchanged).

## Location-based discovery

The Home tab uses `expo-location` to read the device position and filter **public open sessions** by radius (25 / 50 / 100 mi). Your own sessions always appear.

Implementation:

- [`hooks/useUserLocation.ts`](../hooks/useUserLocation.ts)
- [`lib/event-filters.ts`](../lib/event-filters.ts)
- [`lib/geo.ts`](../lib/geo.ts)

## Re-geocode existing courts

Courts saved before geocoding may still have `lat/lng = 0`. Edit and re-save each court as an app admin to refresh coordinates.

## Deferred

- Map pin picker on court forms
- Server-side geocoding Edge Function (hide API key from client)
