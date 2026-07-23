# Maps & Geocoding

Court addresses are geocoded on save. Session coordinates are copied from courts automatically.

## Geocoding

- **Mapbox** (recommended): set `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` in `apps/mobile/.env`
- **Fallback**: OpenStreetMap Nominatim (no key required; fine for dev/low volume)

Implementation: [`lib/geocoding.ts`](../lib/geocoding.ts)

## Location-based discovery

The Sessions tab uses `expo-location` to read the device position and filter **public open sessions** by radius (25 / 50 / 100 mi). Group sessions and your own sessions always appear.

Implementation:

- [`hooks/useUserLocation.ts`](../hooks/useUserLocation.ts)
- [`lib/event-filters.ts`](../lib/event-filters.ts)
- [`lib/geo.ts`](../lib/geo.ts)

## Re-geocode existing courts

Courts saved before geocoding may still have `lat/lng = 0`. Edit and re-save each court as an app admin to refresh coordinates.

## Deferred

- Map pin picker on court forms
- Map view of courts
- Server-side geocoding Edge Function (if hiding Mapbox secret)
