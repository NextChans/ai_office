-- AI Office — Supabase schema
-- Run this in the Supabase SQL editor after creating a project.
-- It stores each user's office state as a single JSONB row, secured by RLS so
-- a user can only read/write their own row.

create table if not exists public.office_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.office_state enable row level security;

drop policy if exists "own state - select" on public.office_state;
create policy "own state - select"
  on public.office_state for select
  using (auth.uid() = user_id);

drop policy if exists "own state - insert" on public.office_state;
create policy "own state - insert"
  on public.office_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "own state - update" on public.office_state;
create policy "own state - update"
  on public.office_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh on writes.
create or replace function public.touch_office_state()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_office_state on public.office_state;
create trigger trg_touch_office_state
  before update on public.office_state
  for each row execute function public.touch_office_state();
