"""
Turn the Zion Shopify export into a CareBy catalogue migration.

    python scripts/build-catalogue.py

Reads images/<export>.xlsx and writes supabase/schema-15-new-departments
.sql plus schema-16-products-{1..4}.sql. The SQL is generated, never
hand-edited: change a rule here and re-run, or the next export silently
undoes the edit.

images/ is gitignored, so the source spreadsheet is not in the repo. Drop
the next export there and point SRC at it.

Everything written here comes from the spreadsheet or is derived from it
by a rule in this file. Nothing about a product is invented: no ratings,
no review counts, no descriptions that claim anything the row does not
say, and no specifications that are not in its own tags. A catalogue of
3,405 plausible fictions would be worse than one of short truths.

Requires openpyxl.
"""
import collections
import io
import json
import re

import openpyxl

SRC = "D:/PROJECTS 2026/carebysupplies/homeforge-ca/images/zionbuildingsupplies_products_3405.xlsx"
OUT_DIR = "D:/PROJECTS 2026/carebysupplies/homeforge-ca/supabase"

# Same 12% the seeded catalogue uses (289 -> 254.32), so trade pricing is
# one rule across every product rather than two conventions.
TRADE_DISCOUNT = 0.12

# ---------------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------------

NEW_CATEGORIES = [
    ("drywall", "Drywall & Board", "drywall", "Boxes", 18),
    ("insulation", "Insulation", "insulation", "Package", 19),
    ("adhesives", "Adhesives & Sealants", "adhesives-sealants", "Palette", 20),
    ("concrete", "Concrete & Cement", "concrete-cement", "Building2", 21),
    ("metal-framing", "Metal Framing & Ceilings", "metal-framing", "Ruler", 22),
    ("bath", "Bath Accessories", "bath-accessories", "Home", 23),
]

# product_type -> department, for the types that map wholesale.
TYPE_TO_CATEGORY = {
    "Plumbing": "plumbing",
    "Plumbing Accessories": "plumbing",
    "Specialized Fittings": "plumbing",
    "Power Tools": "tools",
    "Power Tool": "tools",
    "Power tool": "tools",
    "Hand Tools": "tools",
    "Tool": "tools",
    "Tools": "tools",
    "Tool Storage": "tools",
    "Cutters, Blades & Saws": "tools",
    "Gardening Tools": "outdoor",
    "Safety and Protection": "tools",
    "Batteries, Maintenance&Accessories": "tools",
    "Electrical": "electrical",
    "Lighting": "electrical",
    "Fasteners": "hardware",
    "Hardware": "hardware",
    "Structural Hardware": "hardware",
    "Door Lock and Hardware": "hardware",
    "Door lock and hardware": "hardware",
    "Door": "doors-windows",
    "HVAC Accessories": "hvac",
    "Paint": "paint",
    "Cleaner": "paint",
    "Lumbers and Sheet Goods": "lumber",
    "Moulding and Trim": "lumber",
    "Fence and Decking": "outdoor",
    "Decking": "outdoor",
    "Roofing & Gutters": "roofing",
    "Drywall": "drywall",
    "Insulation": "insulation",
    "Adhesives & Sealants": "adhesives",
    "Mix and Cements": "concrete",
    "Metal Framing": "metal-framing",
    "Suspension Systems": "metal-framing",
}

# Two source types are mixed bags. Their Type_ tag decides, because the
# package builder picks products by department: put every bathroom
# fixture in "bath" and a plumbing requirement would offer pipe fittings
# where it should be offering a toilet.
TAG_TO_CATEGORY = {
    ("Bath", "Bathroom Faucet"): "plumbing",
    ("Bath", "Washroom Drains"): "plumbing",
    ("Bath", "Toilet and Accessories"): "plumbing",
    ("Bath", "Shower Panel"): "plumbing",
    ("Bath", "Shower niche"): "plumbing",
    ("Bath", "Bathroom Fan"): "hvac",
    ("Bath", "Shower Glass"): "doors-windows",
    ("Bath", "Bathroom Accessories"): "bath",
    ("Bath", "Mirror"): "bath",
    ("Flooring and Tiles", "Tile Edging"): "tile",
    ("Flooring and Tiles", "Marble Jamb"): "tile",
    ("Flooring and Tiles", "Membrane"): "tile",
    ("Flooring and Tiles", "Flooring Tools and Accessories"): "flooring",
    ("Kitchen", "Kitchen Faucet"): "plumbing",
    ("Kitchen", "Kitchen Sink"): "plumbing",
    ("Kitchen", "Kitchen Drains"): "plumbing",
    ("Kitchen", "Range Hood"): "appliances",
    ("Hardware", "Window"): "doors-windows",
}

