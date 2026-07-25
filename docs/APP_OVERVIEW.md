# PickleballCX — App Overview

## What it is

**PickleballCX** is a cross-platform app (web, iOS, Android) for organizing pickleball outside of GroupMe chaos. It replaces scrollback RSVPs and buried court details with structured profiles, sessions, groups, and lightweight in-app coordination.

**Stack:** Expo (React Native) + Supabase (Postgres, Auth, Realtime, push infrastructure).

**Live web:** https://pickleballcx.vercel.app

---

## Core capabilities

### Account & profile

- Email signup/login with profile setup
- Display name and self-reported skill (beginner / intermediate / advanced)
- Profile editing: city, play format, ranked preference
- **Find players** opt-in (default on), **Available now** badge
- City geocoding for distance (city only — no home address)
- Terms of Service and Privacy Policy

### Groups

- Create private groups with invite codes
- Join by invite code
- Member list with skill levels
- Group announcements (pinned supported in schema)
- Group-scoped session lists

### Courts & venues

- Global court catalog (app-admin managed)
- Court details: address, map coordinates, indoor/outdoor, court count, notes
- **Get directions** from session/court screens

### Sessions & RSVPs

- Create sessions at a court (public or group-only)
- Session type: open play vs fixed group
- Optional max players, skill min/max, description
- RSVP: going / maybe / not going / waitlist
- Attendee list with display names and skill levels
- Session comments (realtime)
- Edit/delete sessions (creator)
- Home feed and Sessions tab with location-based discovery for public sessions

### Communication & notifications

- Session comments
- Group announcements
- Push notification infrastructure (new sessions, comments, announcements, match requests, messages, session invites) — E2E push deferred until native device + dev accounts (see [`NOTES.md`](../NOTES.md))

### Find players (player discovery)

- **Players tab:** browse nearby discoverable players
- Search by name/city; filters for skill, format, distance (25/50/100 mi)
- Match fit % from skill, format, and distance
- **Match requests:** send, accept/decline, cancel; one pending request per pair
- **1:1 messaging** after connect (realtime chat)
- **Session invites** to connected players; invitee can accept and auto-RSVP

---

## App structure (main tabs)

| Tab | Purpose |
|-----|---------|
| **Home** | Upcoming sessions overview |
| **Sessions** | Browse/create sessions, filters, public discovery |
| **Players** | Find players, match requests, messaging, invites |
| **Groups** | Your groups, create/join |
| **Profile** | Edit profile and discovery settings |

---

## Not in the app yet (planned / deferred)

- DUPR rating sync (column exists; matching uses skill bands)
- Public session marketplace at full scale (partial public sessions exist)
- Recurring sessions, calendar sync
- Full group chat (only comments, announcements, and 1:1 player messages)
- Court reservations / payments
- Block/report for messaging (called out for wider launch)

---

## Related docs

- [`DEPLOY.md`](../DEPLOY.md) — web deploy, EAS builds, push setup
- [`NOTES.md`](../NOTES.md) — deferred work and blockers
- [`PLAN.md`](../PLAN.md) — original MVP plan
