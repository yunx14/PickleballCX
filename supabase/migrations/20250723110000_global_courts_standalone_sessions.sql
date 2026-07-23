-- Global courts catalog + standalone public sessions
-- Courts decouple from groups; app admins manage courts.
-- Events: group_id set => group_private (members only); no group => public (discoverable).

-- ---------------------------------------------------------------------------
-- profiles: app admin flag
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column is_app_admin boolean not null default false;

comment on column public.profiles.is_app_admin is
  'Platform admin — can manage global court catalog. Set manually via SQL/dashboard.';

-- Prevent users from granting themselves app admin via profile update.
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and is_app_admin = (
      select p.is_app_admin
      from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- courts: remove group ownership (global catalog)
-- ---------------------------------------------------------------------------
drop policy if exists "courts_select_member_or_global" on public.courts;
drop policy if exists "courts_insert_member" on public.courts;
drop policy if exists "courts_update_creator_or_admin" on public.courts;
drop policy if exists "courts_delete_creator_or_admin" on public.courts;

drop index if exists public.courts_group_id_idx;

alter table public.courts
  drop column if exists group_id;

-- ---------------------------------------------------------------------------
-- events: normalize existing rows, then enforce group/visibility rules
-- ---------------------------------------------------------------------------
update public.events
set visibility = 'public'
where group_id is null
  and visibility <> 'public'::public.event_visibility;

update public.events
set visibility = 'group_private'
where group_id is not null
  and visibility <> 'group_private'::public.event_visibility;

update public.events e
set
  lat = c.lat,
  lng = c.lng
from public.courts c
where e.court_id = c.id
  and (e.lat is null or e.lng is null);

alter table public.events
  add constraint events_group_visibility_check
  check (
    (group_id is not null and visibility = 'group_private')
    or (group_id is null and visibility = 'public')
  );

create index if not exists events_public_upcoming_idx
  on public.events (starts_at)
  where group_id is null and visibility = 'public';

-- Copy court coordinates onto events whenever court_id changes.
create or replace function public.sync_event_location_from_court()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lat double precision;
  v_lng double precision;
begin
  select c.lat, c.lng
  into v_lat, v_lng
  from public.courts c
  where c.id = new.court_id;

  new.lat := v_lat;
  new.lng := v_lng;
  return new;
end;
$$;

drop trigger if exists events_sync_location_from_court on public.events;

create trigger events_sync_location_from_court
  before insert or update of court_id
  on public.events
  for each row
  execute function public.sync_event_location_from_court();

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------
create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.is_app_admin
      from public.profiles p
      where p.id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function private.is_app_admin() from public;
grant execute on function private.is_app_admin() to authenticated;

-- courts RLS no longer references group_id; can_access_event unchanged for MVP public feed.
create or replace function private.can_access_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = target_event_id
      and (
        e.created_by = (select auth.uid())
        or (e.group_id is not null and private.is_group_member(e.group_id))
        or (e.group_id is null and e.visibility = 'public' and e.starts_at > now())
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- courts RLS: global read, app-admin write
-- ---------------------------------------------------------------------------
create policy "courts_select_authenticated"
  on public.courts for select
  to authenticated
  using (true);

create policy "courts_insert_app_admin"
  on public.courts for insert
  to authenticated
  with check (
    private.is_app_admin()
    and created_by = (select auth.uid())
  );

create policy "courts_update_app_admin"
  on public.courts for update
  to authenticated
  using (private.is_app_admin())
  with check (private.is_app_admin());

create policy "courts_delete_app_admin"
  on public.courts for delete
  to authenticated
  using (private.is_app_admin());

-- ---------------------------------------------------------------------------
-- events RLS: enforce group vs standalone visibility on write
-- ---------------------------------------------------------------------------
drop policy if exists "events_select_accessible" on public.events;
drop policy if exists "events_insert_member" on public.events;
drop policy if exists "events_update_creator" on public.events;

create policy "events_select_accessible"
  on public.events for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or (group_id is not null and private.is_group_member(group_id))
    or (group_id is null and visibility = 'public' and starts_at > now())
  );

create policy "events_insert_authenticated"
  on public.events for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (
        group_id is not null
        and private.is_group_member(group_id)
        and visibility = 'group_private'
      )
      or (
        group_id is null
        and visibility = 'public'
      )
    )
  );

create policy "events_update_creator"
  on public.events for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (
    created_by = (select auth.uid())
    and (
      (
        group_id is not null
        and private.is_group_member(group_id)
        and visibility = 'group_private'
      )
      or (
        group_id is null
        and visibility = 'public'
      )
    )
  );
