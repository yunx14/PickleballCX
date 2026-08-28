-- Removes the groups feature and the player-connection feature (discovery, match
-- requests, 1:1 messaging, session invites) from the schema.
--
-- Order matters: policies that reference the doomed objects are recreated first,
-- then the helper functions, then the columns, then the tables, then the enums.
-- SQL function bodies are opaque strings to the dependency tracker, so a function
-- left referencing a dropped column fails at call time rather than at drop time.

-- 1. Realtime publication membership must go before the tables.
alter publication supabase_realtime drop table public.group_announcements;
alter publication supabase_realtime drop table public.player_messages;
alter publication supabase_realtime drop table public.session_invites;

-- 2. profiles.
--
-- profile_visibility defaults to 'group_only' and no client ever writes it, so
-- every row carries that value. Its only readers were the group and match-request
-- branches of profiles_select_visible; with those gone the column cannot express
-- anything, so it is dropped and visibility becomes co-attendance based: you can
-- read a profile if you have shared a session with that player. Broader access
-- (browsing a roster you have not joined) belongs in a column-limited RPC, since
-- public.profiles also holds phone.
create or replace function private.shares_event_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    -- Both RSVP'd to the same session.
    select 1
    from public.event_rsvps mine
    join public.event_rsvps theirs on theirs.event_id = mine.event_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = target_user_id
  ) or exists (
    -- They host a session the viewer RSVP'd to.
    select 1
    from public.events e
    join public.event_rsvps r on r.event_id = e.id
    where r.user_id = (select auth.uid())
      and e.created_by = target_user_id
  ) or exists (
    -- The viewer hosts a session they RSVP'd to.
    select 1
    from public.events e
    join public.event_rsvps r on r.event_id = e.id
    where e.created_by = (select auth.uid())
      and r.user_id = target_user_id
  );
$$;

revoke all on function private.shares_event_with(uuid) from public;

comment on function private.shares_event_with is
  'True when the caller and target user share a session as co-attendees or as host and attendee. SECURITY DEFINER so profiles_select_visible does not recurse through event_rsvps RLS.';

drop policy if exists "profiles_select_visible" on public.profiles;

create policy "profiles_select_visible"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or private.shares_event_with(id)
  );

-- 3. events. The group branch and the session-invite branch both go. Invited
-- players are already covered by the RSVP branch, because accepting an invite
-- auto-RSVP'd them.
drop policy if exists "events_select_accessible" on public.events;

create policy "events_select_accessible"
  on public.events for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or starts_at > now()
    or exists (
      select 1
      from public.event_rsvps r
      where r.event_id = events.id
        and r.user_id = (select auth.uid())
        and r.status in ('going', 'maybe', 'waitlist')
    )
  );

-- Every session is public now, so insert and update only have to prove authorship.
drop policy if exists "events_insert_authenticated" on public.events;

create policy "events_insert_authenticated"
  on public.events for insert
  to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "events_update_creator" on public.events;

create policy "events_update_creator"
  on public.events for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

-- 4. can_access_event backs the event_rsvps and event_comments policies, so this
-- single rewrite fixes RSVP and comment visibility too.
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
        or e.starts_at > now()
        or exists (
          select 1
          from public.event_rsvps r
          where r.event_id = e.id
            and r.user_id = (select auth.uid())
            and r.status in ('going', 'maybe', 'waitlist')
        )
      )
  );
$$;

-- 5. search_events loses group_id and visibility. The return type changes, so the
-- old signature has to be dropped rather than replaced.
drop function if exists public.search_events(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.session_type,
  timestamptz,
  uuid,
  integer
);

