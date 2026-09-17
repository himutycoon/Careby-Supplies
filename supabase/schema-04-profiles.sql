-- Run this once in the Supabase SQL Editor, after schema-03-narrative.sql.
-- Adds a profiles table for the homeowner/contractor role split introduced
-- by the expanded CareBy scope. One row per auth user, created automatically
-- by a trigger the moment the auth.users row is inserted (before email
-- confirmation completes), reading the role/full_name captured at signup.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'homeowner'
    check (role in ('homeowner', 'contractor')),
  full_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row the moment a new auth user is created, reading
-- the role and full name passed through as signup metadata. security
-- definer so it can write despite the caller having no session yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'homeowner'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users created before this migration existed (safe no-op if a
-- profile row already exists for them).
insert into public.profiles (id, role, full_name)
select id, 'homeowner', coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;
