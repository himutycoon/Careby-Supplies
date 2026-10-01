import { createClient } from "@/lib/supabase/client";
import { rankByFit, wordForms } from "@/lib/rules/product-fit";
import type { Product, ProductCategory, StockStatus } from "@/lib/types";

export type ProductSort =
  | "popular"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export interface ProductQuery {
  search?: string;
  /**
   * Only products marked as answering this job, e.g. "tile".
   *
   * The aisle says where a product is kept; a tag says what it is for,
   * which is the question a suggestion actually asks. Where nothing
   * carries the tag the caller falls back to the aisle, so tagging can
   * be done one at a time rather than all at once.
   */
  tag?: string | null;
  /**
   * Any one of several tags — a checklist stage is rarely one word.
   *
   * "Waterproofing" is bought out of membranes, sealants and flashing,
   * and a product answers the stage by carrying any one of them. Takes
   * precedence over `tag` when both are given.
   */
  tags?: string[] | null;
  categoryId?: string | null;
  /**
   * Several categories at once, for screens that suggest materials for a
   * job rather than browsing one aisle — a kitchen renovation needs
   * cabinetry, tile and lighting, not just plumbing. Takes precedence
   * over `categoryId` when both are given.
   */
  categoryIds?: string[] | null;
  minPrice?: number;
  maxPrice?: number;
  stock?: StockStatus[];
  /** Exact brand names, from getProductBrands(). */
  brands?: string[];
  /** Minimum star rating, e.g. 4 for "4 stars and up". */
  minRating?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  useContractorPrice?: boolean;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  priceBounds: { min: number; max: number };
}

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  category_id: string | null;
  price: number;
  homeowner_price: number;
  contractor_price: number;
  unit: string;
  rating: number;
  review_count: number;
  stock_status: StockStatus;
  delivery_estimate: string;
  description: string;
  specifications: { label: string; value: string }[] | null;
  tags: string[] | null;
  image_tone: Product["tone"] | null;
  image_url: string | null;
  created_at: string;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id ?? "",
    priceCad: Number(row.homeowner_price ?? row.price),
    contractorPriceCad: Number(row.contractor_price),
    unit: row.unit,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    stock: row.stock_status,
    deliveryEstimate: row.delivery_estimate,
    description: row.description,
    specifications: row.specifications ?? [],
    tags: row.tags ?? [],
    tone: row.image_tone ?? "slate",
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id,name,brand,category_id,price,homeowner_price,contractor_price,unit,rating,review_count,stock_status,delivery_estimate,description,specifications,tags,image_tone,image_url,created_at";

/**
 * How many matches a search ranks before showing a page of them.
 *
 * Large enough that the good answer is almost always inside it — "tile"
 * matches 265 — and small enough to stay one request. Past this, a
 * search is too broad to rank usefully anyway and wants narrowing.
 */
const SEARCH_RANK_WINDOW = 200;

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("id,name,icon,image_url")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    icon: (row.icon as string) ?? "Boxes",
    imageUrl: (row.image_url as string | null) ?? undefined,
  }));
}

/**
 * Free-text search across everything a shopper might type.
 *
 * Name and brand alone were not enough: the field invites "SKU or
 * category", and the home page asks "what are you working on", so
 * "tools", "drill" or "waterproof" all returned nothing and read as a
 * broken search. Description, SKU and the category name match too.
 *
 * Every whitespace-separated word must match *something* — chained
 * .or() groups are ANDed by PostgREST — so "brass faucet" finds the
 * Brass Bathroom Faucet, which a single `%brass faucet%` LIKE cannot.
 *
 * Returns one or() clause per word. Kept synchronous and separate from
 * the request: a PostgrestFilterBuilder is thenable, so handing it to
 * an async helper would await — and so run — the query early.
 */
