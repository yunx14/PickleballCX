-- Past games: RSVP'd players can still select events after starts_at.
-- In-app inbox: public.user_notifications written by private SECURITY DEFINER triggers.

-- ---------------------------------------------------------------------------
-- Event access: keep past sessions visible to people who RSVP'd
-- ---------------------------------------------------------------------------
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
        or (e.group_id is null and e.visibility = 'public' and e.starts_at > now())
        or exists (
          select 1
          from public.event_rsvps r
          where r.event_id = e.id
            and r.user_id = (select auth.uid())
            and r.status in ('going', 'maybe', 'waitlist')
        )
        or exists (
          select 1
          from public.session_invites si
          where si.event_id = e.id
            and si.invited_user_id = (select auth.uid())
            and si.status in ('pending', 'accepted')
        )
      )
  );
$$;

drop policy if exists "events_select_accessible" on public.events;

create policy "events_select_accessible"
  on public.events for select
  to authenticated
  using (private.can_access_event(id));

-- ---------------------------------------------------------------------------
-- Inbox table
-- ---------------------------------------------------------------------------
create type public.user_notification_type as enum (
  'comment',
  'rsvp',
  'event_updated',
  'event_cancelled'
);

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.user_notification_type not null,
  title text not null,
  body text not null default '',
  event_id uuid references public.events (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index user_notifications_user_id_created_at_idx
  on public.user_notifications (user_id, created_at desc);

create index user_notifications_unread_user_id_idx
  on public.user_notifications (user_id)
  where read_at is null;

create index user_notifications_event_id_idx
  on public.user_notifications (event_id)
  where event_id is not null;

alter table public.user_notifications enable row level security;
alter table public.user_notifications force row level security;

grant select, update on public.user_notifications to authenticated;
grant select, insert, update, delete on public.user_notifications to service_role;
grant usage on type public.user_notification_type to authenticated;
revoke all on public.user_notifications from anon;
revoke insert, delete on public.user_notifications from authenticated;

create policy "user_notifications_select_own"
  on public.user_notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_notifications_update_own"
  on public.user_notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function private.user_notifications_guard_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.user_id is distinct from OLD.user_id
    or NEW.type is distinct from OLD.type
    or NEW.title is distinct from OLD.title
    or NEW.body is distinct from OLD.body
    or NEW.event_id is distinct from OLD.event_id
    or NEW.created_at is distinct from OLD.created_at
  then
    raise exception 'user_notifications updates may only set read_at';
  end if;
  return NEW;
end;
$$;

revoke all on function private.user_notifications_guard_update() from public;

create trigger user_notifications_guard_update
  before update on public.user_notifications
  for each row execute function private.user_notifications_guard_update();

-- ---------------------------------------------------------------------------
-- Inbox helpers (private; not client-callable)
-- ---------------------------------------------------------------------------
create or replace function private.event_court_label(p_event_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select nullif(btrim(c.name), '')
      from public.events e
      join public.courts c on c.id = e.court_id
      where e.id = p_event_id
    ),
    'a session'
  );
$$;

create or replace function private.clip_notification_body(p_body text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when length(btrim(coalesce(p_body, ''))) > 80
      then left(btrim(p_body), 77) || '…'
    else btrim(coalesce(p_body, ''))
  end;
$$;

create or replace function private.session_activity_recipient_ids(
  p_event_id uuid,
  p_exclude_user_id uuid
)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct uid), '{}'::uuid[])
  from (
    select e.created_by as uid
    from public.events e
    where e.id = p_event_id
      and e.created_by is distinct from p_exclude_user_id
    union
    select r.user_id
    from public.event_rsvps r
    where r.event_id = p_event_id
      and r.status in ('going', 'maybe', 'waitlist')
      and r.user_id is distinct from p_exclude_user_id
  ) recipients;
$$;