# Fallback for the mixed types when the row carries no Type_ tag.
TYPE_DEFAULT = {
    "Bath": "plumbing",
    "Flooring and Tiles": "flooring",
    "Kitchen": "cabinetry",
}

# Last resort for the handful with no product_type at all.
KEYWORD_TO_CATEGORY = [
    ("shower glass", "doors-windows"),
    ("shower door", "doors-windows"),
    ("shower curb", "tile"),
    ("primer", "paint"),
    ("pex", "plumbing"),
    ("pvc", "plumbing"),
    ("device box", "electrical"),
    ("light", "electrical"),
]

TONE_BY_CATEGORY = {
    "lumber": "sand", "flooring": "sand", "tile": "slate", "plumbing": "slate",
    "electrical": "navy", "doors-windows": "forest", "roofing": "slate",
    "hardware": "slate", "paint": "sand", "tools": "navy", "cabinetry": "sand",
    "countertops": "slate", "appliances": "navy", "hvac": "slate",
    "outdoor": "forest", "drywall": "slate", "insulation": "sand",
    "adhesives": "navy", "concrete": "slate", "metal-framing": "navy",
    "bath": "slate",
}

CATEGORY_LABEL = {
    "lumber": "Lumber & Wood", "flooring": "Flooring", "plumbing": "Plumbing",
    "electrical": "Electrical", "doors-windows": "Doors & Windows",
    "roofing": "Roofing", "hardware": "Hardware", "paint": "Paint & Finishes",
    "tools": "Tools & Equipment", "cabinetry": "Cabinetry & Vanities",
    "countertops": "Countertops", "tile": "Tile & Stone",
    "appliances": "Appliances", "hvac": "Heating & Cooling",
    "outdoor": "Decking & Outdoor", "drywall": "Drywall & Board",
    "insulation": "Insulation", "adhesives": "Adhesives & Sealants",
    "concrete": "Concrete & Cement", "metal-framing": "Metal Framing & Ceilings",
    "bath": "Bath Accessories",
}

# ---------------------------------------------------------------------------
# Titles
#
# The export is ALL CAPS, which shouts on a product card. Title casing it
# has to leave three things alone: acronyms (PVC, GFCI), measurements
# (1/2", 4'X8', 8mm) and model codes (Q1524P, GFTR2-HSW). Any token with
# a digit in it is one of the last two, so it is passed through as is.
# ---------------------------------------------------------------------------

ACRONYMS = {
    "PVC", "ABS", "PEX", "CPVC", "GFCI", "AFCI", "LED", "USB", "SS", "MDF",
    "OSB", "XPS", "EPS", "HVAC", "CSA", "NPT", "MIP", "FIP", "DWV", "EMT",
    "PPR", "BX", "NMD", "TR", "WR", "HD", "LH", "RH", "US", "UV", "PSI",
    "MM", "CM", "ML", "PC", "PCS", "SF", "SQ", "FT", "IN", "LB", "KG", "OZ",
    "GAL", "QT", "AC", "DC", "TV", "GFI", "MC", "AL", "CU", "ID", "OD",
    "NSF", "ABS", "EZ", "QR", "SDS", "TPI", "RPM", "AWG", "BSP", "OC",
    "PT", "FRP", "GA", "SPF", "KD", "THHN", "XHHW", "SDR", "IPS", "CTS",
    "FHT", "MHT", "NPS", "MDO", "PSF", "BTU", "CFM", "IC", "RV",
    # Fitting end-connections, written as HxH / SxS / MxF on every
    # plumbing line. Title casing them gives "Hxhxh", which is gibberish.
    "HXH", "HXHXH", "HXS", "SXH", "SXS", "SXSXS", "MXF", "FXM", "FXF",
    "MXM", "HXHXHXH", "FIPXMIP", "MIPXFIP",
}
LOWER_WORDS = {"and", "or", "the", "a", "an", "of", "for", "with", "to", "on",
               "in", "at", "by", "per"}


