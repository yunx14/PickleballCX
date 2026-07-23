-- Reliable profile setup that bypasses RLS edge cases
create or replace function public.complete_profile_setup(
  p_display_name text,
  p_skill_level public.skill_level
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(trim(p_display_name)) < 2 then
    raise exception 'Display name must be at least 2 characters';
  end if;

  insert into public.profiles (id, display_name, skill_level)
  values (auth.uid(), trim(p_display_name), p_skill_level)
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    skill_level = excluded.skill_level,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

grant execute on function public.complete_profile_setup(text, public.skill_level) to authenticated;
