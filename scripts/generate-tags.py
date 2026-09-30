"""
Tag the catalogue from the spreadsheet it was imported from.

    python scripts/generate-tags.py

Writes supabase/schema-26-seed-tags.sql.

WHY
---
schema-25 added products.tags -- what job a product answers -- and left
it empty, so every suggestion still falls back to guessing by category
and keyword. But the source spreadsheet already says what each thing is:
a `tags` column carrying one `Type_*` value per row, 286 distinct across
2,263 of the 3,405 products. That was read at import time only to pick a
category and was otherwise thrown away.

WHAT IT DOES
------------
One UPDATE per distinct type, each listing the products that carry it,
so the file reads as a vocabulary rather than 2,263 separate statements.

Names are normalised for use as a tag: the `Type_` prefix stripped,
lowercased, whitespace collapsed. "Type_Drill Bits" becomes "drill bits".
Readable, because a shop owner has to recognise these in a filter and in
the admin tag box.

WHAT IT DOES NOT DO
-------------------
The 1,142 products with no Type_ tag are left alone. Their only other
signal is product_type, which is 40 broad values that mostly restate the
category they are already in -- tagging "plumbing" onto something in the
plumbing aisle adds a filter chip and no information. Those are better
tagged by hand, in bulk, where somebody decides what they are for.

And these tags do NOT automatically answer the checklist stages. A stage
is "waterproofing"; the spreadsheet says "sealants". Related, not equal,
and guessing the mapping would put the wrong products in front of a
customer with no way to tell. What this gives is a true vocabulary to
work from and a working Type filter in the shop; mapping types to stages
is a decision for whoever knows the trade.
"""

import collections
import importlib.util
import io
import os
import re
import sys

import openpyxl

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(REPO, "images", "zionbuildingsupplies_products_3405.xlsx")
OUT = os.path.join(REPO, "supabase", "schema-26-seed-tags.sql")

# Enough per statement to stay readable; far below what the editor takes.
CHUNK = 400


def normalise(raw: str) -> str:
    """'Type_Drill Bits' -> 'drill bits'."""
    text = re.sub(r"^type_", "", raw.strip(), flags=re.I)
    return re.sub(r"\s+", " ", text).strip().lower()


def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> int:
    # The ids come from the importer itself, so they match the rows in
    # the database rather than being derived a second, divergent way.
    spec = importlib.util.spec_from_file_location(
        "build_catalogue", os.path.join(REPO, "scripts", "build-catalogue.py"))
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)

    stdout, sys.stdout = sys.stdout, io.StringIO()
    try:
        products = build.main()
    finally:
        sys.stdout = stdout

    id_by_handle = {p["handle"]: p["id"] for p in products}

    workbook = openpyxl.load_workbook(SHEET, read_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)
    header = [str(c or "").strip().lower() for c in next(rows)]
    h_i, t_i = header.index("handle"), header.index("tags")

    by_tag: dict[str, list[str]] = collections.defaultdict(list)
    untagged = 0
    unmatched = 0

    for row in rows:
        handle = str(row[h_i] or "").strip()
        product_id = id_by_handle.get(handle)
        if not product_id:
            unmatched += 1
            continue

        types = [
            normalise(value)
            for value in str(row[t_i] or "").split(",")
            if value.strip().lower().startswith("type_")
        ]
        types = [t for t in types if t]
        if not types:
            untagged += 1
            continue
        for tag in types:
            by_tag[tag].append(product_id)

    tagged = sum(len(ids) for ids in by_tag.values())
    print(f"products          {len(products)}")
    print(f"  tagged          {tagged}")
    print(f"  no Type_ tag    {untagged}")
    print(f"  handle unknown  {unmatched}")
    print(f"  distinct tags   {len(by_tag)}")

    statements = []
    for tag in sorted(by_tag):
        ids = sorted(set(by_tag[tag]))
        for start in range(0, len(ids), CHUNK):
            batch = ids[start:start + CHUNK]
            values = ",\n    ".join(sql(i) for i in batch)
            statements.append(
                "-- {tag} ({n})\n"
                "update public.products\n"
                "   set tags = (\n"
                "         select array_agg(distinct t)\n"
                "           from unnest(tags || array[{tag_literal}]) as t\n"
                "       ),\n"
                "       updated_at = now()\n"
                " where id in (\n"
                "    {values}\n"
                " );".format(
                    tag=tag, n=len(batch), tag_literal=sql(tag), values=values)
            )

    body = f"""-- ===========================================================================
-- 26 — Tag the catalogue from the spreadsheet it came from
--
-- Generated by scripts/generate-tags.py. Do not hand-edit; re-run it.
--
-- Run AFTER schema-25. Safe to re-run: each statement merges its tag
-- into whatever the product already carries rather than replacing.
--
-- WHY
-- schema-25 added products.tags and left it empty, so suggestions still
-- guess by category and keyword. The source spreadsheet already says
-- what each thing is -- one Type_* value per row -- and the import read
-- it only to choose a category, then discarded it.
--
-- WHAT THIS SETS
--   {tagged} products tagged, across {len(by_tag)} distinct types.
--   {untagged} carry no Type_ value in the sheet and are left alone; they are
--       better tagged by hand, in bulk, by someone who decides what
--       they are for.
--
-- "Type_Drill Bits" becomes "drill bits": prefix stripped, lowercased,
-- because a shop owner has to recognise these in a filter and a tag box.
--
-- WHAT THIS IS NOT
-- These do not answer the checklist stages. A stage is "waterproofing";
-- the sheet says "sealants". Related, not equal — and guessing the
-- mapping would put the wrong products in front of a customer with no
-- way to tell. This is a true vocabulary to work from, and a working
-- Type filter in the shop. Mapping types onto stages is a trade
-- decision, made in the admin tag box.
-- ===========================================================================

{chr(10).join(statements)}

-- What the catalogue looks like afterwards.
select
  count(*) filter (where cardinality(tags) > 0) as tagged,
  count(*) filter (where cardinality(tags) = 0) as untagged
  from public.products
 where is_active;
"""

    io.open(OUT, "w", encoding="utf-8", newline="\n").write(body)
    print(f"\n  wrote {os.path.relpath(OUT, REPO)} "
          f"({len(statements)} statements, {len(body) // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
