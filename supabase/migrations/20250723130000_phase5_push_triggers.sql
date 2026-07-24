-- Phase 5: database triggers that call the dispatch-notification Edge Function via pg_net.

create extension if not exists pg_net with schema extensions;

create table if not exists private.notification_dispatch (
  id int primary key default 1 check (id = 1),
  webhook_secret text not null default '',
  functions_base_url text not null default 'https://emdafxfzuutjrdusrvlg.supabase.co/functions/v1'
);

insert into private.notification_dispatch (id, webhook_secret, functions_base_url)
values (1, '', 'https://emdafxfzuutjrdusrvlg.supabase.co/functions/v1')
on conflict (id) do nothing;

revoke all on private.notification_dispatch from public, anon, authenticated;

create or replace function private.dispatch_notification(payload jsonb)
returns void
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  settings private.notification_dispatch;
  request_id bigint;
begin
  select * into settings from private.notification_dispatch where id = 1;

  if settings.webhook_secret is null or settings.webhook_secret = '' then
    return;
  end if;

  select net.http_post(
    url := settings.functions_base_url || '/dispatch-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', settings.webhook_secret
    ),
    body := payload
  ) into request_id;
end;
$$;

revoke all on function private.dispatch_notification(jsonb) from public;
grant execute on function private.dispatch_notification(jsonb) to postgres, service_role;

create or replace function private.notify_on_event_insert()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'events',
      'type', 'INSERT',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

create or replace function private.notify_on_event_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'event_comments',
      'type', 'INSERT',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

create or replace function private.notify_on_group_announcement_insert()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'group_announcements',
      'type', 'INSERT',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists events_notify_insert on public.events;
create trigger events_notify_insert
  after insert on public.events
  for each row execute function private.notify_on_event_insert();

drop trigger if exists event_comments_notify_insert on public.event_comments;
create trigger event_comments_notify_insert
  after insert on public.event_comments
  for each row execute function private.notify_on_event_comment_insert();

drop trigger if exists group_announcements_notify_insert on public.group_announcements;
create trigger group_announcements_notify_insert
  after insert on public.group_announcements
  for each row execute function private.notify_on_group_announcement_insert();
