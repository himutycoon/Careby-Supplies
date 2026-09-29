-- ===========================================================================
-- 23 — Move package allowances out of code
--
-- Run any time. Safe to re-run.
--
-- WHY
-- The allowance is what a contractor has budgeted for an item, and the
-- difference between it and the product a customer picks is the upgrade
-- or credit the portal shows them. Those figures lived in a TypeScript
-- file -- a vanity at $1,100, a toilet at $480 -- with a comment saying
-- they were trade-typical placeholders "to review before quoting real
-- customers". That review never happened, and changing one meant a code
-- edit and a deploy.
--
-- HOW IT WORKS
-- Overrides only. A row here replaces that item's Medium allowance; an
-- item with no row keeps the figure in the code. So this table starts
-- empty and nothing changes until someone edits something, and an item
-- added to the code later works without a matching row.
--
-- Tier still multiplies on top: Basic x0.6, Luxury x2.2. What is stored
-- is the Medium figure, which is what the code stored too.
--
-- EXISTING PACKAGES DO NOT MOVE. package_selections snapshots the
-- allowance when the package is created, because it is a commercial
-- promise to a named customer. Editing a figure here changes what the
-- next package quotes, never one already sent.
-- ===========================================================================

create table if not exists public.selection_allowances (
  item_id text primary key,
  allowance_cad numeric(10, 2) not null check (allowance_cad >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.selection_allowances is
  'Overrides for the Medium allowance of a selection item. No row = use the figure in data/packages/selection-items.ts.';

alter table public.selection_allowances enable row level security;

-- Readable by anyone signed in: a contractor previewing a package needs
-- the same figures the package will be created with.
drop policy if exists "Allowances are readable" on public.selection_allowances;
create policy "Allowances are readable"
  on public.selection_allowances for select
  using (true);

drop policy if exists "Admins manage allowances" on public.selection_allowances;
create policy "Admins manage allowances"
  on public.selection_allowances for all
  using (public.is_admin())
  with check (public.is_admin());

select count(*) as overrides from public.selection_allowances;
