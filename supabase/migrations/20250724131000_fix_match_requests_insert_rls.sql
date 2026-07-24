-- Fix match request insert 500: profiles <-> match_requests RLS recursion.
-- Insert WITH CHECK queried profiles; profiles_select_visible queried match_requests.

create or replace function private.is_discovery_ready_player(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.discovery_enabled = true
      and p.skill_level is not null
  );
$$;

create or replace function private.has_match_requests_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.match_requests mr
    where (
      mr.from_user_id = (select auth.uid()) and mr.to_user_id = target_user_id
    ) or (
      mr.to_user_id = (select auth.uid()) and mr.from_user_id = target_user_id
    )
  );
$$;

revoke all on function private.is_discovery_ready_player(uuid) from public;
revoke all on function private.has_match_requests_with(uuid) from public;
grant execute on function private.is_discovery_ready_player(uuid) to authenticated;
grant execute on function private.has_match_requests_with(uuid) to authenticated;

drop policy if exists "profiles_select_visible" on public.profiles;

create policy "profiles_select_visible"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or profile_visibility = 'public'
    or private.shares_group_with(id)
    or private.has_match_requests_with(id)
  );

drop policy if exists "match_requests_insert_sender" on public.match_requests;

create policy "match_requests_insert_sender"
  on public.match_requests for insert
  to authenticated
  with check (
    from_user_id = (select auth.uid())
    and to_user_id <> (select auth.uid())
    and status = 'pending'
    and private.is_discovery_ready_player(to_user_id)
    and private.is_discovery_ready_player((select auth.uid()))
  );
