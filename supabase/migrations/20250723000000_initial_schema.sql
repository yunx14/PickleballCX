-- PickleballCX initial schema (skills-compliant rewrite)
-- Private helpers live in non-exposed `private` schema; RPCs revoke PUBLIC execute.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Private schema (not exposed via Data API — see config.toml [api].schemas)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.skill_level as enum ('beginner', 'intermediate', 'advanced');
create type public.profile_visibility as enum ('group_only', 'public');
create type public.court_type as enum ('indoor', 'outdoor', 'both');
create type public.session_type as enum ('open_play', 'fixed_group');
create type public.event_visibility as enum ('group_private', 'public');
create type public.rsvp_status as enum ('going', 'maybe', 'not_going', 'waitlist');
create type public.group_member_role as enum ('admin', 'member');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  skill_level public.skill_level,
  profile_visibility public.profile_visibility not null default 'group_only',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  court_type public.court_type not null default 'outdoor',
  num_courts integer not null default 1 check (num_courts > 0),
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  court_id uuid not null references public.courts (id) on delete restrict,
  visibility public.event_visibility not null default 'group_private',
  starts_at timestamptz not null,
  max_players integer check (max_players is null or max_players > 0),
  session_type public.session_type not null default 'open_play',
  skill_min public.skill_level,
  skill_max public.skill_level,
  description text,
  lat double precision,
  lng double precision,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (query paths + foreign keys for RLS/JOIN performance)
-- ---------------------------------------------------------------------------
create index group_members_user_id_idx on public.group_members (user_id);
create index groups_created_by_idx on public.groups (created_by);
create index courts_group_id_idx on public.courts (group_id);
create index courts_created_by_idx on public.courts (created_by);
create index courts_lat_lng_idx on public.courts (lat, lng);
create index events_group_id_starts_at_idx on public.events (group_id, starts_at);
create index events_court_id_idx on public.events (court_id);
create index events_created_by_idx on public.events (created_by);
create index events_starts_at_idx on public.events (starts_at);
create index events_visibility_starts_at_idx on public.events (visibility, starts_at);
create index event_rsvps_user_id_idx on public.event_rsvps (user_id);
create index event_comments_event_id_created_at_idx on public.event_comments (event_id, created_at desc);
create index event_comments_user_id_idx on public.event_comments (user_id);
create index group_announcements_group_id_idx on public.group_announcements (group_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger groups_set_updated_at before update on public.groups
  for each row execute function public.set_updated_at();
create trigger courts_set_updated_at before update on public.courts
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger event_rsvps_set_updated_at before update on public.event_rsvps
  for each row execute function public.set_updated_at();
create trigger event_comments_set_updated_at before update on public.event_comments
  for each row execute function public.set_updated_at();
create trigger group_announcements_set_updated_at before update on public.group_announcements
  for each row execute function public.set_updated_at();

-- Auto-create profile row on signup (private trigger — not RPC-callable)
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'Player')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

revoke all on function private.handle_new_user() from public;

-- Auto-add group creator as admin member
create or replace function private.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function private.handle_new_group();

revoke all on function private.handle_new_group() from public;

-- ---------------------------------------------------------------------------
-- Private RLS helpers (SECURITY DEFINER — not exposed via Data API)
-- ---------------------------------------------------------------------------
create or replace function private.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_group_admin(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = (select auth.uid())
      and gm.role = 'admin'
  );
$$;

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
        or (e.visibility = 'public' and e.starts_at > now())
      )
  );
$$;

create or replace function private.shares_group_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs
      on mine.group_id = theirs.group_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = target_user_id
  );
$$;

revoke all on function private.is_group_member(uuid) from public;
revoke all on function private.is_group_admin(uuid) from public;
revoke all on function private.can_access_event(uuid) from public;
revoke all on function private.shares_group_with(uuid) from public;
grant execute on function private.is_group_member(uuid) to authenticated;
grant execute on function private.is_group_admin(uuid) to authenticated;
grant execute on function private.can_access_event(uuid) to authenticated;
grant execute on function private.shares_group_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Public RPCs (client-callable)
-- ---------------------------------------------------------------------------
create or replace function public.get_group_preview_by_invite_code(p_invite_code text)
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name
  from public.groups g
  where g.invite_code = p_invite_code;
$$;

create or replace function public.join_group_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  select g.id into v_group_id
  from public.groups g
  where g.invite_code = p_invite_code;

  if v_group_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, (select auth.uid()), 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

