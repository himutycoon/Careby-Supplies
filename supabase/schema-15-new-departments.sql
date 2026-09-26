-- ===========================================================================
-- 15 — Departments the real catalogue needs
--
-- Generated from images/zionbuildingsupplies_products_3405.xlsx by the
-- transform in the commit that added this file. Do not hand-edit: change
-- the transform and regenerate, or the next export will overwrite it.
--
-- Safe to re-run. Every product upserts on its primary key, so running
-- part 2 twice updates 3,405 rows rather than duplicating them.
-- ===========================================================================


-- Six departments the seeded catalogue never had, because nothing was
-- stocked in them. The import fills all six.
insert into public.product_categories (id, name, slug, icon, sort_order) values
  ('drywall', 'Drywall & Board', 'drywall', 'Boxes', 18),
  ('insulation', 'Insulation', 'insulation', 'Package', 19),
  ('adhesives', 'Adhesives & Sealants', 'adhesives-sealants', 'Palette', 20),
  ('concrete', 'Concrete & Cement', 'concrete-cement', 'Building2', 21),
  ('metal-framing', 'Metal Framing & Ceilings', 'metal-framing', 'Ruler', 22),
  ('bath', 'Bath Accessories', 'bath-accessories', 'Home', 23)
on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      icon = excluded.icon,
      sort_order = excluded.sort_order;
