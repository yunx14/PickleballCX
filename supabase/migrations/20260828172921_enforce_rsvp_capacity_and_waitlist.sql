-- max_players was decorative: the client showed "4/4 going" and then happily let a
-- fifth player in. Capacity is now enforced in the database, and the waitlist status
-- that already existed in the rsvp_status enum finally gets used.
--
-- Enforcement lives in a BEFORE trigger rather than only in the RPC so that it holds
-- on every write path, including a direct PostgREST insert into event_rsvps, which
-- RLS still permits.

-- Serializes capacity decisions for one session. Two players racing for the last
-- seat would otherwise both count 3 going against a max of 4 and both get in.
create or replace function private.lock_event_capacity(p_event_id uuid)
returns void
language sql
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended(p_event_id::text, 0));
$$;

revoke all on function private.lock_event_capacity(uuid) from public;

create or replace function private.enforce_rsvp_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
  v_host uuid;
  v_going integer;
begin
  if new.status <> 'going' then
    return new;
  end if;

  -- Already holds a seat, so nothing new is being claimed.
  if tg_op = 'UPDATE' and old.status = 'going' then
    return new;
  end if;

  select e.max_players, e.created_by
  into v_max, v_host
  from public.events e
  where e.id = new.event_id;

  if v_max is null then
    return new;
  end if;

  -- The host has to be at their own session, so they are never waitlisted. This can
  -- put a full session one over max_players if the host re-joins after backing out.
  if new.user_id is not distinct from v_host then
    return new;
  end if;

  perform private.lock_event_capacity(new.event_id);

  select count(*)
  into v_going
  from public.event_rsvps r
  where r.event_id = new.event_id
    and r.status = 'going'
    and r.user_id <> new.user_id;

  if v_going >= v_max then
    new.status := 'waitlist';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_rsvp_capacity() from public;

drop trigger if exists event_rsvps_enforce_capacity on public.event_rsvps;

create trigger event_rsvps_enforce_capacity
  before insert or update of status on public.event_rsvps
  for each row
  execute function private.enforce_rsvp_capacity();

-- Fills freed seats from the waitlist, oldest RSVP first. Called when someone gives
-- up a going seat and when a host raises max_players.
create or replace function private.promote_waitlist(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
  v_going integer;
  v_court text;
  v_candidate uuid;
  v_promoted integer := 0;
begin
  select e.max_players into v_max
  from public.events e
  where e.id = p_event_id;

  -- A null max_players means unlimited, in which case the loop below drains the
  -- whole waitlist, notifying each player.
  perform private.lock_event_capacity(p_event_id);

  v_court := private.event_court_label(p_event_id);

  loop
    select count(*)
    into v_going
    from public.event_rsvps r
    where r.event_id = p_event_id
      and r.status = 'going';

    if v_max is not null and v_going >= v_max then
      exit;
    end if;

    select r.user_id
    into v_candidate
    from public.event_rsvps r
    where r.event_id = p_event_id
      and r.status = 'waitlist'
    order by r.created_at
    limit 1;

    if v_candidate is null then
      exit;
    end if;

    update public.event_rsvps
    set status = 'going'
    where event_id = p_event_id
      and user_id = v_candidate;

    perform private.insert_session_notifications(
      array[v_candidate],
      'event_updated',
      'A spot opened up',
      'You are now going · ' || v_court,
      p_event_id
    );

    v_promoted := v_promoted + 1;
  end loop;

  return v_promoted;
end;
$$;

revoke all on function private.promote_waitlist(uuid) from public;

-- Raising the cap should let waiting players in without anyone having to re-RSVP.
create or replace function private.promote_waitlist_on_capacity_raise()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.max_players is null or old.max_players is null or new.max_players > old.max_players then
    perform private.promote_waitlist(new.id);
  end if;

  return null;
end;
$$;

revoke all on function private.promote_waitlist_on_capacity_raise() from public;

drop trigger if exists events_promote_waitlist on public.events;

create trigger events_promote_waitlist
  after update of max_players on public.events
  for each row
  when (old.max_players is distinct from new.max_players)
  execute function private.promote_waitlist_on_capacity_raise();

-- Single round trip for the client, and it reports back the status that was actually
-- stored, which may be waitlist rather than the requested going.
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

comment on function public.rsvp_to_event is
  'Sets the caller RSVP for a session in one round trip under a per-session advisory lock. Returns the stored status, which is waitlist when the session is full. Releasing a going seat promotes the longest-waiting player.';
