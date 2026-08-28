-- Server-side game search for the home feed: radius, free text, skill and session
-- type filters, mirroring public.discover_players.

-- Supports the bounding-box prefilter in search_events. `starts_at > now()` cannot
-- be part of a partial index because now() is not immutable, so the existing
-- events_public_upcoming_idx still covers the time predicate.
create index if not exists events_public_upcoming_geo_idx
  on public.events (lat, lng)
  where group_id is null and visibility = 'public';

-- Skill levels compare as an ordered band, so rank them numerically.
create or replace function private.skill_rank(level public.skill_level)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case level
    when 'beginner' then 0
    when 'intermediate' then 1
    when 'advanced' then 2
  end;
$$;

revoke all on function private.skill_rank(public.skill_level) from public;

-- Returns public, standalone, upcoming events only. This is SECURITY DEFINER so it
-- bypasses events_select_accessible; the body therefore repeats that policy's public
-- branch itself and requires an authenticated caller.
create or replace function public.search_events(
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
  group_id uuid,
  court_id uuid,
  visibility public.event_visibility,
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
      e.group_id,
      e.court_id,
      e.visibility,
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
      -- Mirrors the public branch of events_select_accessible.
      and e.group_id is null
      and e.visibility = 'public'::public.event_visibility
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
    c.group_id,
    c.court_id,
    c.visibility,
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
  'Searches public standalone upcoming events by radius, text, skill band and session type. Returns a server-computed distance_km and going_count.';
