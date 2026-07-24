# PickleballCX — Notes

## Deferred

### Push notifications (2026-07-23)

- Server-side push is configured (Edge Function, DB triggers, `scripts/activate-push.sh`).
- Client token registration requires a **native build** on a physical device.
- **Blocked on:** no paid Apple Developer account (iOS) and no Android device yet.
- **Revisit when:** Android device available → `eas build --profile preview --platform android`, install APK, allow notifications, confirm row in `push_tokens`, then post a group session from another account.
- See [`DEPLOY.md`](./DEPLOY.md) for full setup steps.
