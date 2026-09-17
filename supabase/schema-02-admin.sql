-- Run this once in the Supabase SQL Editor, after schema.sql.
-- Adds delivered plans (admin-uploaded concept image + plan notes) and a
-- private storage bucket for the "after" images. Regular users can only
-- read their own delivered plan; only the service-role key (used by admin
-- server actions) can write here — never a regular user's session.

create table if not exists public.delivered_plans (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  after_image_urls text[] not null default '{}',
  plan_notes text not null default '',
  layout_description text not null default '',
  admin_adjusted_cost jsonb,
  delivered_by text not null,
  delivered_at timestamptz not null default now()
);

alter table public.delivered_plans enable row level security;

create policy "Users can view their own delivered plan"
  on public.delivered_plans for select
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
  );

-- Storage: private bucket, one folder per submission (submissionId/filename).
insert into storage.buckets (id, name, public)
values ('delivered-plans', 'delivered-plans', false)
on conflict (id) do nothing;

create policy "Users can view their own delivered plan photos"
  on storage.objects for select
  using (
    bucket_id = 'delivered-plans'
    and exists (
      select 1 from public.submissions s
      where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid()
    )
  );
