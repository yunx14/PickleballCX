-- Two gaps in the run-up to a session:
--
-- 1. Nobody was reminded. A player RSVPd days ahead and then had to remember on
--    their own, which is how a four-person game turns into two people waiting.
-- 2. A host had no way to reach the people who had signed up. Any change of plan
--    short of cancelling ("running 10 minutes late", "bring a spare net") had
--    nowhere to go.

alter table public.events
  add column reminder_sent_at timestamptz,
  add column last_broadcast_at timestamptz;

comment on column public.events.reminder_sent_at is
  'Set once the starting-soon reminder has gone out, so the cron job never sends twice.';

-- Finds the sessions that need a reminder. Partial index because the vast majority
-- of rows are already reminded or in the past.
create index if not exists events_pending_reminder_idx
  on public.events (starts_at)
  where reminder_sent_at is null and cancelled_at is null;

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
    -- If a run overtakes the previous one, the second run skips rows already
    -- being handled rather than sending a duplicate reminder.
    for update skip locked
  loop
    select coalesce(array_agg(r.user_id), '{}'::uuid[])
    into v_recipients
    from public.event_rsvps r
    where r.event_id = v_event.id
      and r.status in ('going', 'maybe');

    v_minutes := greatest(1, round(extract(epoch from (v_event.starts_at - now())) / 60))::integer;

    -- Deliberately relative rather than a clock time: the job runs in UTC and has
    -- no idea what time zone each player is in.
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

    update public.events
    set reminder_sent_at = now()
    where id = v_event.id;

    v_sent := v_sent + 1;
  end loop;

  return v_sent;
end;
$$;

revoke all on function private.send_session_reminders() from public;
revoke all on function private.send_session_reminders() from anon;
revoke all on function private.send_session_reminders() from authenticated;

comment on function private.send_session_reminders is
  'Sends the starting-soon reminder for sessions beginning within 90 minutes. Run by the send-session-reminders cron job; not callable by app roles.';

-- Editing the start time should let the reminder fire again for the new time.
create or replace function private.reset_reminder_on_reschedule()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.starts_at is distinct from old.starts_at then
    new.reminder_sent_at := null;
  end if;

  return new;
end;
$$;

revoke all on function private.reset_reminder_on_reschedule() from public;

drop trigger if exists events_reset_reminder on public.events;

create trigger events_reset_reminder
  before update of starts_at on public.events
  for each row
  execute function private.reset_reminder_on_reschedule();

create extension if not exists pg_cron;

-- Every 15 minutes, so a reminder lands between 75 and 90 minutes before the start.
select cron.schedule(
  'send-session-reminders',
  '*/15 * * * *',
  $$select private.send_session_reminders()$$
);

-- Host broadcast: reaches everyone on the roster without exposing their identities
-- or handing the host a general-purpose messaging channel.
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

  -- Cheap throttle so a stuck client cannot spam everyone's phone.
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

  update public.events
  set last_broadcast_at = now()
  where id = p_event_id;

  return cardinality(v_recipients);
end;
$$;

revoke all on function public.broadcast_to_attendees(uuid, text) from public;
revoke all on function public.broadcast_to_attendees(uuid, text) from anon;
grant execute on function public.broadcast_to_attendees(uuid, text) to authenticated;

comment on function public.broadcast_to_attendees is
  'Host-only message to everyone on the roster of an upcoming session. Returns the recipient count. Throttled to one message per minute per session.';