function searchTokens(search: string): string[] {
  // A comma, parenthesis or quote would be read as filter syntax by
  // PostgREST rather than as text, so they are dropped rather than
  // escaped. Five words is plenty and keeps the query URL sane.
  return search
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[,()"'\\%]/g, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * Each word a shopper typed, with the forms a product might use.
 *
 * "Waterproofing" matched five products and none of them was the
 * waterproofing membrane, which is called Waterproof. "Tiles" found
 * nothing that "tile" finds. The original word is always kept, so this
 * only ever widens.
 */
function expandedTokens(search: string): string[][] {
  return searchTokens(search).map((token) => wordForms(token));
}

/** Category ids whose name or id contains the token. */
function categoriesMatching(
  token: string,
  categories: ProductCategory[],
): string[] {
  return categories
    .filter(
      (category) =>
        category.name.toLowerCase().includes(token) ||
        category.id.toLowerCase().includes(token),
    )
    .map((category) => category.id);
}

/**
 * The shop's own words that this search is asking for.
 *
 * Split in two because the difference matters when ranking. Typing
 * "tile" names the tag "tile" outright; it also appears inside "glass
 * and tile drill bits", which is a drill bit. Both are worth finding
 * and they are emphatically not worth the same, so an exact hit and a
 * mention inside a longer tag are returned separately.
 *
 * Matched as whole words, so "tile" does not claim "ceiling tiles".
 */
function tagsMatching(
  search: string,
  groups: string[][],
  vocabulary: string[],
): { exact: string[]; partial: string[] } {
  const phrase = search.toLowerCase().trim().replace(/\s+/g, " ");
  const forms = groups.flat();
  const wanted = new Set([phrase, ...forms]);

  const exact: string[] = [];
  const partial: string[] = [];

  for (const tag of vocabulary) {
    const lower = tag.toLowerCase();
    if (wanted.has(lower)) {
      exact.push(tag);
      continue;
    }
    const words = lower.split(/[^a-z0-9]+/).filter(Boolean);
    if (forms.some((form) => words.includes(form))) partial.push(tag);
  }

  return { exact, partial };
}

/**
 * How well a row answers the search, so the best match leads.
 *
 * Matching was never the problem. "Tile" already found 265 products,
 * because the word appears in the description of cement, of tile glue
 * and of pressure-treated wood — and cement came back first. The
 * catalogue's actual tiles are named for their pattern, "Plata Perla
 * Grigia Hexagon Polished Glazed Porcelain Mosaic", and never say the
 * word at all; they were found by their category and then buried.
 *
 * So: a name beats a description, a whole word beats a fragment, and
 * being in the aisle the word names beats mentioning it in passing.
 * Nothing subtle — it only has to put a tile above a bag of cement.
 *
 * Tags now sit above all of it, because a tag is the only signal here
 * that somebody asserted rather than something we inferred from prose.
 * An exact one outranks the aisle; a mention inside a longer tag is
 * worth very little, or searching "tile" would lead with the tile drill
 * bits — which say "tile" twice and are not tiles.
 */
function relevance(
  row: ProductRow,
  groups: string[][],
  categories: ProductCategory[],
  tagMatches: { exact: string[]; partial: string[] },
): number {
  const name = (row.name ?? "").toLowerCase();
  const brand = (row.brand ?? "").toLowerCase();
  const description = (row.description ?? "").toLowerCase();
  const tags = row.tags ?? [];

  let score = 0;

  // Once per product, not once per token: a product carrying three of
  // the matched tags is not three times the answer.
  if (tagMatches.exact.some((tag) => tags.includes(tag))) score += 9;
  else if (tagMatches.partial.some((tag) => tags.includes(tag))) score += 2;

  // One score per word the shopper typed, taking its best form —
  // "waterproofing" and "waterproof" are one word, not two, and a
  // product saying both must not score double for it.
  for (const forms of groups) {
    let best = 0;
    for (const token of forms) {
      let here = 0;
      /*
       * The aisle outranks the name. Searching "insulation" used to put
       * insulation PINS above insulation, because the pins say the word
       * and a batt is called "R-12 OC Batts". Naming the aisle is the
       * strongest evidence a product IS the thing being asked for.
       */
      if (
        row.category_id &&
        categoriesMatching(token, categories).includes(row.category_id)
      ) {
        here += 8;
      }
      if (name.includes(token)) {
        /*
         * A whole word only. "Flextile" contains "tile" and a
         * waterproof membrane is not a tile; scoring fragments highly
         * is how it got to the top of the tile results.
         */
        const wholeWord = new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`);
        here += wholeWord.test(name) ? 6 : 2;
      }
      if (brand.includes(token)) here += 2;
      if (description.includes(token)) here += 1;
      best = Math.max(best, here);
    }
    score += best;
  }
  return score;
}

function searchClauses(
  search: string,
  categories: ProductCategory[],
  tagMatches: { exact: string[]; partial: string[] },
): string[] {
  // Any tag this search names at all, so a product whose name never
  // says the word is still found by what it was marked up as.
  const matchedTags = [...tagMatches.exact, ...tagMatches.partial];

  return expandedTokens(search).map((forms) => {
    // Every form of the word goes in the same or() group, so the group
    // still means "this word matched somewhere" and the groups are
    // still ANDed together across words.
    const clauses = forms.flatMap((token) => [
      `name.ilike.%${token}%`,
      `brand.ilike.%${token}%`,
      `description.ilike.%${token}%`,
      `sku.ilike.%${token}%`,
    ]);

    const matched = [
      ...new Set(forms.flatMap((token) => categoriesMatching(token, categories))),
    ];
    if (matched.length > 0) {
      clauses.push(`category_id.in.(${matched.join(",")})`);
    }

    if (matchedTags.length > 0) {
      // ov = overlaps: carries any one of them. Quoted because tags
      // contain spaces and ampersands.
      const list = matchedTags.map((tag) => `"${tag}"`).join(",");
      clauses.push(`tags.ov.{${list}}`);
    }

    return clauses.join(",");
  });
}

export async function getProducts(
  query: ProductQuery = {},
): Promise<ProductPage> {
  const {
    search = "",
    tag = null,
    tags = null,
    categoryId = null,
    categoryIds = null,
    minPrice,
    maxPrice,
    stock,
    brands,
    minRating,
    sort = "popular",
    page = 1,
    pageSize = 9,
    useContractorPrice = false,
  } = query;

  const supabase = createClient();
  const priceColumn = useContractorPrice
    ? "contractor_price"
    : "homeowner_price";

  let request = supabase
    .from("products")
    .select(SELECT, { count: "exact" })
    .eq("is_active", true);

  /*
   * `overlaps` for a list, `contains` for one: either way the column is
   * an array and a product carries several, so this asks "does this
   * product answer any of these", not "all of them".
   */
  if (tags && tags.length > 0) {
    request = request.overlaps("tags", tags);
  } else if (tag) {
    request = request.contains("tags", [tag]);
  }
  if (categoryIds && categoryIds.length > 0) {
    request = request.in("category_id", categoryIds);
  } else if (categoryId) {
    request = request.eq("category_id", categoryId);
  }
  /*
   * Resolved once and reused by both the filter and the ranking below,
   * so a search costs two small lookups rather than four.
   */
  let tagMatches: { exact: string[]; partial: string[] } = {
    exact: [],
    partial: [],
  };
  if (search.trim()) {
    // Categories and the tag vocabulary are small and cached, fetched
    // so the shop's own words can take part in an or() group against
    // the products table.
    const [searchCategories, vocabulary] = await Promise.all([
      getProductCategories(),
      getProductTagsInUse(),
    ]);
    tagMatches = tagsMatching(search, expandedTokens(search), vocabulary);
    for (const clause of searchClauses(search, searchCategories, tagMatches)) {
      request = request.or(clause);
    }
  }
  if (typeof minPrice === "number") {
    request = request.gte(priceColumn, minPrice);
  }
  if (typeof maxPrice === "number") {
    request = request.lte(priceColumn, maxPrice);
  }
  if (stock && stock.length > 0) {
    request = request.in("stock_status", stock);
  }
  if (brands && brands.length > 0) {
    request = request.in("brand", brands);
  }
  if (typeof minRating === "number" && minRating > 0) {
    request = request.gte("rating", minRating);
  }

  if (sort === "newest") {
    request = request.order("created_at", { ascending: false });
  } else if (sort === "price-asc") request = request.order(priceColumn);
  else if (sort === "price-desc") {
    request = request.order(priceColumn, { ascending: false });
  } else if (sort === "rating") {
    request = request.order("rating", { ascending: false });
  } else {
    request = request.order("review_count", { ascending: false });
  }

  /*
   * Page 1..n is cumulative (load-more), so always fetch from zero.
   *
   * A search fetches a wider window than the page needs, because the
   * order the database returns is not the order a person wants: the
   * default sort is review_count, which is zero on every imported
   * product, so "tile" arrived in effectively arbitrary order. Ranking
   * has to see more rows than it shows, or it just reorders the wrong
   * ones. An explicit sort — price, newest — is the customer asking for
   * a specific order, and is left alone.
   */
  const end = page * pageSize;
  const ranking = Boolean(search.trim()) && sort === "popular";
  const fetchTo = ranking ? Math.max(end, SEARCH_RANK_WINDOW) : end;
  const { data, error, count } = await request.range(0, fetchTo - 1);

  if (error || !data) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
      priceBounds: { min: 0, max: 1000 },
    };
  }

  const bounds = await getPriceBounds(useContractorPrice);
  const total = count ?? data.length;

  let rows = data as unknown as ProductRow[];
  if (ranking) {
    const groups = expandedTokens(search);
    const categories = await getProductCategories();
    rows = [...rows]
      .map((row) => ({
        row,
        score: relevance(row, groups, categories, tagMatches),
      }))
      // Name as the tiebreak, so equal scores do not shuffle between
      // loads and "load more" cannot show the same product twice.
      .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name))
      .slice(0, end)
      .map((entry) => entry.row);
  }

  return {
    items: rows.map(mapProduct),
    total,
    page,
    pageSize,
    hasMore: end < total,
    priceBounds: bounds,
  };
}

async function getPriceBounds(
  useContractorPrice: boolean,
): Promise<{ min: number; max: number }> {
  // Two round trips, and getProducts runs on every keystroke, every
  // filter change and every "show more". The answer is a property of
  // the catalogue, not of the query, so it is fetched once.
  const key = useContractorPrice ? "contractor" : "homeowner";
  const cached = boundsCache.get(key);
  if (cached) return cached;

  const pending = loadPriceBounds(useContractorPrice);
  boundsCache.set(key, pending);
  return pending;
}

async function loadPriceBounds(
  useContractorPrice: boolean,
): Promise<{ min: number; max: number }> {
  const supabase = createClient();
  const column = useContractorPrice ? "contractor_price" : "homeowner_price";

  const [{ data: low }, { data: high }] = await Promise.all([
    supabase
      .from("products")
      .select(column)
      .eq("is_active", true)
      .order(column)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select(column)
      .eq("is_active", true)
      .order(column, { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const min = low ? Number((low as Record<string, unknown>)[column]) : 0;
  const max = high ? Number((high as Record<string, unknown>)[column]) : 1000;
  return { min: Math.floor(min), max: Math.ceil(max) };
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data as unknown as ProductRow);
}

/**
 * Reads one column across every matching row, a page at a time.
 *
 * PostgREST answers with at most 1,000 rows and says nothing about the
 * ones it left out, so a facet built from a single select is a facet
 * built from whatever happened to come back first. The tag filter was
 * missing 30 of its 142 types and the brand filter most of its brands,
 * both silently, both looking perfectly normal on screen.
 *
 * Ordered by id so the pages tile rather than overlap.
 */
async function readColumn<T>(column: string): Promise<T[]> {
  const supabase = createClient();
  const PAGE = 1000;
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select(column)
      .eq("is_active", true)
      .order("id")
      .range(from, from + PAGE - 1);

    if (error || !data) break;
    rows.push(...(data as unknown as T[]));
    if (data.length < PAGE) break;
  }

  return rows;
}

/*
 * Facets change when the shop edits the catalogue, not while someone is
 * shopping, and search now reads the tag list on every keystroke. One
 * fetch per page load is the right number.
 */
let tagCache: Promise<string[]> | null = null;
let brandCache: Promise<string[]> | null = null;
let boundsCache = new Map<string, Promise<{ min: number; max: number }>>();

/** Drops the cached facets, for admin screens that just changed them. */
export function clearCatalogueFacetCache(): void {
  tagCache = null;
  brandCache = null;
  boundsCache = new Map();
}

/**
 * Every tag in use, for the catalogue's type filter.
 *
 * The aisle is broad — 897 plumbing items — and a shopper thinks in
 * narrower terms than that. Tags are the narrower term, so the list is
 * whatever the shop has actually marked up rather than a fixed menu.
 */
export async function getProductTagsInUse(): Promise<string[]> {
  // Before schema-25 there is no column; readColumn returns nothing and
  // an empty list simply hides the filter rather than breaking the page.
  tagCache ??= readColumn<{ tags: string[] | null }>("tags").then((rows) => {
    const seen = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tags ?? []) seen.add(tag);
    }
    return [...seen].sort();
  });
  return tagCache;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .in("id", ids);

  if (error || !data) return [];
  return (data as unknown as ProductRow[]).map(mapProduct);
}

/**
 * Parts for a repair, best answer first.
 *
 * Tags first and separately. "Clogged drain" used to mean: fetch every
 * product in plumbing and hardware, which is 1,330 and so came back as
 * whatever 1,000 PostgREST felt like, rank them on whether the word
 * "drain" appears anywhere, and hand all thousand to a page that drew
 * every one of them as a card. The tagged query asks for the 40 things
 * the shop calls washroom drains instead.
 *
 * The aisles stay as the fallback, because a tag nobody has applied yet
 * must not turn into an empty screen — but they are a fallback now, and
 * they come back capped.
 */
export async function getProductsForRepair(
  categoryId: string | string[],
  keywords: string[] = [],
  tags: string[] = [],
  limit = 24,
): Promise<Product[]> {
  const categories = (
    Array.isArray(categoryId) ? categoryId : [categoryId]
  ).filter(Boolean);

  const need = { tags, keywords };

  if (tags.length > 0) {
    const tagged = await getProducts({
      tags,
      categoryIds: categories.length > 0 ? categories : null,
      pageSize: 120,
    });
    /*
     * Tagged but in the wrong aisle is still better than untagged: a
     * flooring repair finds its tiles whether or not somebody filed
     * them where this flow expects. Only ask again if the aisle filter
     * emptied the result.
     */
    const pool =
      tagged.items.length > 0
        ? tagged.items
        : (await getProducts({ tags, pageSize: 120 })).items;

    if (pool.length > 0) return rankByFit(pool, need, limit);
  }

  if (categories.length === 0) return [];

  const page = await getProducts({ categoryIds: categories, pageSize: 200 });
  return rankByFit(page.items, need, limit);
}

/**
 * Distinct brands in the live catalog, for the brand filter.
 *
 * Derived from the products themselves rather than a hardcoded list, so
 * the facet always matches what is actually for sale.
 */
export async function getProductBrands(): Promise<string[]> {
  brandCache ??= readColumn<{ brand: string | null }>("brand").then((rows) => {
    const unique = new Set(
      rows
        .map((row) => row.brand?.trim())
        .filter((brand): brand is string => Boolean(brand)),
    );
    return [...unique].sort((a, b) => a.localeCompare(b));
  });
  return brandCache;
}
