"""
Attach photographs and the store's own descriptions to the catalogue.

    python scripts/attach-images.py            # uses the cached feed if present
    python scripts/attach-images.py --refresh  # re-fetches it

Writes supabase/schema-18-product-images.sql, which updates the products
imported by schema-16.

WHERE THE DATA COMES FROM
-------------------------
The store's public product feed, /products.json, paginated 250 at a time
— fourteen requests with a second between them, not one request per
product. The spreadsheet the catalogue was imported from is a
third-party app's export and carries neither images nor descriptions;
the feed carries both.

The feed is cached in images/ (gitignored) so re-running this to change a
rule costs no traffic at all. Pass --refresh when the store has changed.

WHAT IT TAKES
-------------
  images[0].src   the main photograph, rewritten to Shopify's 800px
                  variant — the originals run past 2000px, which is a
                  slow catalogue on a phone for pixels nothing renders.
  body_html       the real description, when it is actually a
                  description. Plenty are not: 52 products say only
                  "Call for availability this product only sell in store
                  only", 32 are an empty "Item Dimension: Package
                  Dimension:" template, some are a bare part number.
                  Those are dropped and the generated sentence stays.

Prices, stock and categories are NOT re-sourced here. They came from the
first import; quietly re-deriving them from a second source is how two
systems start disagreeing about what something costs.
"""

import html
import io
import json
import os
import re
import sys
import time
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(REPO, "images", "zion-products-feed.json")
OUT = os.path.join(REPO, "supabase", "schema-18-product-images-{n}.sql")

FEED = "https://zionbuildingsupplies.com/products.json?limit=250&page={page}"
UA = "CareBySuppliesCatalogueSync/1.0 (owner-authorised import)"
PAGE_PAUSE = 1.0
MAX_PAGES = 40

IMAGE_WIDTH = 800
# 900 rows came to 455KB, which the SQL editor would not take in one
# paste — that file had to be split by hand after the fact. Half that is
# ~110KB per file and pastes cleanly.
CHUNK = 450
MIN_DESCRIPTION = 25


