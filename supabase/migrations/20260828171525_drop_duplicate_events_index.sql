-- events_starts_at_idx already covers (starts_at); the unconditional index added
-- when the group/visibility partial predicates were removed duplicates it.
drop index if exists public.events_upcoming_idx;
