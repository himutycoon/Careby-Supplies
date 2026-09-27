-- ===========================================================================
-- 20 — Take the supplier's name off the products
--
-- Run AFTER schema-18. Safe to re-run.
--
-- WHY
-- The import carried the supplier through into the storefront in three
-- places, and a customer can read all three:
--
--   brand            2,960 products list the supplier as their brand.
--   specifications   the same name again, as a "Brand" row.
--   description      28 descriptions came from the supplier's own feed
--                    with their about-us text still in them — "… is a
--                    local Toronto store owned and operated by …" — which
--                    is a rival storefront advertising itself on our
--                    product pages. Others end "supplied by X", which
--                    says where we buy rather than what the thing is.
--
-- Real manufacturers (Diablo, Makita, Simpson Strong-Tie) are left
-- alone: that is a brand a customer shops by, not a sourcing detail.
-- ===========================================================================

-- 1. The brand field. Blank, not a placeholder — the product card already
-- falls back to our own name when there is no brand.
update public.products
   set brand = '',
       updated_at = now()
 where brand ilike '%zion%';

-- 2. The "Brand" row in the specification table, and any other spec that
-- names them. jsonb_agg over the filtered elements rebuilds the array;
-- coalesce covers a product whose only spec was that one.
update public.products p
   set specifications = coalesce(
         (select jsonb_agg(spec)
            from jsonb_array_elements(p.specifications) as spec
           where spec->>'value' not ilike '%zion%'),
         '[]'::jsonb
       ),
       updated_at = now()
 where p.specifications::text ilike '%zion%';

-- 3. Any sentence that names them, removed whole.
--
-- Replaced with a space, not nothing: dropping the sentence between
-- "Easy to install." and "Made of steel." would otherwise leave
-- "install.Made of steel." The runs of whitespace that leaves are
-- collapsed after. A description that was nothing but that sentence
-- would end up empty, so it gets a plain true statement instead.
update public.products
   set description = case
         when length(btrim(regexp_replace(regexp_replace(
                description, '[^.!?]*\yZion\y[^.!?]*[.!?]\s*', ' ', 'gi'),
                '\s+', ' ', 'g'))) >= 20
           then btrim(regexp_replace(regexp_replace(
                description, '[^.!?]*\yZion\y[^.!?]*[.!?]\s*', ' ', 'gi'),
                '\s+', ' ', 'g'))
         else 'Stocked by CareBy Supplies and delivered across the GTA.'
       end,
       updated_at = now()
 where description ilike '%zion%';

-- 4. "Part of our Hardware range, supplied by Diablo." — the range is
-- ours to mention, where we buy it is not.
update public.products
   set description = regexp_replace(description, ',\s*supplied by [^.]*\.', '.', 'g'),
       updated_at = now()
 where description like '%supplied by %';

-- What is left, so the run can be checked rather than assumed.
select
  count(*) filter (where brand ilike '%zion%') as brand_mentions,
  count(*) filter (where description ilike '%zion%') as description_mentions,
  count(*) filter (where specifications::text ilike '%zion%') as spec_mentions,
  count(*) filter (where description like '%supplied by %') as supplied_by,
  count(*) filter (where brand <> '') as products_with_a_real_brand
  from public.products;
