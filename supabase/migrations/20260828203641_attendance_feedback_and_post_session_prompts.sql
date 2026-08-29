-- Closing the loop after a session. Until now the app recorded intentions and never
-- looked back: an RSVP was the last word on a game, whether four people played or
-- nobody turned up. This adds the reconciliation.
--
--   1. Attendance. The host confirms who actually showed up, which is the only
--      trustworthy source for no-show counts and for who is allowed to rate a session.
--   2. Feedback. A 1-to-5 rating plus an optional court note, which court quality can
--      draw on later.
--   3. A prompt an hour after the session ends that asks for both.

alter table public.events
  add column attendance_confirmed_at timestamptz,
  add column post_session_prompt_sent_at timestamptz;

comment on column public.events.attendance_confirmed_at is
  'Set when the host confirms the roster. Until then attendance is unknown, not absent.';

alter table public.event_rsvps
  add column attended boolean;

comment on column public.event_rsvps.attended is
  'Null until the host confirms the roster. Only confirm_attendance may write it.';

-- Which sessions still need a post-session prompt. Partial, because almost every row
-- is either already prompted or not finished yet.
create index if not exists events_pending_post_session_idx
  on public.events (ends_at)
  where post_session_prompt_sent_at is null and cancelled_at is null;

-- Sessions that already ended before this shipped should not generate a backlog of
-- prompts on the first cron run.
update public.events
set post_session_prompt_sent_at = now()
where post_session_prompt_sent_at is null
  and ends_at <= now();

-- The bookkeeping columns on events are written by the reminder job, the broadcast RPC,
-- the post-session job and attendance confirmation. The events UPDATE policy lets a host
-- edit their own row, which would otherwise let them clear reminder_sent_at and make the
-- cron job push a fresh reminder to every attendee on each pass.
--
-- Rather than raising, this quietly restores the stored values, so an ordinary session
-- edit that happens to send the whole row still succeeds.
create or replace function private.guard_event_bookkeeping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('pickleballcx.allow_event_bookkeeping', true), '') <> 'on' then
    new.reminder_sent_at := old.reminder_sent_at;
    new.last_broadcast_at := old.last_broadcast_at;
    new.post_session_prompt_sent_at := old.post_session_prompt_sent_at;
    new.attendance_confirmed_at := old.attendance_confirmed_at;
  end if;

  -- Moving a session earns a fresh reminder for the new start time. Applied after the
  -- restore above so it works no matter which trigger order Postgres picks.
  if new.starts_at is distinct from old.starts_at then
    new.reminder_sent_at := null;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_event_bookkeeping() from public;

-- Replaces the narrower reschedule-only trigger from the reminders migration.
drop trigger if exists events_reset_reminder on public.events;
drop function if exists private.reset_reminder_on_reschedule();

drop trigger if exists events_guard_bookkeeping on public.events;

create trigger events_guard_bookkeeping
  before update on public.events
  for each row
  execute function private.guard_event_bookkeeping();

