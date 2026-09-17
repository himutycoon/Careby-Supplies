-- ===========================================================================
-- Phase 3 — flows, realtime and premium detail capture.
-- Run once in the Supabase SQL Editor, after schema-05-platform.sql.
--
-- Safe to re-run: columns and indexes use `if not exists`, every policy is
-- preceded by a `drop ... if exists`, and the publication block checks
-- before adding. No existing data is rewritten.
--
-- Contents:
--   1. submissions -> projects link (renovation flow)
--   2. premium_requests.details (guided premium wizard)
--   3. realtime publication (spec §16)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Link renovation submissions to projects
--
-- The renovation wizard wrote only to `submissions`, while every other flow
-- created a `projects` row. That left two parallel representations of "a
-- job": renovations were invisible in My Projects and in the admin Projects
-- screen, and renovation_details was never populated by anything.
--
-- A submission is the estimate artifact; a project is the job record.
-- ---------------------------------------------------------------------------

alter table public.submissions
  add column if not exists project_id uuid
  references public.projects(id) on delete set null;

create index if not exists submissions_project_idx
  on public.submissions (project_id);

-- Lets an owner attach the project to their own submission after insert.
drop policy if exists "Users can update their own submissions" on public.submissions;
create policy "Users can update their own submissions"
  on public.submissions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Premium request detail capture
--
-- The guided wizard asks for an engagement tier, project profile and
-- contact preference. Those live in jsonb — the same pattern
-- renovation_details.answers and service_requests.details already use — so
-- refining the questions later is a code change, not a migration.
-- ---------------------------------------------------------------------------

alter table public.premium_requests
  add column if not exists details jsonb not null default '{}'::jsonb;

-- schema-05 gave owners select + insert but no update, so the wizard could
-- not attach its answers. Owners may only touch their own row; status and
-- assignment stay admin-controlled via "Admins manage premium requests".
drop policy if exists "Users update their own premium requests" on public.premium_requests;
create policy "Users update their own premium requests"
  on public.premium_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Realtime (spec §16)
--
-- Admin screens update as work arrives instead of needing a refresh.
-- RLS still applies to realtime: a subscriber only receives changes to rows
-- it is allowed to select, so this does not widen access. Only tables an
-- admin actually watches are published.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  -- Supabase ships this publication, but create it if missing so the
  -- migration can't abort on the alter below.
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  foreach t in array array[
    'orders',
    'projects',
    'service_requests',
    'call_orders',
    'drawing_uploads',
    'premium_requests',
    'submissions'
  ]
  loop
    -- add table is not idempotent; adding twice raises, so check first.
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I', t
      );
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Verification — every row below should report true.
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'submissions'
       and column_name = 'project_id') = 1 as submissions_project_id_added,
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'premium_requests'
       and column_name = 'details') = 1 as premium_details_added,
  (select count(*) from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public') >= 7
       as realtime_tables_published;