ITEM_CODE = re.compile(r"^#\s*(\d{3,})\s+")


def split_item_code(raw: str):
    """
    "#40048 24\"X32\" FRAMELESS MIRROR" -> ("40048", the rest).

    110 titles open with the supplier's own item number, which is useful
    on a spec table and noise at the front of a product name.
    """
    m = ITEM_CODE.match(raw)
    return (m.group(1), raw[m.end():].strip()) if m else (None, raw)


MEASURE = re.compile(
    r"""[\d/\.\-]+\s*(?:"|''|'|MM|CM|IN)\s*[XxÃ—*]\s*[\d/\.\-]+\s*(?:"|''|'|MM|CM|IN)?"""
    r"""(?:\s*[XxÃ—*]\s*[\d/\.\-]+\s*(?:"|''|'|MM|CM)?)?""",
    re.I,
)


def measurement_in(title: str):
    """The size written into the title, for rows with no Size tag."""
    m = MEASURE.search(title)
    return m.group(0).strip() if m else None


def title_case(raw: str) -> str:
    out = []
    for i, token in enumerate(raw.split()):
        if any(ch.isdigit() for ch in token):
            out.append(token)                       # size or model code
            continue
        bare = re.sub(r"[^A-Za-z]", "", token)
        if bare.upper() in ACRONYMS and len(bare) > 1:
            out.append(token.upper())
            continue
        low = token.lower()
        if i > 0 and low in LOWER_WORDS:
            out.append(low)
            continue
        # Capitalise across hyphens and slashes: "cold-water" -> "Cold-Water"
        out.append(re.sub(r"[A-Za-z]+", lambda m: m.group(0).capitalize(), low))
    return " ".join(out)


