-- ===========================================================================
-- Phase 3 — inventory maintenance.
-- Run once in the Supabase SQL Editor, after schema-06-flows.sql.
--
-- Safe to re-run: the column uses `if not exists`, the function uses
-- `create or replace`, and the trigger is dropped first.
--
-- Why: products carried BOTH stock_quantity (a number) and stock_status
-- (in-stock / low-stock / out-of-stock, set by hand). Two fields describing
-- one fact drift apart the moment someone updates one and forgets the
-- other — a product could read "in stock" with 0 units and the storefront
-- would happily take the order.
--
-- Stock status is now derived from the quantity by a trigger, so whoever
-- maintains the catalog updates ONE number and the status follows. The
-- threshold is per-product because a box of screws and an entry door do
-- not run low at the same count.
-- ===========================================================================

alter table public.products
  add column if not exists low_stock_threshold int not null default 10
  check (low_stock_threshold >= 0);

create or replace function public.derive_stock_status()
returns trigger
language plpgsql
as $$
begin
  new.stock_status := case
    when new.stock_quantity <= 0 then 'out-of-stock'
    when new.stock_quantity <= new.low_stock_threshold then 'low-stock'
    else 'in-stock'
  end;
  return new;
end;
$$;

drop trigger if exists products_derive_stock_status on public.products;
create trigger products_derive_stock_status
  before insert or update on public.products
  for each row execute function public.derive_stock_status();

-- Bring existing rows in line with the rule that now governs them.
update public.products
set stock_status = case
  when stock_quantity <= 0 then 'out-of-stock'
  when stock_quantity <= low_stock_threshold then 'low-stock'
  else 'in-stock'
end
where stock_status is distinct from case
  when stock_quantity <= 0 then 'out-of-stock'
  when stock_quantity <= low_stock_threshold then 'low-stock'
  else 'in-stock'
end;

-- Finding what needs reordering should not scan the whole catalog.
create index if not exists products_stock_status_idx
  on public.products (stock_status);

-- ---------------------------------------------------------------------------
-- Verification — every row should report true.
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'products'
       and column_name = 'low_stock_threshold') = 1 as threshold_column_added,
  (select count(*) from pg_trigger
     where tgname = 'products_derive_stock_status') = 1 as trigger_installed,
  (select count(*) from public.products
     where stock_status <> case
       when stock_quantity <= 0 then 'out-of-stock'
       when stock_quantity <= low_stock_threshold then 'low-stock'
       else 'in-stock' end) = 0 as all_rows_consistent;
