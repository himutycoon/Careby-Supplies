-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Creates the submissions table + a private storage bucket for uploaded
-- renovation photos, both scoped to the owning user via RLS.

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input jsonb not null,
  estimate jsonb not null,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'in-review', 'delivered')),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

alter table public.submissions enable row level security;

create policy "Users can view their own submissions"
  on public.submissions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own submissions"
  on public.submissions for insert
  with check (auth.uid() = user_id);

-- Storage: private bucket, one folder per user (userId/filename).
insert into storage.buckets (id, name, public)
values ('renovation-photos', 'renovation-photos', false)
on conflict (id) do nothing;

create policy "Users can upload their own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'renovation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own photos"
  on storage.objects for select
  using (
    bucket_id = 'renovation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