def slugify(raw: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", raw.lower()).strip("-")
    return s[:110] or "product"


def sql(value) -> str:
    """A SQL literal. Single quotes doubled, nothing else interpolated."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return repr(value)
    return "'" + str(value).replace("'", "''") + "'"


def parse_tags(raw: str) -> dict:
    """Shopify writes tags as "Key_Value; Key_Value". Keep the last of each."""
    out = {}
    for part in (raw or "").split(";"):
        part = part.strip()
        if "_" in part:
            key, _, val = part.partition("_")
            out.setdefault(key.strip().lower(), []).append(val.strip())
    return out


UNIT_RULES = [
    (r"/\s*SF\b|\bPER SF\b", "sq ft"),
    (r"/\s*FT\b|\bPER FT\b|\bLIN(?:EAL)? FT\b", "ft"),
    (r"\bBOX\b", "box"),
    (r"\bROLL\b", "roll"),
    (r"\bBAG\b", "bag"),
    (r"\bSHEET\b", "sheet"),
    (r"\d\s*PC(?:S)?\b|\bPACK\b|\bPK\b", "pack"),
    (r"\bPAIL\b|\bBUCKET\b", "pail"),
]


def unit_for(title: str) -> str:
    upper = title.upper()
    for pattern, unit in UNIT_RULES:
        if re.search(pattern, upper):
            return unit
    return "each"


def describe(name, category, tags, brand, sku, pickup_only, unit) -> str:
    """
    A description built only from what the row states.

    No performance claims, no dimensions that are not in the tags, no
    "ideal for" — those would be fiction, and a catalogue of 3,405
    fictions is worse than a catalogue of short truths.
    """
    kind = (tags.get("type") or [None])[0]
    colour = (tags.get("color") or tags.get("colour") or [None])[0]
    size = (tags.get("size") or [None])[0] or measurement_in(name)
    style = (tags.get("style") or [None])[0]

    lead = kind or CATEGORY_LABEL.get(category, "Building supplies")
    # Types arrive title-cased ("Bathroom Accessories"); mid-sentence
    # they should read as words, not as a heading.
    lead = lead if lead.isupper() else lead[0].upper() + lead[1:].lower()

    first = lead
    if style:
        first += f", {style.lower()} style"
    if size:
        first += f", {size}"
    if colour:
        first += f" in {colour.lower()}"
    first += "."

    where = f"Part of our {CATEGORY_LABEL.get(category, 'catalogue')} range"
    if brand and brand.lower() not in ("zion", "zion building supplies"):
        where += f", supplied by {brand}"
    where += "."

    sold = "" if unit == "each" else f"Sold by the {unit}."

    last = (
        "Available for in-store pickup."
        if pickup_only
        else "Delivered across the GTA."
    )
    if sku:
        last = f"SKU {sku}. " + last

    return " ".join(x for x in (first, where, sold, last) if x)


def main():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb["Products"]
    rows = list(ws.iter_rows(values_only=True))
    head, data = rows[0], rows[1:]
    idx = {h: i for i, h in enumerate(head)}

    seen_ids, seen_slugs = set(), set()
    products, unmapped, per_cat = [], [], collections.Counter()

    for r in data:
        title = (r[idx["title"]] or "").strip()
        if not title:
            continue
        handle = (r[idx["handle"]] or "").strip()
        ptype = (r[idx["product_type"]] or "").strip()
        tags_raw = r[idx["tags"]] or ""
        tags = parse_tags(tags_raw)
        kind = (tags.get("type") or [None])[0]

        category = (
            TAG_TO_CATEGORY.get((ptype, kind))
            or (TYPE_TO_CATEGORY.get(ptype) if ptype not in TYPE_DEFAULT else None)
            or TYPE_DEFAULT.get(ptype)
        )
        if not category:
            low = title.lower()
            for word, cat in KEYWORD_TO_CATEGORY:
                if word in low:
                    category = cat
                    break
        if not category:
            category = "hardware"
            unmapped.append(title)

        item_code, title = split_item_code(title)
        pickup_only = "InStoreOnly" in tags_raw
        sku = (r[idx["sku"]] or "").strip()
        brand_raw = (r[idx["vendor"]] or "").strip()
        brand = "Zion Building Supplies" if brand_raw.lower() in (
            "zion", "zion building supplies") else brand_raw

        price = round(float(r[idx["price"]]), 2)
        trade = round(price * (1 - TRADE_DISCOUNT), 2)

        """
        The id is what /products/<id> shows a customer, so it is built
        from the product name rather than the Shopify handle: the handles
        are full of editing history ("...-round-led-mirror-copy" on a
        frameless mirror) and that history would be the URL.

        The trade-off is stability — a renamed product gets a new id on
        the next import. The SKU is stored on every row, so a future
        refresh can match on that instead of guessing from the name.
        """
        base = slugify(title_case(title)) or slugify(handle)
        pid, slug = f"zn-{base}"[:120], base
        n = 2
        while pid in seen_ids or slug in seen_slugs:
            pid, slug = f"zn-{base}-{n}"[:120], f"{base}-{n}"
            n += 1
        seen_ids.add(pid)
        seen_slugs.add(slug)

        specs = []
        for label, key in (("Type", "type"), ("Colour", "color"),
                           ("Size", "size"), ("Style", "style")):
            vals = tags.get(key)
            if vals:
                specs.append({"label": label, "value": ", ".join(dict.fromkeys(vals))})
        if item_code:
            specs.append({"label": "Item code", "value": item_code})
        if sku:
            specs.append({"label": "SKU", "value": sku})
        if brand:
            specs.append({"label": "Brand", "value": brand})

        created = (r[idx["created_at"]] or "")[:25] or None

        products.append({
            "id": pid,
            # Kept so scripts/attach-images.py can join the Shopify
            # export back onto the id this import generated.
            "handle": handle,
            "name": title_case(title),
            "slug": slug,
            "description": describe(title, category, tags, brand, sku,
                                    pickup_only, unit_for(title)),
            "category_id": category,
            "brand": brand,
            "sku": sku or None,
            "price": price,
            "contractor_price": trade,
            "unit": unit_for(title),
            "stock_status": "in-stock" if str(r[idx["available"]]).lower() == "true" else "out-of-stock",
            "delivery_estimate": "In-store pickup only" if pickup_only else "Lead time confirmed at order",
            "image_tone": TONE_BY_CATEGORY.get(category, "slate"),
            "specifications": json.dumps(specs, ensure_ascii=False),
            "created_at": created,
        })
        per_cat[category] += 1

    print(f"products: {len(products)}   unmapped -> hardware: {len(unmapped)}")
    for c, n in per_cat.most_common():
        print(f"   {n:5}  {c}")
    print("\nsample names:")
    for p in products[:12]:
        print(f"   {p['name'][:58]:60} {p['category_id']:14} {p['unit']:7} ${p['price']}")
    print("\nsample description:\n   ", products[0]["description"])
    print("   ", products[300]["description"])
    return products


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Emit
# ---------------------------------------------------------------------------

HEADER = """-- ===========================================================================
-- {title}
--
-- Generated from images/zionbuildingsupplies_products_3405.xlsx by the
-- transform in the commit that added this file. Do not hand-edit: change
-- the transform and regenerate, or the next export will overwrite it.
--
-- Safe to re-run. Every product upserts on its primary key, so running
-- part 2 twice updates 3,405 rows rather than duplicating them.
-- ===========================================================================
"""

CHUNK = 900


def emit(products):
    # --- new departments ---------------------------------------------------
    lines = [HEADER.format(title="15 — Departments the real catalogue needs")]
    lines.append("""
-- Six departments the seeded catalogue never had, because nothing was
-- stocked in them. The import fills all six.
insert into public.product_categories (id, name, slug, icon, sort_order) values""")
    rows = [
        f"  ({sql(i)}, {sql(n)}, {sql(s)}, {sql(ic)}, {so})"
        for i, n, s, ic, so in NEW_CATEGORIES
    ]
    lines.append(",\n".join(rows))
    lines.append("""on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      icon = excluded.icon,
      sort_order = excluded.sort_order;
""")
    io.open(f"{OUT_DIR}/schema-15-new-departments.sql", "w",
            encoding="utf-8", newline="\n").write("\n".join(lines))

    # --- products ----------------------------------------------------------
    cols = ("id, name, slug, description, category_id, brand, sku, price, "
            "homeowner_price, contractor_price, unit, stock_status, "
            "stock_quantity, rating, review_count, delivery_estimate, "
            "image_tone, specifications, created_at")
    parts = [products[i:i + CHUNK] for i in range(0, len(products), CHUNK)]
    for n, part in enumerate(parts, start=1):
        out = [HEADER.format(
            title=f"16 — Real catalogue, part {n} of {len(parts)} "
                  f"({len(part)} products)")]
        out.append(f"""
-- rating and review_count are deliberately 0: the export carries none,
-- and a seeded review score would make "Top rated" rank on fiction.
insert into public.products
  ({cols})
values""")
        vals = []
        for p in part:
            created = f"{sql(p['created_at'])}::timestamptz" if p["created_at"] else "now()"
            vals.append(
                f"  ({sql(p['id'])}, {sql(p['name'])}, {sql(p['slug'])},\n"
                f"   {sql(p['description'])},\n"
                f"   {sql(p['category_id'])}, {sql(p['brand'])}, {sql(p['sku'])},\n"
                f"   {p['price']}, {p['price']}, {p['contractor_price']}, "
                f"{sql(p['unit'])}, {sql(p['stock_status'])}, 0, 0, 0,\n"
                f"   {sql(p['delivery_estimate'])}, {sql(p['image_tone'])},\n"
                f"   {sql(p['specifications'])}::jsonb, {created})"
            )
        out.append(",\n".join(vals))
        out.append("""on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      category_id = excluded.category_id,
      brand = excluded.brand,
      sku = excluded.sku,
      price = excluded.price,
      homeowner_price = excluded.homeowner_price,
      contractor_price = excluded.contractor_price,
      unit = excluded.unit,
      stock_status = excluded.stock_status,
      delivery_estimate = excluded.delivery_estimate,
      image_tone = excluded.image_tone,
      specifications = excluded.specifications,
      is_active = true,
      updated_at = now();
""")
        io.open(f"{OUT_DIR}/schema-16-products-{n}.sql", "w",
                encoding="utf-8", newline="\n").write("\n".join(out))

    print(f"\nwrote {len(parts)} product files of up to {CHUNK} rows")
    return len(parts)


if __name__ == "__main__":
    emit(main())