def fetch_feed() -> list:
    products, page = [], 1
    while page <= MAX_PAGES:
        req = urllib.request.Request(FEED.format(page=page), headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as response:
            batch = json.load(response)["products"]
        if not batch:
            break
        products.extend(batch)
        print(f"  page {page}: {len(batch)} (total {len(products)})", flush=True)
        page += 1
        time.sleep(PAGE_PAUSE)
    return products


def load_feed(refresh: bool) -> list:
    if not refresh and os.path.exists(CACHE):
        print("using cached feed:", os.path.relpath(CACHE, REPO))
        return json.load(io.open(CACHE, encoding="utf-8"))
    print("fetching product feed")
    products = fetch_feed()
    io.open(CACHE, "w", encoding="utf-8").write(json.dumps(products))
    print(f"  cached {len(products)} products")
    return products


# ---------------------------------------------------------------------------
# Descriptions
# ---------------------------------------------------------------------------

TAG = re.compile(r"<[^>]+>")
SPACE = re.compile(r"\s+")

# Availability notes rather than descriptions. Stripped wherever they
# appear, so a real description that happens to end with one survives.
BOILERPLATE = re.compile(
    r"(call for availability"
    r"|this product only sell in store only"
    r"|only sold in store"
    r"|only sell in store"
    r"|discount applied at check ?out)",
    re.I,
)

# The store's dimension template, left unfilled.
EMPTY_TEMPLATE = re.compile(
    r"^(item|package)\s+dimension\s*:\s*(package\s+dimension\s*:\s*)?"
    r"(package\s+weight\s*:\s*)?$",
    re.I,
)


def plain_text(body: str) -> str:
    if not body:
        return ""
    text = re.sub(r"<(br|/p|/div|/li|/tr)[^>]*>", " ", body, flags=re.I)
    text = TAG.sub("", text)
    return SPACE.sub(" ", html.unescape(text)).strip()


def usable_description(body: str) -> str:
    """The feed's description, or "" when it is not one."""
    text = BOILERPLATE.sub("", plain_text(body))
    text = SPACE.sub(" ", text).strip(" .,;-")
    if len(text) < MIN_DESCRIPTION:
        return ""
    if EMPTY_TEMPLATE.match(text):
        return ""
    if " " not in text:                      # a bare part number
        return ""
    return text if text.endswith((".", "!", "?")) else text + "."


def sized(url: str) -> str:
    """cdn/.../file.jpg?v=1 -> cdn/.../file_800x.jpg?v=1"""
    if not url:
        return url
    base, _, query = url.partition("?")
    root, ext = os.path.splitext(base)
    if not ext:
        return url
    return f"{root}_{IMAGE_WIDTH}x{ext}" + (f"?{query}" if query else "")


def sql(value) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


HEADER = """-- ===========================================================================
-- 18 — Photographs and descriptions, part {n} of {total}
--
-- Generated by scripts/attach-images.py from the storefront's product
-- feed. Do not hand-edit; re-run the script.
--
-- Run AFTER schema-16. Joins on the handle each product was imported
-- with, so a product the feed no longer carries keeps what it has rather
-- than being blanked.
--
-- Descriptions coalesce rather than overwrite: where the store has a
-- real one it wins, and where it has only "Call for availability" the
-- sentence generated from the product's own tags stays. That is why
-- every row carries both columns and nulls the one it does not change.
--
-- Safe to re-run.
-- ===========================================================================
"""


def main() -> int:
    refresh = "--refresh" in sys.argv
    feed = load_feed(refresh)
    by_handle = {p["handle"]: p for p in feed}

    sys.path.insert(0, os.path.join(REPO, "scripts"))
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "build_catalogue", os.path.join(REPO, "scripts", "build-catalogue.py"))
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)

    stdout, sys.stdout = sys.stdout, io.StringIO()
    try:
        products = build.main()
    finally:
        sys.stdout = stdout

    rows, photos, described, missing = [], 0, 0, []
    for product in products:
        source = by_handle.get(product["handle"])
        if not source:
            missing.append(product["name"])
            continue
        images = source.get("images") or []
        image = sized(images[0]["src"]) if images else None
        body = usable_description(source.get("body_html"))
        if not image and not body:
            if not image:
                missing.append(product["name"])
            continue
        photos += 1 if image else 0
        described += 1 if body else 0
        rows.append((product["id"], image, body or None))

    print(f"\ncatalogue        {len(products)}")
    print(f"  photographs    {photos}")
    print(f"  descriptions   {described}")
    print(f"  still no photo {len(products) - photos}")
    for name in missing[:10]:
        print(f"     - {name[:60]}")

    # One file per statement, for the same reason schema-16 is in four:
    # a megabyte of SQL is more than the editor wants in one paste. The
    # files now in supabase/ were generated before CHUNK came down, so
    # part 1 exists as 1a-1d; a re-run replaces the lot.
    parts = [rows[i:i + CHUNK] for i in range(0, len(rows), CHUNK)]
    print()
    for n, part in enumerate(parts, start=1):
        values = ",\n".join(
            f"    ({sql(pid)}, {sql(img)}, {sql(body)})" for pid, img, body in part
        )
        statement = f"""
update public.products p
   set image_url = coalesce(v.image_url, p.image_url),
       description = coalesce(v.description, p.description),
       updated_at = now()
  from (values
{values}
  ) as v(id, image_url, description)
 where p.id = v.id;
"""
        # The count only means anything once every part has run.
        tail = """
select count(*) filter (where image_url is not null) as with_photo,
       count(*) filter (where image_url is null) as without_photo
  from public.products
 where is_active;
""" if n == len(parts) else ""

        path = OUT.format(n=n)
        io.open(path, "w", encoding="utf-8", newline="\n").write(
            HEADER.format(n=n, total=len(parts)) + statement + tail)
        print("  wrote", os.path.relpath(path, REPO))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