revoke all on function public.get_group_preview_by_invite_code(text) from public;
revoke all on function public.join_group_by_invite_code(text) from public;
revoke all on function public.get_group_preview_by_invite_code(text) from anon;
revoke all on function public.join_group_by_invite_code(text) from anon;
grant execute on function public.get_group_preview_by_invite_code(text) to authenticated;
grant execute on function public.join_group_by_invite_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.courts enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_comments enable row level security;
alter table public.group_announcements enable row level security;

alter table public.profiles force row level security;
alter table public.groups force row level security;
alter table public.group_members force row level security;
alter table public.courts force row level security;
alter table public.events force row level security;
alter table public.event_rsvps force row level security;
alter table public.event_comments force row level security;
alter table public.group_announcements force row level security;

-- Data API table grants (RLS still enforces row access)
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.courts to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_rsvps to authenticated;
grant select, insert, update, delete on public.event_comments to authenticated;
grant select, insert, update, delete on public.group_announcements to authenticated;

-- profiles
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_select_visible"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or profile_visibility = 'public'
    or private.shares_group_with(id)
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- groups
create policy "groups_select_member_or_creator"
  on public.groups for select
  to authenticated
  using (private.is_group_member(id) or created_by = (select auth.uid()));

create policy "groups_insert_own"
  on public.groups for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "groups_update_admin"
  on public.groups for update
  to authenticated
  using (private.is_group_admin(id))
  with check (private.is_group_admin(id));

create policy "groups_delete_admin"
  on public.groups for delete
  to authenticated
  using (private.is_group_admin(id));

-- group_members
create policy "group_members_select_member"
  on public.group_members for select
  to authenticated
  using (private.is_group_member(group_id));

create policy "group_members_insert_admin"
  on public.group_members for insert
  to authenticated
  with check (private.is_group_admin(group_id));

create policy "group_members_update_admin"
  on public.group_members for update
  to authenticated
  using (private.is_group_admin(group_id))
  with check (private.is_group_admin(group_id));

create policy "group_members_delete_self_or_admin"
  on public.group_members for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_group_admin(group_id)
  );

-- courts
create policy "courts_select_member_or_global"
  on public.courts for select
  to authenticated
  using (group_id is null or private.is_group_member(group_id));

create policy "courts_insert_member"
  on public.courts for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (group_id is null or private.is_group_member(group_id))
  );

create policy "courts_update_creator_or_admin"
  on public.courts for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or (group_id is not null and private.is_group_admin(group_id))
  )
  with check (
    created_by = (select auth.uid())
    or (group_id is not null and private.is_group_admin(group_id))
  );

create policy "courts_delete_creator_or_admin"
  on public.courts for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    or (group_id is not null and private.is_group_admin(group_id))
  );

-- events
create policy "events_select_accessible"
  on public.events for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or (group_id is not null and private.is_group_member(group_id))
    or (visibility = 'public' and starts_at > now())
  );

create policy "events_insert_member"
  on public.events for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (group_id is null or private.is_group_member(group_id))
  );

create policy "events_update_creator"
  on public.events for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "events_delete_creator"
  on public.events for delete
  to authenticated
  using (created_by = (select auth.uid()));

-- event_rsvps
create policy "event_rsvps_select_accessible"
  on public.event_rsvps for select
  to authenticated
  using (private.can_access_event(event_id));

create policy "event_rsvps_insert_own"
  on public.event_rsvps for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and private.can_access_event(event_id)
  );

create policy "event_rsvps_update_own"
  on public.event_rsvps for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and private.can_access_event(event_id)
  );

create policy "event_rsvps_delete_own"
  on public.event_rsvps for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- event_comments
create policy "event_comments_select_accessible"
  on public.event_comments for select
  to authenticated
  using (private.can_access_event(event_id));

create policy "event_comments_insert_member"
  on public.event_comments for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.events e
      where e.id = event_id
        and (
          e.created_by = (select auth.uid())
          or (e.group_id is not null and private.is_group_member(e.group_id))
        )
    )
  );

create policy "event_comments_update_own"
  on public.event_comments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "event_comments_delete_own"
  on public.event_comments for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- group_announcements
create policy "group_announcements_select_member"
  on public.group_announcements for select
  to authenticated
  using (private.is_group_member(group_id));

create policy "group_announcements_insert_admin"
  on public.group_announcements for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and private.is_group_admin(group_id)
  );

create policy "group_announcements_update_admin"
  on public.group_announcements for update
  to authenticated
  using (private.is_group_admin(group_id))
  with check (
    author_id = (select auth.uid())
    and private.is_group_admin(group_id)
  );

create policy "group_announcements_delete_admin"
  on public.group_announcements for delete
  to authenticated
  using (private.is_group_admin(group_id));
