-- Scoping the ends_at trigger to "update of starts_at, duration_minutes" left a
-- hole: an update touching only ends_at never fired it, so a host could PATCH
-- ends_at directly and keep a finished session alive in the feed and in the events
-- RLS policy indefinitely. Recompute on every update instead.
drop trigger if exists events_set_ends_at on public.events;

create trigger events_set_ends_at
  before insert or update on public.events
  for each row
  execute function private.set_event_ends_at();
