-- Phase 4: comments access for public sessions, push tokens, realtime

-- Allow anyone who can access an event to comment (includes public open play).
drop policy if exists "event_comments_insert_member" on public.event_comments;

create policy "event_comments_insert_accessible"
  on public.event_comments for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and private.can_access_event(event_id)
  );

-- Push notification device tokens (sending handled by Edge Function + Expo Push API).
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

create trigger push_tokens_set_updated_at before update on public.push_tokens
  for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;
alter table public.push_tokens force row level security;

grant select, insert, update, delete on public.push_tokens to authenticated;

create policy "push_tokens_select_own"
  on public.push_tokens for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "push_tokens_insert_own"
  on public.push_tokens for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "push_tokens_update_own"
  on public.push_tokens for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "push_tokens_delete_own"
  on public.push_tokens for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Realtime for live comment and announcement updates.
alter publication supabase_realtime add table public.event_comments;
alter publication supabase_realtime add table public.group_announcements;
