-- Run this once in the Supabase SQL Editor, after schema-02-admin.sql.
-- Stores the narrative generated once at delivery time, instead of
-- regenerating it on every report view.

alter table public.delivered_plans add column if not exists narrative jsonb;