-- Same reasoning for attended: a player must not be able to mark themselves present for
-- a game they skipped, and the RSVP UPDATE policy covers their own row.
create or replace function private.guard_attendance_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('pickleballcx.allow_attendance_change', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.attended := null;
  else
    new.attended := old.attended;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_attendance_change() from public;

drop trigger if exists event_rsvps_guard_attendance on public.event_rsvps;

create trigger event_rsvps_guard_attendance
  before insert or update on public.event_rsvps
  for each row
  execute function private.guard_attendance_change();

-- Teach the existing reminder and broadcast paths to announce themselves to the guard.
create or replace function private.send_session_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event record;
  v_recipients uuid[];
  v_minutes integer;
  v_sent integer := 0;
begin
  for v_event in
    select e.id, e.starts_at
    from public.events e
    where e.cancelled_at is null
      and e.reminder_sent_at is null
      and e.starts_at > now()
      and e.starts_at <= now() + interval '90 minutes'
    order by e.starts_at
    limit 200
    for update skip locked
  loop
    select coalesce(array_agg(r.user_id), '{}'::uuid[])
    into v_recipients
    from public.event_rsvps r
    where r.event_id = v_event.id
      and r.status in ('going', 'maybe');

    v_minutes := greatest(1, round(extract(epoch from (v_event.starts_at - now())) / 60))::integer;

    perform private.insert_session_notifications(
      v_recipients,
      'reminder',
      'Starting soon',
      private.event_court_label(v_event.id) || ' starts in about ' || v_minutes || ' minutes',
      v_event.id
    );

    perform private.dispatch_notification(
      jsonb_build_object(
        'table', 'events',
        'type', 'REMINDER',
        'record', to_jsonb((select e from public.events e where e.id = v_event.id)),
        'minutes_until_start', v_minutes,
        'recipient_ids', to_jsonb(v_recipients)
      )
    );

    perform set_config('pickleballcx.allow_event_bookkeeping', 'on', true);

    update public.events
    set reminder_sent_at = now()
    where id = v_event.id;

    perform set_config('pickleballcx.allow_event_bookkeeping', 'off', true);

    v_sent := v_sent + 1;
  end loop;

  return v_sent;
end;
$$;

revoke all on function private.send_session_reminders() from public;
revoke all on function private.send_session_reminders() from anon;
revoke all on function private.send_session_reminders() from authenticated;

create or replace function public.broadcast_to_attendees(p_event_id uuid, p_message text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_host uuid;
  v_ends_at timestamptz;
  v_cancelled timestamptz;
  v_last timestamptz;
  v_message text := nullif(btrim(coalesce(p_message, '')), '');
  v_recipients uuid[];
  v_court text;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if v_message is null then
    raise exception 'Enter a message to send' using errcode = '22023';
  end if;

  if char_length(v_message) > 500 then
    raise exception 'Keep the message to 500 characters or less' using errcode = '22023';
  end if;

  select e.created_by, e.ends_at, e.cancelled_at, e.last_broadcast_at
  into v_host, v_ends_at, v_cancelled, v_last
  from public.events e
  where e.id = p_event_id;

  if v_host is null then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  if v_host is distinct from v_user then
    raise exception 'Only the host can message the players' using errcode = '42501';
  end if;

  if v_cancelled is not null then
    raise exception 'This session was cancelled' using errcode = '22023';
  end if;

  if v_ends_at <= now() then
    raise exception 'This session has already ended' using errcode = '22023';
  end if;

  if v_last is not null and v_last > now() - interval '60 seconds' then
    raise exception 'Wait a moment before sending another message' using errcode = '22023';
  end if;

  v_recipients := private.session_activity_recipient_ids(p_event_id, v_user);

  if cardinality(v_recipients) = 0 then
    return 0;
  end if;

  v_court := private.event_court_label(p_event_id);

  perform private.insert_session_notifications(
    v_recipients,
    'event_updated',
    'Message from the host',
    v_court || ' · ' || v_message,
    p_event_id
  );

  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'events',
      'type', 'BROADCAST',
      'record', to_jsonb((select e from public.events e where e.id = p_event_id)),
      'message', v_message,
      'recipient_ids', to_jsonb(v_recipients)
    )
  );

  perform set_config('pickleballcx.allow_event_bookkeeping', 'on', true);

  update public.events
  set last_broadcast_at = now()
  where id = p_event_id;

  perform set_config('pickleballcx.allow_event_bookkeeping', 'off', true);

  return cardinality(v_recipients);
end;
$$;

revoke all on function public.broadcast_to_attendees(uuid, text) from public;
revoke all on function public.broadcast_to_attendees(uuid, text) from anon;
grant execute on function public.broadcast_to_attendees(uuid, text) to authenticated;

