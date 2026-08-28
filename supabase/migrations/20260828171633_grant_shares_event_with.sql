-- RLS policy expressions execute as the calling role, so a helper used inside
-- profiles_select_visible needs EXECUTE for authenticated or every profile read
-- fails with "permission denied for function". This mirrors the existing grant on
-- private.can_access_event.
grant execute on function private.shares_event_with(uuid) to authenticated;
