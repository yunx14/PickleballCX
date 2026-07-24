-- Phase C: 1:1 messaging and session invites after match connect

create type public.session_invite_status as enum ('pending', 'accepted', 'declined');

create table public.player_conversations (
  id uuid primary key default gen_random_uuid(),
  match_request_id uuid not null unique references public.match_requests (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.player_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.player_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index player_messages_conversation_created_idx
  on public.player_messages (conversation_id, created_at asc);

create table public.session_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  invited_user_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  status public.session_invite_status not null default 'pending',
  message text check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint session_invites_not_self check (invited_user_id <> invited_by)
);

create index session_invites_invited_user_pending_idx
  on public.session_invites (invited_user_id, created_at desc)
  where status = 'pending';

create unique index session_invites_one_pending_event_user_idx
  on public.session_invites (event_id, invited_user_id)
  where status = 'pending';

create or replace function private.are_connected_players(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.match_requests mr
    where mr.status = 'accepted'
      and (
        (mr.from_user_id = user_a and mr.to_user_id = user_b)
        or (mr.from_user_id = user_b and mr.to_user_id = user_a)
      )
  );
$$;

create or replace function private.is_player_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.player_conversations pc
    join public.match_requests mr on mr.id = pc.match_request_id
    where pc.id = target_conversation_id
      and mr.status = 'accepted'
      and (
        mr.from_user_id = (select auth.uid())
        or mr.to_user_id = (select auth.uid())
      )
  );
$$;

create or replace function private.is_match_request_participant(target_match_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.match_requests mr
    where mr.id = target_match_request_id
      and mr.status = 'accepted'
      and (
        mr.from_user_id = (select auth.uid())
        or mr.to_user_id = (select auth.uid())
      )
  );
$$;

create or replace function private.can_send_session_invite(p_event_id uuid, p_invited_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.starts_at > now()
      and e.created_by = (select auth.uid())
  )
  and private.are_connected_players((select auth.uid()), p_invited_user_id);
$$;

revoke all on function private.are_connected_players(uuid, uuid) from public;
revoke all on function private.is_player_conversation_participant(uuid) from public;
revoke all on function private.is_match_request_participant(uuid) from public;
revoke all on function private.can_send_session_invite(uuid, uuid) from public;

grant execute on function private.are_connected_players(uuid, uuid) to authenticated;
grant execute on function private.is_player_conversation_participant(uuid) to authenticated;
grant execute on function private.is_match_request_participant(uuid) to authenticated;
grant execute on function private.can_send_session_invite(uuid, uuid) to authenticated;

-- Invited players can open group-private sessions they were invited to.
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
          from public.session_invites si
          where si.event_id = e.id
            and si.invited_user_id = (select auth.uid())
            and si.status in ('pending', 'accepted')
        )
      )
  );
$$;

create or replace function private.ensure_player_conversation_on_match_accept()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if NEW.status = 'accepted' and OLD.status = 'pending' then
    insert into public.player_conversations (match_request_id)
    values (NEW.id)
    on conflict (match_request_id) do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists match_requests_create_conversation on public.match_requests;
create trigger match_requests_create_conversation
  after update on public.match_requests
  for each row execute function private.ensure_player_conversation_on_match_accept();

-- Backfill conversations for matches accepted before this migration.
insert into public.player_conversations (match_request_id)
select mr.id
from public.match_requests mr
where mr.status = 'accepted'
on conflict (match_request_id) do nothing;

alter table public.player_conversations enable row level security;
alter table public.player_messages enable row level security;
alter table public.session_invites enable row level security;

alter table public.player_conversations force row level security;
alter table public.player_messages force row level security;
alter table public.session_invites force row level security;

grant select on public.player_conversations to authenticated;
grant select, insert on public.player_messages to authenticated;
grant select, insert, update on public.session_invites to authenticated;

create policy "player_conversations_select_participant"
  on public.player_conversations for select
  to authenticated
  using (private.is_player_conversation_participant(id));

create policy "player_messages_select_participant"
  on public.player_messages for select
  to authenticated
  using (private.is_player_conversation_participant(conversation_id));

create policy "player_messages_insert_sender"
  on public.player_messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_player_conversation_participant(conversation_id)
  );

create policy "session_invites_select_participant"
  on public.session_invites for select
  to authenticated
  using (
    invited_user_id = (select auth.uid())
    or invited_by = (select auth.uid())
  );

create policy "session_invites_insert_host"
  on public.session_invites for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and invited_user_id <> (select auth.uid())
    and status = 'pending'
    and private.can_send_session_invite(event_id, invited_user_id)
  );

create policy "session_invites_update_invitee"
  on public.session_invites for update
  to authenticated
  using (
    invited_user_id = (select auth.uid())
    and status = 'pending'
  )
  with check (
    invited_user_id = (select auth.uid())
    and status in ('accepted', 'declined')
    and responded_at is not null
  );

create policy "session_invites_cancel_host"
  on public.session_invites for update
  to authenticated
  using (
    invited_by = (select auth.uid())
    and status = 'pending'
  )
  with check (
    invited_by = (select auth.uid())
    and status = 'declined'
    and responded_at is not null
  );

alter publication supabase_realtime add table public.player_messages;
alter publication supabase_realtime add table public.session_invites;

create or replace function private.notify_on_player_message_insert()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'player_messages',
      'type', 'INSERT',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

create or replace function private.notify_on_session_invite_insert()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  perform private.dispatch_notification(
    jsonb_build_object(
      'table', 'session_invites',
      'type', 'INSERT',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists player_messages_notify_insert on public.player_messages;
create trigger player_messages_notify_insert
  after insert on public.player_messages
  for each row execute function private.notify_on_player_message_insert();

drop trigger if exists session_invites_notify_insert on public.session_invites;
create trigger session_invites_notify_insert
  after insert on public.session_invites
  for each row execute function private.notify_on_session_invite_insert();
