# PickleballCX

Cross-platform pickleball coordination — web, iOS, and Android from a single Expo codebase, backed by Supabase.

**Live web:** https://pickleballcx.vercel.app

## What it is

**PickleballCX** replaces GroupMe chaos with structured profiles, searchable public sessions, and lightweight in-app coordination. Instead of RSVPs buried in scrollback and unknown skill levels at the court, players get organized sessions, visible skill bands, court details, and a way to find games near them.

**Stack:** Expo (React Native) + Supabase (Postgres, Auth, Realtime, push infrastructure).

## Core capabilities

### Account & profile

- Email signup/login with profile setup
- Display name and self-reported skill (beginner / intermediate / advanced)
- Profile editing: display name, skill, city, avatar
- City geocoding for distance (city only — no home address)
- Terms of Service and Privacy Policy

### Courts & venues

- Global court catalog (app-admin managed)
- Court details: address, map coordinates, indoor/outdoor, court count, notes
- **Get directions** from session/court screens

### Sessions & RSVPs

- Create public sessions at a court
- Session type: open play vs fixed group size
- Optional max players, skill min/max, description
- RSVP: going / maybe / not going / waitlist
- Attendee list with display names and skill levels
- Session comments (realtime)
- Edit/delete sessions (creator)
- Home feed with game search by city, distance, skill, and session type

### Communication & notifications

- Session comments
- Push notification infrastructure (comments, RSVPs, session updates and cancellations) — E2E push deferred until native device + dev accounts (see [`NOTES.md`](NOTES.md))

## App structure (main tabs)

| Tab | Purpose |
|-----|---------|
| **Home** | Find games near you, plus the sessions you host |
| **Map** | Browse courts and their upcoming sessions |
| **My Games** | Upcoming and past games you host or joined |
| **Profile** | Edit profile, sign out, legal links |

## Not in the app yet (planned / deferred)

- DUPR rating sync
- Recurring sessions, calendar sync
- Player-to-player messaging (session comments only)
- Shareable session links for inviting a specific person
- Court reservations / payments
- Player-added courts (admin-managed catalog today)

## Development

```bash
npm install
cp .env.example apps/mobile/.env   # fill in Supabase keys
npm run mobile                     # Expo dev server
npm run mobile:web                 # web only
npm run typecheck                  # all workspaces
```

Monorepo layout:

- `apps/mobile` — Expo app
- `packages/shared` — shared types, schemas, constants
- `supabase` — migrations and Edge Functions

## Documentation

- [`docs/APP_OVERVIEW.md`](docs/APP_OVERVIEW.md) — full product overview (same content as above)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system diagrams (Mermaid)
- [`DEPLOY.md`](DEPLOY.md) — Vercel, EAS, push notifications
- [`NOTES.md`](NOTES.md) — deferred work and blockers
- [`PLAN.md`](PLAN.md) — original MVP plan

## License

Private project.
