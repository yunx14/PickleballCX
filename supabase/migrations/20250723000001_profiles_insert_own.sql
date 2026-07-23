-- Allow users to create their own profile row if the signup trigger did not run
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);
