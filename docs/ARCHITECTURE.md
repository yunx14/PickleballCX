# PickleballCX — Architecture

Visual overview of how the app’s systems fit together. Diagrams use [Mermaid](https://mermaid.js.org/) — they render on GitHub and in many Markdown viewers. To export PNGs for slides or group chat, paste a diagram into [mermaid.live](https://mermaid.live).

For feature capabilities, see [`APP_OVERVIEW.md`](APP_OVERVIEW.md). For deploy and ops, see [`DEPLOY.md`](../DEPLOY.md).

---

## System overview

One **Expo** codebase ships to web (Vercel), iOS, and Android. All clients talk to **Supabase** for auth, data, realtime updates, and server-side push dispatch.

```mermaid
flowchart TB
  subgraph clients [Clients — one Expo app]
    Web[Web app<br/>Vercel]
    iOS[iOS app<br/>EAS build]
    Android[Android app<br/>EAS build]
  end

  subgraph supabase [Supabase project]
    Auth[Auth<br/>email signup / login]
    DB[(PostgreSQL + RLS)]
    Realtime[Realtime<br/>session comments]
    EdgeFn[dispatch-notification<br/>Edge Function]
  end

  subgraph external [External services]
    Vercel[Vercel hosting<br/>pickleballcx.vercel.app]
    ExpoPush[Expo Push API]
    GoogleMaps[Google Maps<br/>geocoding + map tiles]
    Email[Auth emails<br/>Supabase SMTP]
  end

  Web --> Vercel
  Web --> Auth
  iOS --> Auth
  Android --> Auth

  clients --> DB
  clients --> Realtime
  clients --> GoogleMaps

  Auth --> Email
  DB -->|pg_net triggers on insert| EdgeFn
  EdgeFn --> ExpoPush
  ExpoPush --> iOS
  ExpoPush --> Android
```

| Component | Role |
|-----------|------|
| **Expo app** | UI, navigation, forms; uses `@supabase/supabase-js` and TanStack Query |
| **Supabase Auth** | Email/password signup, sessions (JWT) |
| **PostgreSQL + RLS** | All app data; row-level security enforces who can read/write |
| **Realtime** | Live updates for session comments |
| **Edge Function** | Builds and sends push payloads via Expo when DB triggers fire |
| **Vercel** | Hosts static web export only (not the backend) |
| **Google Maps** | Geocode addresses, session card maps (`react-native-maps` native / Static Maps web) |

---

## User journey (how players use the app)

Maps to the main tabs: **Home**, **Map**, **My Games**, **Profile**.

```mermaid
flowchart LR
  subgraph auth [Get started]
    SignUp[Sign up]
    Profile[Set profile + city]
  end

  subgraph find [Find a game]
    Search[Search by city, distance,<br/>skill, session type]
    Map[Browse courts on the map]
  end

  subgraph play [Play]
    Session[Open a session]
    RSVP[RSVP with skill visible]
    Comments[Session comments]
    Host[Create your own session]
  end

  SignUp --> Profile
  Profile --> Search
  Profile --> Map
  Search --> Session
  Map --> Session
  Session --> RSVP
  Session --> Comments
  Profile --> Host --> Session
```

---

## Auth and data flow

Typical request path: app authenticates with Supabase, then reads/writes Postgres through the Data API. RLS policies run on every query.

```mermaid
sequenceDiagram
  participant User
  participant App as Expo app
  participant Auth as Supabase Auth
  participant DB as Postgres + RLS
  participant Push as Edge Function + Expo

  User->>App: Sign up / log in
  App->>Auth: signUp / signIn
  Auth-->>App: session JWT
  App->>DB: read / write via supabase-js
  Note over DB: RLS enforces who sees what

  User->>App: Post comment / RSVP
  App->>DB: insert row
  DB-->>App: Realtime update to other clients
  DB->>Push: trigger (optional)
  Push-->>User: push notification on device
```

---

## Push notification path

Database triggers call `private.dispatch_notification`, which POSTs to the Edge Function via **pg_net**. The function loads push tokens and sends through **Expo Push**.

```mermaid
flowchart LR
  Insert[Insert or update row<br/>event, comment, RSVP]
  Trigger[Postgres trigger]
  PgNet[pg_net HTTP POST]
  EdgeFn[dispatch-notification]
  Tokens[(push_tokens)]
  Expo[Expo Push API]
  Device[User device]

  Insert --> Trigger --> PgNet --> EdgeFn
  EdgeFn --> Tokens
  EdgeFn --> Expo --> Device
```

| Event | Who gets notified |
|-------|-------------------|
| Session comment | Host + RSVPs (except author) |
| New RSVP | Host |
| Session updated | Attendees |
| Session cancelled | Attendees |
| Starting soon (75–90 min out) | Going + maybe |
| Host message | Everyone on the roster |

New sessions do not broadcast push to all users (MVP anti-spam). See [`DEPLOY.md`](../DEPLOY.md) for setup.

### Scheduled jobs

`pg_cron` runs `send-session-reminders` every 15 minutes, which calls `private.send_session_reminders()`. That function reminds each session starting within 90 minutes exactly once, stamping `events.reminder_sent_at` so a later run skips it. Moving a session's start time clears the stamp so the reminder fires again for the new time. Inspect runs with:

```sql
select * from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'send-session-reminders')
order by start_time desc limit 10;
```

Hosts reach their roster through `public.broadcast_to_attendees(event_id, message)`, which is host-only, limited to 500 characters, throttled to one message per minute per session, and closed once the session is cancelled or over.

---

## Monorepo layout

```mermaid
flowchart TB
  subgraph repo [pickleballcx monorepo]
    Mobile[apps/mobile<br/>Expo Router UI]
    Shared[packages/shared<br/>types, Zod schemas, constants]
    Supa[supabase/<br/>migrations, Edge Functions]
  end

  Mobile --> Shared
  Mobile --> Supa
```

---

## Security model (high level)

- **Auth:** Supabase JWT; app sends token on every API call.
- **RLS:** Postgres policies on all public tables; users only see rows they’re allowed to access.
- **Private schema:** Helper functions (`private.can_access_event`, etc.) are not exposed via the Data API.
- **Search:** `search_events()` RPC is security definer, revoked from `anon`, and returns only public upcoming sessions.

---

## Related docs

- [`APP_OVERVIEW.md`](APP_OVERVIEW.md) — product capabilities
- [`DEPLOY.md`](../DEPLOY.md) — Vercel, EAS, push activation
- [`NOTES.md`](../NOTES.md) — deferred work
- [`PLAN.md`](../PLAN.md) — original MVP plan
