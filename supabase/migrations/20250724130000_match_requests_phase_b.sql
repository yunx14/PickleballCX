-- Phase B: match requests between discoverable players

create type public.match_request_status as enum ('pending', 'accepted', 'declined');

create table public.match_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status public.match_request_status not null default 'pending',
  message text check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint match_requests_not_self check (from_user_id <> to_user_id)
);

create index match_requests_to_user_pending_idx
  on public.match_requests (to_user_id, created_at desc)
  where status = 'pending';

create index match_requests_from_user_idx
  on public.match_requests (from_user_id, created_at desc);

create unique index match_requests_one_pending_pair_idx
  on public.match_requests (
    least(from_user_id, to_user_id),
    greatest(from_user_id, to_user_id)
  )
  where status = 'pending';

-- Allow reading display names of users you have match activity with.
drop policy if exists "profiles_select_visible" on public.profiles;

create policy "profiles_select_visible"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or profile_visibility = 'public'
    or private.shares_group_with(id)
    or exists (
      select 1
      from public.match_requests mr
      where (
        mr.from_user_id = (select auth.uid()) and mr.to_user_id = profiles.id
      ) or (
        mr.to_user_id = (select auth.uid()) and mr.from_user_id = profiles.id
      )
    )
  );

alter table public.match_requests enable row level security;
alter table public.match_requests force row level security;

grant select, insert, update on public.match_requests to authenticated;

create policy "match_requests_select_participant"
  on public.match_requests for select
  to authenticated
  using (
    from_user_id = (select auth.uid())
    or to_user_id = (select auth.uid())
  );

create policy "match_requests_insert_sender"
  on public.match_requests for insert
  to authenticated
  with check (
    from_user_id = (select auth.uid())
    and to_user_id <> (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.profiles p
      where p.id = to_user_id
        and p.discovery_enabled = true
        and p.skill_level is not null
    )
    and exists (
      select 1
      from public.profiles sender
      where sender.id = (select auth.uid())
        and sender.discovery_enabled = true
        and sender.skill_level is not null
    )
  );

create policy "match_requests_update_recipient"
  on public.match_requests for update
  to authenticated
  using (
    to_user_id = (select auth.uid())
    and status = 'pending'
  )
  with check (
    to_user_id = (select auth.uid())
    and status in ('accepted', 'declined')
    and responded_at is not null
  );

create policy "match_requests_cancel_sender"
  on public.match_requests for update
  to authenticated
  using (
    from_user_id = (select auth.uid())
    and status = 'pending'
  )
  with check (
    from_user_id = (select auth.uid())
    and status = 'declined'
    and responded_at is not null
  );

-- Push: notify recipient on new request; notify sender when accepted.
create or replace function private.notify_on_match_request_insert()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'match_requests',
      'type', 'INSERT',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

create or replace function private.notify_on_match_request_update()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if NEW.status = 'accepted' and OLD.status = 'pending' then
    perform private.dispatch_notification(
      jsonb_build_object(
        'table', 'match_requests',
        'type', 'UPDATE',
        'record', to_jsonb(NEW)
      )
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists match_requests_notify_insert on public.match_requests;
create trigger match_requests_notify_insert
  after insert on public.match_requests
  for each row execute function private.notify_on_match_request_insert();

drop trigger if exists match_requests_notify_update on public.match_requests;
create trigger match_requests_notify_update
  after update on public.match_requests
  for each row execute function private.notify_on_match_request_update();
