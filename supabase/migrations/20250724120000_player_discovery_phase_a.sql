-- Phase A: player discovery (city-only location, skill band matching, opt-in default on)

create type public.play_format as enum ('singles', 'doubles', 'mixed', 'either');
create type public.ranked_preference as enum ('ranked', 'unranked', 'either');

alter table public.profiles
  add column city text,
  add column city_lat double precision,
  add column city_lng double precision,
  add column dupr_rating numeric(4, 2) check (dupr_rating is null or (dupr_rating >= 1 and dupr_rating <= 8)),
  add column play_format public.play_format not null default 'either',
  add column ranked_preference public.ranked_preference not null default 'either',
  add column available_now boolean not null default false,
  add column available_until timestamptz,
  add column discovery_enabled boolean not null default true;

comment on column public.profiles.city is 'City shown in Find players; geocoded to city_lat/city_lng on save.';
comment on column public.profiles.dupr_rating is 'Reserved for future DUPR integration; not used in Phase A matching.';
comment on column public.profiles.discovery_enabled is 'When true, profile appears in Find players for other users.';

create index profiles_discovery_geo_idx
  on public.profiles (city_lat, city_lng)
  where discovery_enabled = true and city_lat is not null and city_lng is not null;

-- Returns discoverable players with safe fields only (no email/phone/coords exposed as address).
create or replace function public.discover_players(
  viewer_lat double precision default null,
  viewer_lng double precision default null,
  radius_mi double precision default null,
  search_query text default null,
  skill_filter public.skill_level default null,
  format_filter public.play_format default null
)
returns table (
  id uuid,
  display_name text,
  city text,
  skill_level public.skill_level,
  play_format public.play_format,
  ranked_preference public.ranked_preference,
  available_now boolean,
  distance_km double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select auth.uid() as user_id
  ),
  candidates as (
    select
      p.id,
      p.display_name,
      p.city,
      p.skill_level,
      p.play_format,
      p.ranked_preference,
      (
        p.available_now
        and (p.available_until is null or p.available_until > now())
      ) as available_now,
      case
        when viewer_lat is not null
          and viewer_lng is not null
          and p.city_lat is not null
          and p.city_lng is not null
        then (
          6371 * acos(
            least(
              1.0,
              greatest(
                -1.0,
                cos(radians(viewer_lat)) * cos(radians(p.city_lat))
                  * cos(radians(p.city_lng) - radians(viewer_lng))
                  + sin(radians(viewer_lat)) * sin(radians(p.city_lat))
              )
            )
          )
        )
        else null
      end as distance_km
    from public.profiles p
    cross join viewer v
    where p.discovery_enabled = true
      and p.skill_level is not null
      and p.display_name <> ''
      and p.id <> v.user_id
      and v.user_id is not null
      and (skill_filter is null or p.skill_level = skill_filter)
      and (
        format_filter is null
        or format_filter = 'either'::public.play_format
        or p.play_format = 'either'::public.play_format
        or p.play_format = format_filter
        or (
          format_filter = 'doubles'::public.play_format
          and p.play_format = 'mixed'::public.play_format
        )
        or (
          format_filter = 'mixed'::public.play_format
          and p.play_format = 'doubles'::public.play_format
        )
      )
      and (
        search_query is null
        or btrim(search_query) = ''
        or p.display_name ilike '%' || btrim(search_query) || '%'
        or coalesce(p.city, '') ilike '%' || btrim(search_query) || '%'
      )
  )
  select
    c.id,
    c.display_name,
    c.city,
    c.skill_level,
    c.play_format,
    c.ranked_preference,
    c.available_now,
    c.distance_km
  from candidates c
  where
    radius_mi is null
    or viewer_lat is null
    or viewer_lng is null
    or c.distance_km is null
    or c.distance_km <= (radius_mi / 0.621371)
  order by
    c.available_now desc,
    c.distance_km asc nulls last,
    c.display_name asc;
$$;

revoke all on function public.discover_players(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.play_format
) from public;

grant execute on function public.discover_players(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.play_format
) to authenticated;
