-- ===========================================================================
-- 22 — Choose which products show against a checklist stage
--
-- Run any time after schema-16. Safe to re-run.
--
-- WHY
-- A stage like "Waterproofing" currently offers whatever happens to sit
-- in the adhesives and tile aisles, because nothing says which specific
-- products ARE the waterproofing. The client asked to pick them by hand:
-- "if I want to show tiles for the washroom I can select manually from
-- admin all the tiles that will display."
--
-- HOW IT IS KEYED
-- `slot` is a plain string, so one table serves both places a curated
-- list is wanted:
--
--   bathroom:tile        a stage of a project in the homeowner checklist
--   item:bath-wall-tile  a requirement in a contractor package
--
-- A product may appear in as many slots as it belongs to. That is the
-- reason this is a table rather than a column on the product, which the
-- client also suggested: a 3-inch screw is fasteners on a deck, framing
-- in a basement, and installation consumables in a kitchen, and a single
-- column would force a choice between them.
--
-- WHAT HAPPENS WHERE NOBODY HAS CURATED
-- Nothing changes. An empty slot falls back to the category filtering
-- that runs today, so this can be filled in one aisle at a time instead
-- of needing all 140 stages done before any of it works.
-- ===========================================================================

create table if not exists public.curated_products (
  slot text not null,
  product_id text not null references public.products(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (slot, product_id)
);

comment on table public.curated_products is
  'Hand-picked products for a checklist stage or package requirement. Empty slot = fall back to category filtering.';

create index if not exists curated_products_slot_idx
  on public.curated_products (slot, sort_order);

alter table public.curated_products enable row level security;

-- Readable by anyone: this decides what a shopper is shown, and the
-- checklist is open to signed-out visitors browsing what a job needs.
drop policy if exists "Curated lists are readable" on public.curated_products;
create policy "Curated lists are readable"
  on public.curated_products for select
  using (true);

drop policy if exists "Admins manage curated lists" on public.curated_products;
create policy "Admins manage curated lists"
  on public.curated_products for all
  using (public.is_admin())
  with check (public.is_admin());

select
  count(*) as curated_rows,
  count(distinct slot) as slots_filled
  from public.curated_products;
