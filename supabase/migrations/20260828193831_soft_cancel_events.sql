-- Calling off a session meant deleting it, which erased the RSVPs and the comment
-- thread and told the people who had planned their evening around it precisely
-- nothing. Cancelling is now a soft state: the session stays readable for everyone
-- who was involved, they get told, and the host can reinstate it.

alter table public.events
  add column cancelled_at timestamptz,
  add column cancellation_reason text,
  add constraint events_cancellation_reason_length_check
    check (cancellation_reason is null or char_length(cancellation_reason) <= 300);

comment on column public.events.cancelled_at is
  'Set when the host calls off the session. Cancelled sessions stay visible to the host and anyone who RSVPd, but drop out of discovery.';

create index if not exists events_open_upcoming_idx
  on public.events (ends_at)
  where cancelled_at is null;

-- A cancelled session leaves discovery, but stays reachable for the host and for
-- anyone who had RSVPd so they can see why it was called off.
drop policy if exists events_select_accessible on public.events;

create policy events_select_accessible on public.events
  for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or (ends_at > now() and cancelled_at is null)
    or exists (
      select 1
      from public.event_rsvps r
      where r.event_id = events.id
        and r.user_id = (select auth.uid())
        and r.status in ('going', 'maybe', 'waitlist')
    )
  );

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
        or (e.ends_at > now() and e.cancelled_at is null)
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

-- Only the host may flip cancellation, and only through the RPCs below, which own
-- the notification. Without this an attendee could PATCH cancelled_at on a session
-- they had joined, since the update policy is row scoped rather than column scoped.
create or replace function private.guard_event_cancellation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.cancelled_at is distinct from old.cancelled_at
    or new.cancellation_reason is distinct from old.cancellation_reason
  then
    if coalesce(current_setting('pickleballcx.allow_cancel_change', true), '') <> 'on' then
      raise exception 'Use cancel_event or reinstate_event to change cancellation'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_event_cancellation() from public;

drop trigger if exists events_guard_cancellation on public.events;

create trigger events_guard_cancellation
  before update on public.events
  for each row
  execute function private.guard_event_cancellation();

create or replace function public.cancel_event(p_event_id uuid, p_reason text default null)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_host uuid;
  v_cancelled timestamptz;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_recipients uuid[];
  v_court text;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select e.created_by, e.cancelled_at
  into v_host, v_cancelled
  from public.events e
  where e.id = p_event_id;

  if v_host is null then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  if v_host is distinct from v_user then
    raise exception 'Only the host can cancel this session' using errcode = '42501';
  end if;

  if v_cancelled is not null then
    return v_cancelled;
  end if;

  if v_reason is not null and char_length(v_reason) > 300 then
    raise exception 'Keep the reason to 300 characters or less' using errcode = '22023';
  end if;

  -- Tell everyone before the row changes, so the recipient list still reflects who
  -- was counting on the session.
  v_recipients := private.session_activity_recipient_ids(p_event_id, v_user);
  v_court := private.event_court_label(p_event_id);

  perform set_config('pickleballcx.allow_cancel_change', 'on', true);

  update public.events
  set cancelled_at = now(),
      cancellation_reason = v_reason
  where id = p_event_id
  returning cancelled_at into v_cancelled;

  perform set_config('pickleballcx.allow_cancel_change', 'off', true);

  perform private.insert_session_notifications(
    v_recipients,
    'event_cancelled',
    'Session cancelled',
    case
      when v_reason is null then v_court || ' was cancelled'
      else v_court || ' was cancelled · ' || v_reason
    end,
    p_event_id
  );

  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'events',
      'type', 'CANCEL',
      'record', to_jsonb((select e from public.events e where e.id = p_event_id)),
      'recipient_ids', to_jsonb(v_recipients)
    )
  );

  return v_cancelled;
end;
$$;

create or replace function public.reinstate_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_host uuid;
  v_ends_at timestamptz;
  v_recipients uuid[];
  v_court text;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select e.created_by, e.ends_at
  into v_host, v_ends_at
  from public.events e
  where e.id = p_event_id;

  if v_host is null then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  if v_host is distinct from v_user then
    raise exception 'Only the host can reinstate this session' using errcode = '42501';
  end if;

  if v_ends_at <= now() then
    raise exception 'This session has already ended' using errcode = '22023';
  end if;

  perform set_config('pickleballcx.allow_cancel_change', 'on', true);

  update public.events
  set cancelled_at = null,
      cancellation_reason = null
  where id = p_event_id
    and cancelled_at is not null;

  perform set_config('pickleballcx.allow_cancel_change', 'off', true);

  if not found then
    return;
  end if;

  v_recipients := private.session_activity_recipient_ids(p_event_id, v_user);
  v_court := private.event_court_label(p_event_id);

  perform private.insert_session_notifications(
    v_recipients,
    'event_updated',
    'Session back on',
    v_court || ' is back on',
    p_event_id
  );
end;
$$;

revoke all on function public.cancel_event(uuid, text) from public;
revoke all on function public.cancel_event(uuid, text) from anon;
grant execute on function public.cancel_event(uuid, text) to authenticated;

revoke all on function public.reinstate_event(uuid) from public;
revoke all on function public.reinstate_event(uuid) from anon;
grant execute on function public.reinstate_event(uuid) to authenticated;

comment on function public.cancel_event is
  'Host-only soft cancel. Keeps the session, its RSVPs and its comments, notifies everyone who had joined, and returns the cancellation timestamp.';

-- Joining a session that is no longer happening should fail loudly.
create or replace function public.rsvp_to_event(p_event_id uuid, p_status public.rsvp_status)
returns public.rsvp_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_previous public.rsvp_status;
  v_final public.rsvp_status;
  v_cancelled timestamptz;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_status = 'waitlist' then
    raise exception 'The waitlist is assigned automatically' using errcode = '22023';
  end if;

  -- SECURITY DEFINER bypasses RLS, so access has to be re-checked here.
  if not private.can_access_event(p_event_id) then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  select e.cancelled_at into v_cancelled
  from public.events e
  where e.id = p_event_id;

  -- Backing out of a cancelled session stays allowed; joining one does not.
  if v_cancelled is not null and p_status <> 'not_going' then
    raise exception 'This session was cancelled' using errcode = '22023';
  end if;

  perform private.lock_event_capacity(p_event_id);

  select r.status
  into v_previous
  from public.event_rsvps r
  where r.event_id = p_event_id
    and r.user_id = v_user;

  insert into public.event_rsvps (event_id, user_id, status)
  values (p_event_id, v_user, p_status)
  on conflict (event_id, user_id) do update
    set status = excluded.status
  returning status into v_final;

  -- A going seat was just released, so someone waiting can take it.
  if v_previous = 'going' and v_final <> 'going' then
    perform private.promote_waitlist(p_event_id);
  end if;

  return v_final;
end;
$$;

revoke all on function public.rsvp_to_event(uuid, public.rsvp_status) from public;
revoke all on function public.rsvp_to_event(uuid, public.rsvp_status) from anon;
grant execute on function public.rsvp_to_event(uuid, public.rsvp_status) to authenticated;

-- Discovery must stop surfacing cancelled sessions. Same signature and return
-- type as before, so this is a replace rather than a drop.
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
      -- Cancelled sessions leave discovery entirely.
      and e.cancelled_at is null
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

