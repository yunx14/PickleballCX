-- Deleting a session failed with "user_notifications updates may only set read_at"
-- as soon as any notification referenced it, which is almost immediately since
-- RSVPs, comments and edits all create one. The cause is user_notifications.event_id
-- being ON DELETE SET NULL: the delete cascades into an update that the guard trigger
-- rejects. The guard now allows event_id to be cleared, which is the only transition
-- the foreign key performs, while still refusing to let it be repointed at another
-- session.
create or replace function private.user_notifications_guard_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.type is distinct from old.type
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.created_at is distinct from old.created_at
    -- Clearing the link is allowed; pointing it somewhere else is not.
    or (new.event_id is distinct from old.event_id and new.event_id is not null)
  then
    raise exception 'user_notifications updates may only set read_at';
  end if;

  return new;
end;
$$;
