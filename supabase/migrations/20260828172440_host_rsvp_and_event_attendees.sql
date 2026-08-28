-- Two trust fixes for the RSVP flow.
--
-- 1. The host was never on their own roster, so a brand new session read "0 going"
--    and the person who created it was missing from the attendee list.
-- 2. Rosters are read by joining event_rsvps to profiles, which is now gated by
--    profiles_select_visible (co-attendance). A player browsing a session they have
--    not joined could see the headcount but none of the names. event_attendees
--    returns the roster with only display fields, so browsing works without
--    widening access to public.profiles, which also holds phone.

-- 1. Host auto-RSVP.
--
-- SECURITY DEFINER because the insert happens inside the event insert, before the
-- host could satisfy any RSVP policy themselves. notify_on_event_rsvp_change
-- returns early when the actor is the host, so this sends no notification.
create or replace function private.rsvp_host_on_event_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.event_rsvps (event_id, user_id, status)
  values (new.id, new.created_by, 'going')
  on conflict (event_id, user_id) do nothing;

  return null;
end;
$$;

revoke all on function private.rsvp_host_on_event_insert() from public;

drop trigger if exists events_rsvp_host on public.events;

create trigger events_rsvp_host
  after insert on public.events
  for each row
  execute function private.rsvp_host_on_event_insert();

-- Backfill existing sessions, past ones included, so attendance history is
-- consistent once it starts being tracked.
insert into public.event_rsvps (event_id, user_id, status)
select e.id, e.created_by, 'going'
from public.events e
on conflict (event_id, user_id) do nothing;

-- 2. Roster RPC.
create or replace function public.event_attendees(p_event_id uuid)
returns table (
  user_id uuid,
  status public.rsvp_status,
  display_name text,
  avatar_url text,
  skill_level public.skill_level
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
    p.skill_level
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

comment on function public.event_attendees is
  'Roster for a session the caller can access: RSVP status plus display-only profile fields. SECURITY DEFINER so a player browsing a session they have not joined still sees names.';
