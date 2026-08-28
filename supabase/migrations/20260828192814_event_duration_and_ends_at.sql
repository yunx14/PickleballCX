-- Sessions had a start but no end, so "is this game still on?" had no answer.
-- Everything that asked the question guessed from starts_at, which meant a game
-- became invisible and unreachable the moment it began: it dropped out of the
-- discovery feed, out of My Games, and out of the events RLS policy, so a player
-- running late could lose access to the session they were driving to.
--
-- duration_minutes plus a generated ends_at gives one authoritative end time that
-- RLS, search and the client all read.

alter table public.events
  add column duration_minutes integer not null default 90,
  add constraint events_duration_minutes_check
    check (duration_minutes between 15 and 720);

comment on column public.events.duration_minutes is
  'Planned length of the session. 90 minutes is the default when a host does not choose.';

-- Not a generated column: timestamptz + interval is only STABLE, since the result
-- depends on the session time zone, and Postgres requires an IMMUTABLE expression.
-- A trigger keeps it in sync instead, and it stays indexable either way.
alter table public.events
  add column ends_at timestamptz;

create or replace function private.set_event_ends_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Always derived, so anything the client sends for ends_at is discarded.
  new.ends_at := new.starts_at + make_interval(mins => new.duration_minutes);
  return new;
end;
$$;

revoke all on function private.set_event_ends_at() from public;

drop trigger if exists events_set_ends_at on public.events;

create trigger events_set_ends_at
  before insert or update of starts_at, duration_minutes on public.events
  for each row
  execute function private.set_event_ends_at();

update public.events
set ends_at = starts_at + make_interval(mins => duration_minutes)
where ends_at is null;

alter table public.events
  alter column ends_at set not null;

-- Supports the "still running or upcoming" filter that search, RLS and My Games use.
create index if not exists events_ends_at_idx on public.events (ends_at);

-- Access now lasts until the session actually ends, not until it starts.
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
        or e.ends_at > now()
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

drop policy if exists events_select_accessible on public.events;

create policy events_select_accessible on public.events
  for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or ends_at > now()
    or exists (
      select 1
      from public.event_rsvps r
      where r.event_id = events.id
        and r.user_id = (select auth.uid())
        and r.status in ('going', 'maybe', 'waitlist')
    )
  );

-- Attendees should hear about a change to how long the session runs.
drop trigger if exists events_notify_update on public.events;

create trigger events_notify_update
  after update on public.events
  for each row
  when (
    old.court_id is distinct from new.court_id
    or old.starts_at is distinct from new.starts_at
    or old.duration_minutes is distinct from new.duration_minutes
    or old.max_players is distinct from new.max_players
    or old.session_type is distinct from new.session_type
    or old.skill_min is distinct from new.skill_min
    or old.skill_max is distinct from new.skill_max
    or old.description is distinct from new.description
  )
  execute function private.notify_on_event_update();

-- Return type changes, so the function has to be dropped rather than replaced.
drop function if exists public.search_events(
  double precision, double precision, double precision, text,
  public.skill_level, public.session_type, timestamptz, uuid, integer
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
  duration_minutes integer,
  ends_at timestamptz,
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
      e.duration_minutes,
      e.ends_at,
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
      -- A session in progress is still joinable, so filter on the end time.
      and e.ends_at > now()
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
    c.duration_minutes,
    c.ends_at,
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
  double precision, double precision, double precision, text,
  public.skill_level, public.session_type, timestamptz, uuid, integer
) from public;

revoke all on function public.search_events(
  double precision, double precision, double precision, text,
  public.skill_level, public.session_type, timestamptz, uuid, integer
) from anon;

grant execute on function public.search_events(
  double precision, double precision, double precision, text,
  public.skill_level, public.session_type, timestamptz, uuid, integer
) to authenticated;
