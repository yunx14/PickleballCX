# Maps & Geocoding (Deferred)

Phase 2 ships court CRUD with **address text only**. Coordinates are stored as `lat: 0, lng: 0` until map integration is added.

## When to implement

After obtaining a **Mapbox** or **Google Maps** API key (see [PLAN.md](../../PLAN.md)).

## Planned work

1. **Install map library** — `react-native-maps` with Mapbox or Google provider
2. **Geocoding on court create** — convert address → lat/lng on save (Mapbox Geocoding API or Google Geocoding)
3. **Map pin picker** — optional map on add/edit court form to refine location
4. **Courts map tab** — map view on [`app/groups/[id]/courts/index.tsx`](../app/groups/[id]/courts/index.tsx) showing group court pins
5. **Migration backfill** — optional script to geocode existing courts with `lat/lng = 0`

## Files to touch

- `apps/mobile/app/groups/[id]/courts/new.tsx` — geocode on submit
- `apps/mobile/app/groups/[id]/courts/[courtId].tsx` — show map on detail
- `apps/mobile/app/groups/[id]/courts/index.tsx` — list/map toggle
- `apps/mobile/lib/geocoding.ts` — new helper (keep API key server-side or use restricted client key)
- `apps/mobile/.env` — `EXPO_PUBLIC_MAPBOX_TOKEN` or similar

## Security note

Prefer geocoding via a Supabase Edge Function if using a secret API key, rather than embedding unrestricted keys in the mobile client.
