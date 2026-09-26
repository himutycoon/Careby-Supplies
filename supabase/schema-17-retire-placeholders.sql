-- ===========================================================================
-- 17 — Retire the placeholder catalogue
--
-- Run AFTER schema-16. The seeded products were invented house-brand
-- stand-ins so the storefront and the package builder had something to
-- show; real stock has arrived for most departments and the stand-ins
-- should not outlive it.
--
-- Two departments' worth stay, on purpose. The import carries no
-- cabinetry, countertops, smart home or window coverings at all, and the
-- package builder asks customers to choose from exactly those — a
-- vanity, a countertop, a blind. Delete the placeholders there and those
-- decisions offer an empty list, which is worse than offering a
-- stand-in. They go when real stock for them does.
--
-- Referenced products are deactivated rather than deleted: order_items
-- and package_items have no ON DELETE clause, so removing a product
-- somebody ordered would either fail or rewrite their order history.
-- is_active = false hides it from every catalogue query (services/
-- products.ts filters on it) while leaving the order intact.
--
-- Safe to re-run.
-- ===========================================================================

-- Everything that did not come from the import, minus the departments
-- the import does not stock.
create temporary table retiring on commit drop as
select id
  from public.products
 where id not like 'zn-%'
   and category_id not in (
     'cabinetry', 'countertops', 'appliances', 'smart-home', 'window-coverings'
   );

-- Ordered or packaged: keep the row, hide the product.
update public.products p
   set is_active = false,
       updated_at = now()
 where p.id in (select id from retiring)
   and (
     exists (select 1 from public.order_items oi where oi.product_id = p.id)
     or exists (select 1 from public.package_items pi where pi.product_id = p.id)
   );

-- Never ordered: remove it. product_images cascades; a package
-- selection that pointed at one has its product_id set to null and the
-- customer is asked to choose again.
delete from public.products p
 where p.id in (select id from retiring)
   and not exists (select 1 from public.order_items oi where oi.product_id = p.id)
   and not exists (select 1 from public.package_items pi where pi.product_id = p.id);

-- What happened, so the run can be checked rather than assumed.
select
  (select count(*) from public.products where id like 'zn-%') as imported,
  (select count(*) from public.products where id not like 'zn-%' and is_active) as placeholders_kept,
  (select count(*) from public.products where id not like 'zn-%' and not is_active) as placeholders_hidden,
  (select count(*) from public.products where is_active) as live_total;
