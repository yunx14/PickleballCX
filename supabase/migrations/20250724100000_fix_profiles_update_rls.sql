-- Fix infinite recursion: profiles_update_own WITH CHECK queried public.profiles,
-- which re-triggered profiles RLS. Use security definer helper instead.

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and is_app_admin = private.is_app_admin()
  );
