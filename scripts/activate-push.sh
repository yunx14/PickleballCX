#!/usr/bin/env bash
set -euo pipefail

# Activates server-side push: sets NOTIFICATION_WEBHOOK_SECRET and wires DB triggers.
# Safe to re-run (generates a fresh secret each time).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SECRET="$(openssl rand -hex 32)"

echo "Setting NOTIFICATION_WEBHOOK_SECRET on Supabase..."
npx supabase secrets set "NOTIFICATION_WEBHOOK_SECRET=$SECRET"

echo "Updating private.notification_dispatch..."
npx supabase db query --linked --yes \
  "update private.notification_dispatch set webhook_secret = '$SECRET' where id = 1;"

echo "Verifying Edge Function..."
RESPONSE="$(curl -sS -X POST \
  "https://emdafxfzuutjrdusrvlg.supabase.co/functions/v1/dispatch-notification" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $SECRET" \
  -d '{"table":"events","type":"INSERT","record":{"id":"00000000-0000-0000-0000-000000000000","created_by":"00000000-0000-0000-0000-000000000000","starts_at":"2099-01-01T00:00:00.000Z"}}')"

echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"sent"'; then
  echo ""
  echo "Server push is active."
  echo ""
  echo "Next: register device tokens on a physical phone:"
  echo "  1. cd apps/mobile"
  echo "  2. npx eas-cli login"
  echo "  3. npx eas-cli init"
  echo "  4. Add EXPO_PUBLIC_EAS_PROJECT_ID to apps/mobile/.env (printed by eas init)"
  echo "  5. Build or run a dev client — Expo Go may not support push on SDK 57"
  echo "  6. Log in on the phone and allow notifications"
else
  echo "Edge Function verification failed." >&2
  exit 1
fi
