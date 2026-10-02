-- ===========================================================================
-- 27 — Charge the support package on the order
--
-- Run after schema-26. Safe to re-run.
--
-- WHY
-- The contractor's order-by-category flow offers Basic ($149), Standard
-- ($449) and Premium ($1,200), and the money went nowhere. schema-08
-- started recording the choice on the project so the team could see it,
-- and a service_request was raised so somebody would action it, but the
-- order never carried the price and the contractor was never asked for
-- it. The client's instruction is plain: add the price, and show the
-- package at checkout.
--
-- WHY NOT AN ORDER LINE
-- order_items.product_id is NOT NULL and references products(id), so a
-- support package cannot be a line without inventing a fake product
-- row. It is not a product -- nothing is picked, packed or delivered --
-- so it sits on the order beside the delivery fee, which is the other
-- thing on an order that is not a product.
--
-- THE DELIVERY RULE STILL READS MATERIALS ONLY
-- Free delivery over $500 is a promise about materials. A $149 support
-- package must not be what carries a $400 order over the line, so the
-- threshold is still measured against order_items alone while the
-- subtotal, the tax and the total all include the package.
-- ===========================================================================

alter table public.orders
  add column if not exists support_package text not null default '';

alter table public.orders
  add column if not exists support_package_price numeric(12, 2) not null
    default 0;

-- ---------------------------------------------------------------------------
-- Totals, recomputed from what the database holds rather than what the
-- browser sent. Replaces the schema-08 version; the only change is that
-- the package is added after the delivery rule has been applied.
-- ---------------------------------------------------------------------------
create or replace function public.recalculate_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order uuid := coalesce(new.order_id, old.order_id);
  items_subtotal numeric(12, 2);
  package_price numeric(12, 2);
  new_subtotal numeric(12, 2);
  new_shipping numeric(12, 2);
  new_tax numeric(12, 2);
  order_delivery text;
begin
  select coalesce(sum(total_price), 0) into items_subtotal
  from public.order_items where order_id = target_order;

  select delivery_method, coalesce(support_package_price, 0)
    into order_delivery, package_price
  from public.orders where id = target_order;

  -- Materials decide the delivery fee; the package is not delivered.
  new_shipping := case
    when items_subtotal = 0 then 0
    when coalesce(order_delivery, '') ilike '%pickup%' then 0
    when items_subtotal >= 500 then 0
    else 79
  end;

  new_subtotal := items_subtotal + package_price;
  new_tax := round((new_subtotal + new_shipping) * 0.13, 2);

  update public.orders
  set subtotal = new_subtotal,
      shipping = new_shipping,
      tax = new_tax,
      total = round(new_subtotal + new_shipping + new_tax, 2),
      updated_at = now()
  where id = target_order;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- The items trigger alone is not enough.
--
-- An order is inserted, then its items -- so the items trigger does see
-- a package written at insert time. But a package added or corrected on
-- an order that already has its items would change no total at all, and
-- the row would quietly disagree with itself. This fires on the column
-- itself so the two can never drift.
--
-- Guarded against recursion: the function above updates orders, which
-- would re-fire this, so it only runs when the package price is what
-- changed.
-- ---------------------------------------------------------------------------
create or replace function public.recalculate_order_totals_for_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  items_subtotal numeric(12, 2);
  new_shipping numeric(12, 2);
  new_subtotal numeric(12, 2);
  new_tax numeric(12, 2);
begin
  select coalesce(sum(total_price), 0) into items_subtotal
  from public.order_items where order_id = new.id;

  new_shipping := case
    when items_subtotal = 0 then 0
    when coalesce(new.delivery_method, '') ilike '%pickup%' then 0
    when items_subtotal >= 500 then 0
    else 79
  end;

  new_subtotal := items_subtotal + coalesce(new.support_package_price, 0);
  new_tax := round((new_subtotal + new_shipping) * 0.13, 2);

  update public.orders
  set subtotal = new_subtotal,
      shipping = new_shipping,
      tax = new_tax,
      total = round(new_subtotal + new_shipping + new_tax, 2),
      updated_at = now()
  where id = new.id;

  return null;
end;
$$;

drop trigger if exists orders_support_package_totals on public.orders;
create trigger orders_support_package_totals
  after update of support_package_price on public.orders
  for each row
  when (old.support_package_price is distinct from new.support_package_price)
  execute function public.recalculate_order_totals_for_order();

-- What this changed, if anything. Existing orders have no package, so
-- the expected answer is that every total still agrees with its parts.
select
  count(*) as orders,
  count(*) filter (where support_package <> '') as with_package,
  count(*) filter (
    where round(subtotal + shipping + tax, 2) <> total
  ) as totals_disagreeing
  from public.orders;
