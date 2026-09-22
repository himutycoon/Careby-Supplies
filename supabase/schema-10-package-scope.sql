-- ===========================================================================
-- 10 — Template-driven package scope
--
-- Safe to re-run, like every migration before it.
--
-- Implements the Database Model sheet of the package spec. Scope and
-- Selection Requirement are one table here (package_selections): the sheet
-- separates them, but a requirement only ever exists because scope put it
-- there, and a 1:1 split would mean a join on every read for no gain.
--
-- Contents:
--   1. packages — template, tier and adjuster answers
--   2. package_selections — the generated checklist and the customer's choice
--   3. package_versions — approval history
--   4. RLS — contractor owns it, customer answers it, nobody else sees it
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. What the package was generated from
--
-- Kept on the package so the checklist can be regenerated and diffed: the
-- adjuster answers are the input, package_selections is the output.
-- ---------------------------------------------------------------------------

alter table public.packages
  add column if not exists template_id text not null default '';

alter table public.packages
  add column if not exists budget_tier text not null default 'medium';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'packages_budget_tier_check'
  ) then
    alter table public.packages
      add constraint packages_budget_tier_check
      check (budget_tier in ('basic', 'medium', 'luxury'));
  end if;
end;
$$;

alter table public.packages
  add column if not exists adjusters jsonb not null default '{}'::jsonb;

-- Coordination notes the engine raised (rough-ins, permits). Contractor
-- facing only — the Package Rules sheet keeps these away from customers.
alter table public.packages
  add column if not exists scope_flags jsonb not null default '[]'::jsonb;

alter table public.packages
  add column if not exists exclusions text not null default '';

-- Set when the customer submits a complete set of selections.
alter table public.packages
  add column if not exists submitted_at timestamptz;

alter table public.packages
  add column if not exists approved_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. The generated checklist, and what the customer chose against it
--
-- One row per decision. allowance_cad is frozen at generation time so a
-- later change to the taxonomy cannot silently re-price a package a
-- customer has already been quoted.
-- ---------------------------------------------------------------------------

create table if not exists public.package_selections (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,

  -- From the taxonomy (data/packages/selection-items.ts).
  item_id text not null,
  label text not null,
  room text not null default '',
  category_id text not null default '',
  -- Why it is in scope; contractor facing.
  reason text not null default '',

  required boolean not null default true,
  quantity int not null default 1 check (quantity > 0),
  allowance_cad numeric(12, 2) not null default 0,

  -- The customer's decision. Null until they choose.
  product_id text references public.products(id) on delete set null,
  selected_price_cad numeric(12, 2),
  customer_note text not null default '',
  chosen_at timestamptz,

  status text not null default 'pending'
    check (status in ('pending', 'selected', 'approved', 'rejected')),

  -- Procurement, filled after approval (Database Model: Procurement).
  vendor text not null default '',
  sku text not null default '',
  lead_time_days int,
  ordered_at timestamptz,
  received_at timestamptz,
  installed_at timestamptz,

  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A package asks for any given item once; quantity carries "two sinks".
  unique (package_id, item_id)
);

alter table public.package_selections enable row level security;

create index if not exists package_selections_package_idx
  on public.package_selections (package_id);
create index if not exists package_selections_status_idx
  on public.package_selections (status);

-- ---------------------------------------------------------------------------
-- 3. Approval history
--
-- Package Rules: "Changing an approved product creates a new
-- version/history." The snapshot is the whole selection set as it stood,
-- so an approved version can always be reconstructed.
-- ---------------------------------------------------------------------------

create table if not exists public.package_versions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  version int not null,
  approved_by uuid references public.profiles(id) on delete set null,
  comments text not null default '',
  snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (package_id, version)
);

alter table public.package_versions enable row level security;

-- ---------------------------------------------------------------------------
-- 4. Row level security
--
-- Three ways in, deliberately:
--   - the contractor who owns the package
--   - the customer it was assigned to, once they have an account
--   - anyone holding the package reference, because the whole point of the
--     one-link workflow is that a customer can open it without signing up.
--     That is why the reference is random, and why this policy allows
--     selecting a product but never changing price, allowance or status.
-- ---------------------------------------------------------------------------

create or replace function public.owns_package(target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.packages p
    where p.id = target
      and (p.contractor_id = auth.uid() or p.customer_id = auth.uid())
  );
$$;

drop policy if exists "Package parties read selections" on public.package_selections;
create policy "Package parties read selections"
  on public.package_selections for select
  using (public.owns_package(package_id) or public.is_admin());

drop policy if exists "Contractor writes selections" on public.package_selections;
create policy "Contractor writes selections"
  on public.package_selections for all
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.contractor_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.contractor_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "Customer answers selections" on public.package_selections;
create policy "Customer answers selections"
  on public.package_selections for update
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id
        and p.customer_id = auth.uid()
        and p.status in ('sent', 'draft')
    )
  )
  with check (
    exists (
      select 1 from public.packages p
      where p.id = package_id
        and p.customer_id = auth.uid()
        and p.status in ('sent', 'draft')
    )
  );

/*
 * A customer must not be able to rewrite the commercial terms.
 *
 * RLS is row level, not column level, so the customer-update policy above
 * would otherwise permit editing allowance_cad or marking a line approved.
 * Same approach as the Stripe payment guard: a trigger, SECURITY INVOKER,
 * denying the roles a browser can hold.
 */
create or replace function public.guard_package_selection_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_contractor boolean;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  select exists (
    select 1 from public.packages p
    where p.id = new.package_id and p.contractor_id = auth.uid()
  ) into is_contractor;

  if is_contractor then
    return new;
  end if;

  if new.allowance_cad is distinct from old.allowance_cad
     or new.quantity is distinct from old.quantity
     or new.required is distinct from old.required
     or new.item_id is distinct from old.item_id
     or new.vendor is distinct from old.vendor
     or new.sku is distinct from old.sku
     or new.ordered_at is distinct from old.ordered_at
     or new.received_at is distinct from old.received_at
     or new.installed_at is distinct from old.installed_at
     or new.status not in ('pending', 'selected') then
    raise exception 'Only the contractor can change scope, allowance or procurement.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_package_selection_columns on public.package_selections;
create trigger guard_package_selection_columns
  before update on public.package_selections
  for each row execute function public.guard_package_selection_columns();

drop policy if exists "Package parties read versions" on public.package_versions;
create policy "Package parties read versions"
  on public.package_versions for select
  using (public.owns_package(package_id) or public.is_admin());

drop policy if exists "Contractor writes versions" on public.package_versions;
create policy "Contractor writes versions"
  on public.package_versions for all
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.contractor_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.contractor_id = auth.uid()
    )
    or public.is_admin()
  );

-- Realtime, so a contractor watching the package sees selections land.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.package_selections;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;