create function public.search_events(
  viewer_lat double precision default null,
  viewer_lng double precision default null,
  radius_mi double precision default null,
  search_query text default null,
  skill_filter public.skill_level default null,
  session_type_filter public.session_type default null,
  starts_before timestamptz default null,
  exclude_user_id uuid default null,
  max_results integer default 200
)
returns table (
  id uuid,
  court_id uuid,
  starts_at timestamptz,
  max_players integer,
  session_type public.session_type,
  skill_min public.skill_level,
  skill_max public.skill_level,
  description text,
  lat double precision,
  lng double precision,
  created_by uuid,
  created_at timestamptz,
  court_name text,
  court_address text,
  court_num_courts integer,
  going_count integer,
  distance_km double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with params as (
    select
      auth.uid() as viewer_id,
      nullif(btrim(coalesce(search_query, '')), '') as q,
      case
        when radius_mi is null or viewer_lat is null or viewer_lng is null then null
        else radius_mi / 0.621371
      end as radius_km
  ),
  bounds as (
    select
      p.viewer_id,
      p.q,
      p.radius_km,
      -- One degree of latitude is ~111.045 km; longitude degrees shrink with
      -- cos(latitude), floored so the box stays finite near the poles.
      case when p.radius_km is null then null else p.radius_km / 111.045 end as lat_delta,
      case
        when p.radius_km is null then null
        else p.radius_km / (111.045 * greatest(0.01, cos(radians(viewer_lat))))
      end as lng_delta
    from params p
  ),
  candidates as (
    select
      e.id,
      e.court_id,
      e.starts_at,
      e.max_players,
      e.session_type,
      e.skill_min,
      e.skill_max,
      e.description,
      e.lat,
      e.lng,
      e.created_by,
      e.created_at,
      c.name as court_name,
      c.address as court_address,
      c.num_courts as court_num_courts,
      coalesce(g.going_count, 0)::integer as going_count,
      case
        when viewer_lat is not null
          and viewer_lng is not null
          and e.lat is not null
          and e.lng is not null
        then (
          6371 * acos(
            least(
              1.0,
              greatest(
                -1.0,
                cos(radians(viewer_lat)) * cos(radians(e.lat))
                  * cos(radians(e.lng) - radians(viewer_lng))
                  + sin(radians(viewer_lat)) * sin(radians(e.lat))
              )
            )
          )
        )
        else null
      end as distance_km,
      b.radius_km
    from public.events e
    cross join bounds b
    join public.courts c on c.id = e.court_id
    left join lateral (
      select count(*)::integer as going_count
      from public.event_rsvps r
      where r.event_id = e.id
        and r.status = 'going'::public.rsvp_status
    ) g on true
    where b.viewer_id is not null
      and e.starts_at > now()
      and (starts_before is null or e.starts_at <= starts_before)
      and (session_type_filter is null or e.session_type = session_type_filter)
      -- A game matches when the requested level falls inside its band; absent
      -- bounds mean the game is open to everyone.
      and (
        skill_filter is null
        or (
          private.skill_rank(skill_filter)
            between coalesce(private.skill_rank(e.skill_min), 0)
            and coalesce(private.skill_rank(e.skill_max), 2)
        )
      )
      and (
        b.q is null
        or c.name ilike '%' || b.q || '%'
        or c.address ilike '%' || b.q || '%'
        or coalesce(e.description, '') ilike '%' || b.q || '%'
      )
      and (exclude_user_id is null or e.created_by <> exclude_user_id)
      and (
        exclude_user_id is null
        or not exists (
          select 1
          from public.event_rsvps r
          where r.event_id = e.id
            and r.user_id = exclude_user_id
            and r.status in (
              'going'::public.rsvp_status,
              'maybe'::public.rsvp_status,
              'waitlist'::public.rsvp_status
            )
        )
      )
      -- Bounding box prefilter so the index can be used before the trig runs.
      and (
        b.lat_delta is null
        or (
          e.lat between viewer_lat - b.lat_delta and viewer_lat + b.lat_delta
          and e.lng between viewer_lng - b.lng_delta and viewer_lng + b.lng_delta
        )
      )
  )
  select
    c.id,
    c.court_id,
    c.starts_at,
    c.max_players,
    c.session_type,
    c.skill_min,
    c.skill_max,
    c.description,
    c.lat,
    c.lng,
    c.created_by,
    c.created_at,
    c.court_name,
    c.court_address,
    c.court_num_courts,
    c.going_count,
    c.distance_km
  from candidates c
  where c.radius_km is null or (c.distance_km is not null and c.distance_km <= c.radius_km)
  order by c.starts_at asc
  limit greatest(1, least(coalesce(max_results, 200), 500));
$$;

revoke all on function public.search_events(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.session_type,
  timestamptz,
  uuid,
  integer
) from public;

revoke all on function public.search_events(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.session_type,
  timestamptz,
  uuid,
  integer
) from anon;

grant execute on function public.search_events(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.session_type,
  timestamptz,
  uuid,
  integer
) to authenticated;

comment on function public.search_events is
  'Searches public upcoming events by radius, text, skill band and session type. Returns a server-computed distance_km and going_count.';

-- 6. Drop the group/visibility columns. Their indexes and check constraints go
-- with them, so the two partial indexes are recreated unconditional afterwards.
--
-- The update-notification trigger names visibility in its WHEN clause, which is a
-- tracked dependency and blocks the column drop, so recreate it first.
drop trigger if exists events_notify_update on public.events;

create trigger events_notify_update
  after update on public.events
  for each row
  when (
    old.court_id is distinct from new.court_id
    or old.starts_at is distinct from new.starts_at
    or old.max_players is distinct from new.max_players
    or old.session_type is distinct from new.session_type
    or old.skill_min is distinct from new.skill_min
    or old.skill_max is distinct from new.skill_max
    or old.description is distinct from new.description
  )
  execute function private.notify_on_event_update();

alter table public.events
  drop constraint if exists events_group_visibility_check;

alter table public.events
  drop column if exists group_id,
  drop column if exists visibility;

create index if not exists events_upcoming_idx
  on public.events (starts_at);

create index if not exists events_geo_idx
  on public.events (lat, lng);

alter table public.profiles
  drop column if exists profile_visibility,
  drop column if exists play_format,
  drop column if exists ranked_preference,
  drop column if exists available_now,
  drop column if exists available_until,
  drop column if exists discovery_enabled,
  drop column if exists dupr_rating;

-- 7. Tables. Cascade takes their policies, triggers, indexes and constraints.
drop table if exists public.group_announcements cascade;
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;
drop table if exists public.session_invites cascade;
drop table if exists public.player_messages cascade;
drop table if exists public.player_conversations cascade;
drop table if exists public.match_requests cascade;

-- 8. Helper and notification functions.
drop function if exists private.is_group_member(uuid);
drop function if exists private.is_group_admin(uuid);
drop function if exists private.shares_group_with(uuid);
drop function if exists private.handle_new_group();
drop function if exists private.notify_on_group_announcement_insert();
drop function if exists public.get_group_preview_by_invite_code(text);
drop function if exists public.join_group_by_invite_code(text);

drop function if exists public.discover_players(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.play_format
);
drop function if exists private.are_connected_players(uuid, uuid);
drop function if exists private.is_player_conversation_participant(uuid);
drop function if exists private.is_match_request_participant(uuid);
drop function if exists private.can_send_session_invite(uuid, uuid);
drop function if exists private.ensure_player_conversation_on_match_accept();
drop function if exists private.has_match_requests_with(uuid);
drop function if exists private.is_discovery_ready_player(uuid);
drop function if exists private.notify_on_match_request_insert();
drop function if exists private.notify_on_match_request_update();
drop function if exists private.notify_on_player_message_insert();
drop function if exists private.notify_on_session_invite_insert();

-- 9. Enums last, once every column and function signature using them is gone.
drop type if exists public.group_member_role;
drop type if exists public.event_visibility;
drop type if exists public.profile_visibility;
drop type if exists public.match_request_status;
drop type if exists public.session_invite_status;
drop type if exists public.play_format;
drop type if exists public.ranked_preference;
