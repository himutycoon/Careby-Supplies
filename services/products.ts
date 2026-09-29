import { createClient } from "@/lib/supabase/client";
import type { Product, ProductCategory, StockStatus } from "@/lib/types";

export type ProductSort =
  | "popular"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export interface ProductQuery {
  search?: string;
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
    tone: row.image_tone ?? "slate",
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id,name,brand,category_id,price,homeowner_price,contractor_price,unit,rating,review_count,stock_status,delivery_estimate,description,specifications,image_tone,image_url,created_at";

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
 */
function relevance(
  row: ProductRow,
  tokens: string[],
  categories: ProductCategory[],
): number {
  const name = (row.name ?? "").toLowerCase();
  const brand = (row.brand ?? "").toLowerCase();
  const description = (row.description ?? "").toLowerCase();

  let score = 0;
  for (const token of tokens) {
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
      score += 8;
    }
    if (name.includes(token)) {
      /*
       * A whole word only. "Flextile" contains "tile" and a waterproof
       * membrane is not a tile; scoring fragments highly is how it got
       * to the top of the tile results.
       */
      const wholeWord = new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`);
      score += wholeWord.test(name) ? 6 : 2;
    }
    if (brand.includes(token)) score += 2;
    if (description.includes(token)) score += 1;
  }
  return score;
}

function searchClauses(search: string, categories: ProductCategory[]): string[] {
  return searchTokens(search).map((token) => {
    const clauses = [
      `name.ilike.%${token}%`,
      `brand.ilike.%${token}%`,
      `description.ilike.%${token}%`,
      `sku.ilike.%${token}%`,
    ];

    const matched = categoriesMatching(token, categories);
    if (matched.length > 0) {
      clauses.push(`category_id.in.(${matched.join(",")})`);
    }

    return clauses.join(",");
  });
}

export async function getProducts(
  query: ProductQuery = {},
): Promise<ProductPage> {
  const {
    search = "",
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

  if (categoryIds && categoryIds.length > 0) {
    request = request.in("category_id", categoryIds);
  } else if (categoryId) {
    request = request.eq("category_id", categoryId);
  }
  if (search.trim()) {
    // Categories are a handful of rows, fetched so a category name can
    // take part in an or() group against the products table.
    const searchCategories = await getProductCategories();
    for (const clause of searchClauses(search, searchCategories)) {
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
    const tokens = searchTokens(search);
    const categories = await getProductCategories();
    rows = [...rows]
      .map((row) => ({ row, score: relevance(row, tokens, categories) }))
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
 * Repair recommendations: products from the relevant category, ranked by
 * how well they match the reported problem so results stay relevant.
 */
export async function getProductsForRepair(
  categoryId: string | string[],
  keywords: string[] = [],
): Promise<Product[]> {
  const categories = (
    Array.isArray(categoryId) ? categoryId : [categoryId]
  ).filter(Boolean);
  if (categories.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .in("category_id", categories);

  if (error || !data) return [];
  const products = (data as unknown as ProductRow[]).map(mapProduct);
  if (keywords.length === 0) return products;

  return products
    .map((product) => {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      const score = keywords.reduce(
        (sum, keyword) =>
          haystack.includes(keyword.toLowerCase()) ? sum + 1 : sum,
        0,
      );
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
}

/**
 * Distinct brands in the live catalog, for the brand filter.
 *
 * Derived from the products themselves rather than a hardcoded list, so
 * the facet always matches what is actually for sale.
 */
export async function getProductBrands(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("brand")
    .eq("is_active", true);

  if (error || !data) return [];

  const unique = new Set(
    data
      .map((row) => (row.brand as string | null)?.trim())
      .filter((brand): brand is string => Boolean(brand)),
  );
  return [...unique].sort((a, b) => a.localeCompare(b));
}