create or replace function private.insert_session_notifications(
  p_user_ids uuid[],
  p_type public.user_notification_type,
  p_title text,
  p_body text,
  p_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_ids is null or cardinality(p_user_ids) = 0 then
    return;
  end if;

  insert into public.user_notifications (user_id, type, title, body, event_id)
  select distinct uid, p_type, p_title, p_body, p_event_id
  from unnest(p_user_ids) as uid
  where uid is not null;
end;
$$;

revoke all on function private.event_court_label(uuid) from public;
revoke all on function private.clip_notification_body(text) from public;
revoke all on function private.session_activity_recipient_ids(uuid, uuid) from public;
revoke all on function private.insert_session_notifications(uuid[], public.user_notification_type, text, text, uuid) from public;

grant execute on function private.event_court_label(uuid) to postgres, service_role;
grant execute on function private.clip_notification_body(text) to postgres, service_role;
grant execute on function private.session_activity_recipient_ids(uuid, uuid) to postgres, service_role;
grant execute on function private.insert_session_notifications(uuid[], public.user_notification_type, text, text, uuid) to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Triggers: write inbox rows and keep Expo push in sync
-- ---------------------------------------------------------------------------
create or replace function private.notify_on_event_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  recipients uuid[];
  court_label text;
  preview text;
begin
  recipients := private.session_activity_recipient_ids(NEW.event_id, NEW.user_id);
  court_label := private.event_court_label(NEW.event_id);
  preview := private.clip_notification_body(NEW.body);

  perform private.insert_session_notifications(
    recipients,
    'comment',
    'New comment',
    court_label || ': ' || preview,
    NEW.event_id
  );

  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'event_comments',
      'type', 'INSERT',
      'record', to_jsonb(NEW),
      'recipient_ids', to_jsonb(recipients)
    )
  );
  return NEW;
end;
$$;

create or replace function private.notify_on_event_rsvp_change()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  host_id uuid;
  actor_name text;
  court_label text;
  status_label text;
  recipients uuid[];
begin
  if TG_OP = 'UPDATE' and OLD.status is not distinct from NEW.status then
    return NEW;
  end if;

  select e.created_by into host_id
  from public.events e
  where e.id = NEW.event_id;

  if host_id is null or host_id is not distinct from NEW.user_id then
    return NEW;
  end if;

  recipients := array[host_id];
  court_label := private.event_court_label(NEW.event_id);

  select coalesce(nullif(btrim(p.display_name), ''), 'A player')
  into actor_name
  from public.profiles p
  where p.id = NEW.user_id;

  status_label := case NEW.status
    when 'going' then 'going'
    when 'maybe' then 'maybe'
    when 'waitlist' then 'waitlisted'
    when 'not_going' then 'not going'
    else NEW.status::text
  end;

  perform private.insert_session_notifications(
    recipients,
    'rsvp',
    'New RSVP',
    actor_name || ' marked ' || status_label || ' · ' || court_label,
    NEW.event_id
  );

  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'event_rsvps',
      'type', TG_OP,
      'record', to_jsonb(NEW),
      'recipient_ids', to_jsonb(recipients)
    )
  );
  return NEW;
end;
$$;

create or replace function private.notify_on_event_update()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  actor uuid := (select auth.uid());
  recipients uuid[];
  court_label text;
begin
  recipients := private.session_activity_recipient_ids(NEW.id, actor);
  court_label := private.event_court_label(NEW.id);

  perform private.insert_session_notifications(
    recipients,
    'event_updated',
    'Session updated',
    court_label || ' was updated',
    NEW.id
  );

  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'events',
      'type', 'UPDATE',
      'record', to_jsonb(NEW),
      'recipient_ids', to_jsonb(recipients)
    )
  );
  return NEW;
end;
$$;

create or replace function private.notify_on_event_delete()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  actor uuid := (select auth.uid());
  recipients uuid[];
  court_label text;
begin
  recipients := private.session_activity_recipient_ids(OLD.id, actor);
  court_label := private.event_court_label(OLD.id);

  perform private.insert_session_notifications(
    recipients,
    'event_cancelled',
    'Session cancelled',
    court_label || ' was cancelled',
    OLD.id
  );

  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'events',
      'type', 'DELETE',
      'record', to_jsonb(OLD),
      'recipient_ids', to_jsonb(recipients)
    )
  );
  return OLD;
end;
$$;

revoke all on function private.notify_on_event_rsvp_change() from public;
revoke all on function private.notify_on_event_update() from public;
revoke all on function private.notify_on_event_delete() from public;

drop trigger if exists event_rsvps_notify_change on public.event_rsvps;
create trigger event_rsvps_notify_change
  after insert or update on public.event_rsvps
  for each row execute function private.notify_on_event_rsvp_change();

drop trigger if exists events_notify_update on public.events;
create trigger events_notify_update
  after update on public.events
  for each row
  when (
    OLD.court_id is distinct from NEW.court_id
    or OLD.starts_at is distinct from NEW.starts_at
    or OLD.max_players is distinct from NEW.max_players
    or OLD.session_type is distinct from NEW.session_type
    or OLD.skill_min is distinct from NEW.skill_min
    or OLD.skill_max is distinct from NEW.skill_max
    or OLD.description is distinct from NEW.description
    or OLD.visibility is distinct from NEW.visibility
  )
  execute function private.notify_on_event_update();

drop trigger if exists events_notify_delete on public.events;
create trigger events_notify_delete
  before delete on public.events
  for each row execute function private.notify_on_event_delete();
