# PickleballCX — App Overview

## What it is

**PickleballCX** is a cross-platform app (web, iOS, Android) for organizing pickleball outside of GroupMe chaos. It replaces scrollback RSVPs and buried court details with structured profiles, public sessions you can search for, and lightweight in-app coordination.

**Stack:** Expo (React Native) + Supabase (Postgres, Auth, Realtime, push infrastructure).

**Live web:** https://pickleballcx.vercel.app

---

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
- Push notification infrastructure (comments, RSVPs, session updates and cancellations) — E2E push deferred until native device + dev accounts (see [`NOTES.md`](../NOTES.md))

---

## App structure (main tabs)

| Tab | Purpose |
|-----|---------|
| **Home** | Find games near you, plus the sessions you host |
| **Map** | Browse courts and their upcoming sessions |
| **My Games** | Upcoming and past games you host or joined |
| **Profile** | Edit profile, sign out, legal links |

---

## Not in the app yet (planned / deferred)

- DUPR rating sync
- Recurring sessions, calendar sync
- Player-to-player messaging (session comments only)
- Shareable session links for inviting a specific person
- Court reservations / payments
- Player-added courts (admin-managed catalog today)

---

## Related docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system diagrams and data flows
- [`DEPLOY.md`](../DEPLOY.md) — web deploy, EAS builds, push setup
- [`NOTES.md`](../NOTES.md) — deferred work and blockers
- [`PLAN.md`](../PLAN.md) — original MVP plan
