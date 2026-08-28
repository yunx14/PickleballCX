-- INSERT ... RETURNING evaluates SELECT policies on the new row. private.can_access_event(id)
-- re-reads public.events, but that inner query cannot see the row being inserted yet, so
-- PostgREST reports "new row violates row-level security policy" even though the insert is valid.

drop policy if exists "events_select_accessible" on public.events;

create policy "events_select_accessible"
  on public.events for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or (group_id is not null and private.is_group_member(group_id))
    or (group_id is null and visibility = 'public' and starts_at > now())
    or exists (
      select 1
      from public.event_rsvps r
      where r.event_id = events.id
        and r.user_id = (select auth.uid())
        and r.status in ('going', 'maybe', 'waitlist')
    )
    or exists (
      select 1
      from public.session_invites si
      where si.event_id = events.id
        and si.invited_user_id = (select auth.uid())
        and si.status in ('pending', 'accepted')
    )
  );
