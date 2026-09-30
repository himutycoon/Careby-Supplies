-- ===========================================================================
-- 25 — What a product is FOR
--
-- Run any time after schema-16. Safe to re-run.
--
-- WHY
-- Suggestions guess. A stage like "Waterproofing" is answered by
-- whatever sits in the adhesives and tile aisles, ranked by whether its
-- name happens to contain the word, because nothing records that a
-- product IS waterproofing. The aisle says where it is kept, not what
-- job it answers, and one product answers several: a 3-inch screw is
-- fasteners on a deck, framing in a basement, and installation
-- consumables in a kitchen.
--
-- A column on the products themselves rather than a separate list to
-- populate, because that is the shop owner's own instruction: "in
-- existing products just make a table, I will name them."
--
-- text[] rather than one value for the reason above -- a product can
-- carry as many tags as it has uses -- and on the product rather than a
-- join table so it shows and edits in the products screen he already
-- uses, without a second place to look.
--
-- WHAT IT DOES NOT DO
-- Nothing changes until a tag is set. An untagged product is suggested
-- exactly as it is today, by category and keyword, so the catalogue can
-- be tagged an aisle at a time instead of all at once.
-- ===========================================================================

alter table public.products
  add column if not exists tags text[] not null default '{}';

comment on column public.products.tags is
  'What jobs this product answers, e.g. {tile, waterproofing}. Empty = fall back to category and keyword matching.';

-- Suggestions ask "which products carry this tag", which is a containment
-- test; GIN is the index that answers it.
create index if not exists products_tags_idx
  on public.products using gin (tags);

select
  count(*) filter (where cardinality(tags) > 0) as tagged,
  count(*) filter (where cardinality(tags) = 0) as untagged
  from public.products
 where is_active;