-- Host confirms the roster. Everyone who was on it and is not named here is recorded as
-- a no-show, which is what makes the count meaningful.
create or replace function public.confirm_attendance(p_event_id uuid, p_attended_user_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_host uuid;
  v_ends_at timestamptz;
  v_cancelled timestamptz;
  v_attended uuid[] := coalesce(p_attended_user_ids, '{}'::uuid[]);
  v_unknown uuid[];
  v_count integer;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select e.created_by, e.ends_at, e.cancelled_at
  into v_host, v_ends_at, v_cancelled
  from public.events e
  where e.id = p_event_id;

  if v_host is null then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  if v_host is distinct from v_user then
    raise exception 'Only the host can confirm who played' using errcode = '42501';
  end if;

  if v_cancelled is not null then
    raise exception 'This session was cancelled' using errcode = '22023';
  end if;

  if v_ends_at > now() then
    raise exception 'Wait until the session is over' using errcode = '22023';
  end if;

  -- Catches a stale client sending someone who is no longer on the roster.
  select coalesce(array_agg(candidate), '{}'::uuid[])
  into v_unknown
  from unnest(v_attended) as candidate
  where not exists (
    select 1
    from public.event_rsvps r
    where r.event_id = p_event_id
      and r.user_id = candidate
      and r.status <> 'not_going'
  );

  if cardinality(v_unknown) > 0 then
    raise exception 'Those players are not on this roster' using errcode = '22023';
  end if;

  perform set_config('pickleballcx.allow_attendance_change', 'on', true);

  update public.event_rsvps r
  set attended = (r.user_id = any (v_attended))
  where r.event_id = p_event_id
    and r.status <> 'not_going';

  perform set_config('pickleballcx.allow_attendance_change', 'off', true);

  perform set_config('pickleballcx.allow_event_bookkeeping', 'on', true);

  update public.events
  set attendance_confirmed_at = now()
  where id = p_event_id;

  perform set_config('pickleballcx.allow_event_bookkeeping', 'off', true);

  select count(*)
  into v_count
  from public.event_rsvps r
  where r.event_id = p_event_id
    and r.attended;

  return v_count;
end;
$$;

revoke all on function public.confirm_attendance(uuid, uuid[]) from public;
revoke all on function public.confirm_attendance(uuid, uuid[]) from anon;
grant execute on function public.confirm_attendance(uuid, uuid[]) to authenticated;

comment on function public.confirm_attendance is
  'Host-only. Marks the named players present and everyone else on the roster absent. Returns how many played.';

-- The roster RPC gains attendance so the host can see what they already confirmed.
-- Return type changes, so it has to be dropped rather than replaced.
drop function if exists public.event_attendees(uuid);

create function public.event_attendees(p_event_id uuid)
returns table (
  user_id uuid,
  status public.rsvp_status,
  display_name text,
  avatar_url text,
  skill_level public.skill_level,
  attended boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.user_id,
    r.status,
    p.display_name,
    p.avatar_url,
    p.skill_level,
    r.attended
  from public.event_rsvps r
  join public.profiles p on p.id = r.user_id
  where r.event_id = p_event_id
    -- This bypasses RLS, so it has to re-check both authentication and access.
    and (select auth.uid()) is not null
    and private.can_access_event(p_event_id)
  order by r.created_at asc;
$$;

revoke all on function public.event_attendees(uuid) from public;
revoke all on function public.event_attendees(uuid) from anon;
grant execute on function public.event_attendees(uuid) to authenticated;

create table if not exists public.session_feedback (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  court_note text check (court_note is null or char_length(court_note) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

comment on table public.session_feedback is
  'One rating per player per session. Written only through submit_session_feedback.';

-- The primary key covers lookups by event; this covers the other direction and the
-- foreign key on user_id.
create index if not exists session_feedback_user_id_idx
  on public.session_feedback (user_id);

drop trigger if exists session_feedback_set_updated_at on public.session_feedback;

create trigger session_feedback_set_updated_at
  before update on public.session_feedback
  for each row
  execute function public.set_updated_at();

alter table public.session_feedback enable row level security;

-- Players see their own rating and nothing else. Hosts deliberately cannot read
-- individual ratings of their own sessions; anonymity is what keeps them honest.
create policy session_feedback_select_own
  on public.session_feedback
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No insert, update or delete policy: submit_session_feedback is the only writer.

create or replace function public.submit_session_feedback(
  p_event_id uuid,
  p_rating integer,
  p_court_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_ends_at timestamptz;
  v_cancelled timestamptz;
  v_confirmed timestamptz;
  v_note text := nullif(btrim(coalesce(p_court_note, '')), '');
  v_status public.rsvp_status;
  v_attended boolean;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Pick a rating from 1 to 5' using errcode = '22023';
  end if;

  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'Keep the note to 500 characters or less' using errcode = '22023';
  end if;

  select e.ends_at, e.cancelled_at, e.attendance_confirmed_at
  into v_ends_at, v_cancelled, v_confirmed
  from public.events e
  where e.id = p_event_id;

  if v_ends_at is null then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  if v_cancelled is not null then
    raise exception 'This session was cancelled' using errcode = '22023';
  end if;

  if v_ends_at > now() then
    raise exception 'You can rate a session once it is over' using errcode = '22023';
  end if;

  select r.status, r.attended
  into v_status, v_attended
  from public.event_rsvps r
  where r.event_id = p_event_id
    and r.user_id = v_user;

  if v_status is null then
    raise exception 'Only players who joined this session can rate it' using errcode = '42501';
  end if;

  -- A confirmed no-show cannot rate a game they missed. Before the host confirms,
  -- anyone who said they were going may rate, so an idle host does not silence everyone.
  if v_attended is false then
    raise exception 'You were marked as not having played this session' using errcode = '42501';
  end if;

  if v_attended is null and v_status <> 'going' then
    raise exception 'Only players who joined this session can rate it' using errcode = '42501';
  end if;

  insert into public.session_feedback (event_id, user_id, rating, court_note)
  values (p_event_id, v_user, p_rating, v_note)
  on conflict (event_id, user_id) do update
  set rating = excluded.rating,
      court_note = excluded.court_note;
end;
$$;

revoke all on function public.submit_session_feedback(uuid, integer, text) from public;
revoke all on function public.submit_session_feedback(uuid, integer, text) from anon;
grant execute on function public.submit_session_feedback(uuid, integer, text) to authenticated;

comment on function public.submit_session_feedback is
  'Rate a finished session you played in, 1 to 5, with an optional court note. Re-submitting replaces your rating.';

create or replace function private.send_post_session_prompts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event record;
  v_players uuid[];
  v_court text;
  v_sent integer := 0;
begin
  for v_event in
    select e.id, e.created_by
    from public.events e
    where e.cancelled_at is null
      and e.post_session_prompt_sent_at is null
      and e.ends_at <= now() - interval '1 hour'
      -- A session that ended weeks ago is not worth prompting about, and this stops a
      -- long outage from producing a flood.
      and e.ends_at > now() - interval '3 days'
    order by e.ends_at
    limit 200
    for update skip locked
  loop
    v_court := private.event_court_label(v_event.id);

    select coalesce(array_agg(r.user_id), '{}'::uuid[])
    into v_players
    from public.event_rsvps r
    where r.event_id = v_event.id
      and r.status = 'going'
      and r.user_id <> v_event.created_by;

    -- The host has a different job from everyone else: say who actually played.
    perform private.insert_session_notifications(
      array[v_event.created_by],
      'post_session',
      'How did it go?',
      'Confirm who played at ' || v_court || ' and rate the session',
      v_event.id
    );

    if cardinality(v_players) > 0 then
      perform private.insert_session_notifications(
        v_players,
        'post_session',
        'How did it go?',
        'Rate your session at ' || v_court,
        v_event.id
      );
    end if;

    perform private.dispatch_notification(
      jsonb_build_object(
        'table', 'events',
        'type', 'POST_SESSION',
        'record', to_jsonb((select e from public.events e where e.id = v_event.id)),
        'recipient_ids', to_jsonb(v_players || v_event.created_by)
      )
    );

    perform set_config('pickleballcx.allow_event_bookkeeping', 'on', true);

    update public.events
    set post_session_prompt_sent_at = now()
    where id = v_event.id;

    perform set_config('pickleballcx.allow_event_bookkeeping', 'off', true);

    v_sent := v_sent + 1;
  end loop;

  return v_sent;
end;
$$;

revoke all on function private.send_post_session_prompts() from public;
revoke all on function private.send_post_session_prompts() from anon;
revoke all on function private.send_post_session_prompts() from authenticated;

comment on function private.send_post_session_prompts is
  'Asks the host to confirm attendance and players to rate the session, an hour after it ends. Run by the send-post-session-prompts cron job.';

-- Offset from the reminder job so the two are not competing every quarter hour.
select cron.schedule(
  'send-post-session-prompts',
  '5,20,35,50 * * * *',
  $$select private.send_post_session_prompts()$$
);
