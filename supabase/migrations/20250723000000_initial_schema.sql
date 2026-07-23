-- PickleballCX initial schema
-- Run via Supabase SQL editor or: supabase db push

create extension if not exists "pgcrypto";

-- Enums
create type public.skill_level as enum ('beginner', 'intermediate', 'advanced');
create type public.profile_visibility as enum ('group_only', 'public');
create type public.court_type as enum ('indoor', 'outdoor', 'both');
create type public.session_type as enum ('open_play', 'fixed_group');
create type public.event_visibility as enum ('group_private', 'public');
create type public.rsvp_status as enum ('going', 'maybe', 'not_going', 'waitlist');
create type public.group_member_role as enum ('admin', 'member');

-- Profiles (extends auth.users)
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

-- Groups
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

-- Courts / venues
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

create index courts_lat_lng_idx on public.courts (lat, lng);
create index courts_group_id_idx on public.courts (group_id);

-- Sessions / events
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

create index events_group_id_starts_at_idx on public.events (group_id, starts_at);
create index events_starts_at_idx on public.events (starts_at);
create index events_visibility_starts_at_idx on public.events (visibility, starts_at);

-- RSVPs
create table public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Session comments
create table public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index event_comments_event_id_created_at_idx on public.event_comments (event_id, created_at desc);

-- Group announcements
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

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
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

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Player')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is current user a member of a group
create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

-- Helper: is current user an admin of a group
create or replace function public.is_group_admin(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  );
$$;

-- Helper: can current user access an event (read RSVPs, comments, etc.)
create or replace function public.can_access_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = target_event_id
      and (
        e.created_by = auth.uid()
        or (e.group_id is not null and public.is_group_member(e.group_id))
        or (e.visibility = 'public' and e.starts_at > now())
      )
  );
$$;

-- Auto-add group creator as admin member
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- Invite-code helpers (RLS blocks direct group lookup by code before membership)
create or replace function public.get_group_preview_by_invite_code(p_invite_code text)
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name
  from public.groups g
  where g.invite_code = p_invite_code;
$$;

create or replace function public.join_group_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select g.id into v_group_id
  from public.groups g
  where g.invite_code = p_invite_code;

  if v_group_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;
grant execute on function public.can_access_event(uuid) to authenticated;
grant execute on function public.get_group_preview_by_invite_code(text) to authenticated;
grant execute on function public.join_group_by_invite_code(text) to authenticated;

-- RLS (all public tables)
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

-- profiles
-- insert: handle_new_user() trigger, or profiles_insert_own fallback
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- groups
create policy "groups_select_member_or_creator"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id) or created_by = auth.uid());

create policy "groups_insert_own"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "groups_update_admin"
  on public.groups for update
  to authenticated
  using (public.is_group_admin(id))
  with check (public.is_group_admin(id));

create policy "groups_delete_admin"
  on public.groups for delete
  to authenticated
  using (public.is_group_admin(id));

-- group_members
-- inserts: creator via handle_new_group() trigger, joins via join_group_by_invite_code(), admins via policy below
create policy "group_members_select_member"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_members_insert_admin"
  on public.group_members for insert
  to authenticated
  with check (public.is_group_admin(group_id));

create policy "group_members_update_admin"
  on public.group_members for update
  to authenticated
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));

create policy "group_members_delete_self_or_admin"
  on public.group_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_admin(group_id)
  );

-- courts
create policy "courts_select_member_or_global"
  on public.courts for select
  to authenticated
  using (group_id is null or public.is_group_member(group_id));

create policy "courts_insert_member"
  on public.courts for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (group_id is null or public.is_group_member(group_id))
  );

create policy "courts_update_creator_or_admin"
  on public.courts for update
  to authenticated
  using (
    created_by = auth.uid()
    or (group_id is not null and public.is_group_admin(group_id))
  )
  with check (
    created_by = auth.uid()
    or (group_id is not null and public.is_group_admin(group_id))
  );

create policy "courts_delete_creator_or_admin"
  on public.courts for delete
  to authenticated
  using (
    created_by = auth.uid()
    or (group_id is not null and public.is_group_admin(group_id))
  );

-- events
create policy "events_select_accessible"
  on public.events for select
  to authenticated
  using (
    created_by = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
    or (visibility = 'public' and starts_at > now())
  );

create policy "events_insert_member"
  on public.events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (group_id is null or public.is_group_member(group_id))
  );

create policy "events_update_creator"
  on public.events for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "events_delete_creator"
  on public.events for delete
  to authenticated
  using (created_by = auth.uid());

-- event_rsvps
create policy "event_rsvps_select_accessible"
  on public.event_rsvps for select
  to authenticated
  using (public.can_access_event(event_id));

create policy "event_rsvps_insert_own"
  on public.event_rsvps for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_event(event_id)
  );

create policy "event_rsvps_update_own"
  on public.event_rsvps for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.can_access_event(event_id)
  );

create policy "event_rsvps_delete_own"
  on public.event_rsvps for delete
  to authenticated
  using (user_id = auth.uid());

-- event_comments
create policy "event_comments_select_accessible"
  on public.event_comments for select
  to authenticated
  using (public.can_access_event(event_id));

create policy "event_comments_insert_member"
  on public.event_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = event_id
        and (
          e.created_by = auth.uid()
          or (e.group_id is not null and public.is_group_member(e.group_id))
        )
    )
  );

create policy "event_comments_update_own"
  on public.event_comments for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "event_comments_delete_own"
  on public.event_comments for delete
  to authenticated
  using (user_id = auth.uid());

-- group_announcements
create policy "group_announcements_select_member"
  on public.group_announcements for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_announcements_insert_admin"
  on public.group_announcements for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.is_group_admin(group_id)
  );

create policy "group_announcements_update_admin"
  on public.group_announcements for update
  to authenticated
  using (public.is_group_admin(group_id))
  with check (
    author_id = auth.uid()
    and public.is_group_admin(group_id)
  );

create policy "group_announcements_delete_admin"
  on public.group_announcements for delete
  to authenticated
  using (public.is_group_admin(group_id));

