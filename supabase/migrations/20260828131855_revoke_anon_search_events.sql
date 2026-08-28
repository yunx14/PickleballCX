-- Default privileges grant EXECUTE on new public functions to anon, and
-- `revoke ... from public` does not remove that explicit grant. search_events is
-- SECURITY DEFINER, so revoke anon directly; only signed-in users may search.
revoke all on function public.search_events(
  double precision,
  double precision,
  double precision,
  text,
  public.skill_level,
  public.session_type,
  timestamptz,
  uuid,
  integer
) from anon;
