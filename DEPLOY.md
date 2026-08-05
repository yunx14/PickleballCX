# Deploying PickleballCX

Phase 5 covers web deploy, mobile builds (TestFlight / Play internal testing), and push notification setup.

## Prerequisites

- [Supabase](https://supabase.com) project (linked: `emdafxfzuutjrdusrvlg`)
- [Expo / EAS](https://expo.dev) account
- Apple Developer account ($99/yr) for iOS TestFlight
- Google Play Console ($25 one-time) for Android internal testing
- [Vercel](https://vercel.com) account (or Netlify) for web

## Environment variables

### Mobile app (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://emdafxfzuutjrdusrvlg.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
EXPO_PUBLIC_EAS_PROJECT_ID=your_eas_project_id   # required for push tokens on device
```

Google Maps (geocoding, static maps on web, native SDK on device builds):

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

See [`apps/mobile/docs/MAPS.md`](apps/mobile/docs/MAPS.md) for GCP API enablement and key restrictions.

### Vercel (web deploy)

Add the same `EXPO_PUBLIC_*` variables in the Vercel project settings (including `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` for map previews and geocoding on web).

### EAS secrets

Add `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` to EAS secrets so native builds embed the Google Maps SDK key:

```bash
cd apps/mobile
npx eas secret:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value your_key --scope project
```

Google Maps **requires a development or production EAS build** — it will not work in Expo Go.

---

## 1. Push notifications

The app registers device tokens in `push_tokens`. Sending is handled by the `dispatch-notification` Edge Function, triggered by database inserts.

### Deploy the Edge Function

Server-side push is activated via:

```bash
chmod +x scripts/activate-push.sh
./scripts/activate-push.sh
```

Or manually:

```bash
# Generate a random secret (save this value)
openssl rand -hex 32

# Set the secret on Supabase (use the value from above)
npx supabase secrets set NOTIFICATION_WEBHOOK_SECRET=your_secret_here

# Deploy the function
npx supabase functions deploy dispatch-notification
```

Then store the **same secret** in the database so triggers can authenticate:

```bash
npx supabase db query --linked --yes \
  "update private.notification_dispatch set webhook_secret = 'your_secret_here' where id = 1;"
```

### What triggers push?

| Event | Who gets notified |
|-------|-------------------|
| New **group** session | All group members except the creator |
| New **comment** on a session | Session creator + RSVPs (going/maybe), except comment author |
| New **group announcement** | All group members except the author |

Public/open sessions do not broadcast push in MVP (avoids spamming all users).

### Test on a physical device

1. Link an Expo project (required for push tokens):

   ```bash
   cd apps/mobile
   npx eas-cli login
   npx eas-cli init
   ```

   Add the printed project ID to `apps/mobile/.env` as `EXPO_PUBLIC_EAS_PROJECT_ID`.

2. Run a **development build** or production build (Expo Go often cannot register push on recent SDKs):

   ```bash
   npx eas-cli build --profile development --platform ios
   ```

3. Log in on a real phone (not simulator) and allow notification permission
4. Confirm a row appears in `push_tokens` (Supabase Table Editor)
5. Post a **group** session from another account in the same group
6. Check Edge Function logs in Supabase dashboard

---

## 2. Web deploy (Vercel)

```bash
# Local smoke test
npm run export:web --workspace=mobile
npx serve apps/mobile/dist
```

Deploy:

1. Connect the GitHub repo to Vercel
2. Root directory: repository root (uses `vercel.json`)
3. Add environment variables
4. Deploy

Update Supabase Auth redirect URLs to include your production web URL:

- Supabase Dashboard → Authentication → URL Configuration
- Add `https://your-domain.vercel.app/**` to redirect URLs

---

## 3. iOS (TestFlight)

```bash
cd apps/mobile
npx eas login
npx eas init          # links EAS project, sets EXPO_PUBLIC_EAS_PROJECT_ID
npx eas build --platform ios --profile preview
npx eas submit --platform ios --profile production
```

Requirements:

- Apple Developer account
- Fill in `eas.json` submit.production.ios fields (`APPLE_ID`, `ASC_APP_ID`, `APPLE_TEAM_ID`) or pass via EAS secrets
- Push notifications require a **development or production build** (not Expo Go)

---

## 4. Android (Play internal testing)

```bash
cd apps/mobile
npx eas build --platform android --profile preview
npx eas submit --platform android --profile production
```

Requirements:

- Google Play service account JSON (path in `eas.json`)
- Create an app in Play Console with package `com.pickleballcx.app`

---

## 5. App Store / Play metadata checklist

Before public launch:

- [ ] Privacy policy URL (in-app: Profile → Privacy Policy; host same content on web)
- [ ] App description and screenshots
- [ ] Support contact email
- [ ] Location usage justification (already in `app.json` for nearby sessions)
- [ ] Apple Sign-In if offering Google/social login (App Store requirement)

---

## 6. Dogfood with your pilot group

1. Create a group and share the invite code in your existing GroupMe
2. Add 2 courts your group actually plays at
3. Schedule a session and have players RSVP
4. Use session comments instead of GroupMe for game-day updates
5. Post a pinned group announcement for recurring schedule norms

Success criteria from the MVP plan:

- Admin creates group + 2 courts + session in under 3 minutes
- 10+ players RSVP with skill levels visible
- Comments replace GroupMe for coordination
- Push fires when a new group session is posted
- Works on phone and mobile browser
