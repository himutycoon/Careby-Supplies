import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { wordForms } from "@/lib/rules/product-fit";

/**
 * Everything the AI assistant reads at answer time:
 *  - knowledge entries edited at /admin/chatbot (schema-29)
 *  - live product search over public.products, so SKUs, prices and stock
 *    are whatever Admin > Products says right now.
 *
 * Uses the publishable key, so RLS decides what is visible: only enabled
 * knowledge and active products, exactly what a visitor could see.
 */

export type KnowledgeEntry = {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
};

export type BotProduct = {
  id: string;
  name: string;
  sku: string | null;
  brand: string;
  category: string;
  price: number;
  unit: string;
  stock: string;
  delivery: string;
  imageUrl: string | null;
  url: string;
};

let sb: SupabaseClient | null = null;
function client() {
  sb ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  return sb;
}

// Admin edits show up within 30 seconds without hitting the DB per message.
const TTL = 30_000;
let kbCache: { at: number; entries: KnowledgeEntry[] } | null = null;
let catCache: { at: number; cats: { id: string; name: string }[] } | null = null;

export async function loadKnowledge(): Promise<KnowledgeEntry[]> {
  if (kbCache && Date.now() - kbCache.at < TTL) return kbCache.entries;
  const { data, error } = await client()
    .from("chatbot_knowledge")
    .select("id, title, category, content, keywords")
    .eq("enabled", true)
    .order("sort_order");
  if (error) {
    // schema-29 not run yet: answer without it rather than fail.
    console.error("[chatbot] knowledge load failed:", error.message);
    return kbCache?.entries ?? [];
  }
  const entries = (data ?? []).map((r) => ({ ...r, keywords: r.keywords ?? [] })) as KnowledgeEntry[];
  kbCache = { at: Date.now(), entries };
  return entries;
}

export async function loadCategories() {
  if (catCache && Date.now() - catCache.at < TTL) return catCache.cats;
  const { data } = await client().from("product_categories").select("id, name").eq("is_active", true).order("sort_order");
  catCache = { at: Date.now(), cats: data ?? [] };
  return catCache.cats;
}

const STOP = new Set(
  "a an the is are do does you i to of for and in on it can me my we your have has what how with please get there any need want u our this that be or".split(" "),
);

export function terms(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s/-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !STOP.has(w))
        .flatMap((w) => (w.length >= 3 ? wordForms(w) : [w])),
    ),
  ];
}

/**
 * The knowledge to put in front of the model. All of it while it fits the
 * budget (usual case); past that, the entries that best match the
 * conversation, so a large knowledge base still works.
 */
export function pickKnowledge(entries: KnowledgeEntry[], conversation: string, budget = 14000): KnowledgeEntry[] {
  const total = entries.reduce((n, e) => n + e.title.length + e.content.length + 20, 0);
  if (total <= budget) return entries;

  const q = terms(conversation);
  const scored = entries.map((e, i) => {
    const kw = e.keywords.join(" ").toLowerCase();
    const title = e.title.toLowerCase();
    const body = e.content.toLowerCase();
    let s = 0;
    for (const t of q) {
      if (kw.includes(t)) s += 3;
      if (title.includes(t)) s += 2;
      if (body.includes(t)) s += 1;
    }
    return { e, s, i };
  });
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  const out: KnowledgeEntry[] = [];
  let used = 0;
  for (const { e } of scored) {
    const size = e.title.length + e.content.length + 20;
    if (used + size > budget) continue;
    out.push(e);
    used += size;
  }
  return out;
}

const PRODUCT_COLS =
  "id, name, sku, brand, description, tags, homeowner_price, unit, stock_status, delivery_estimate, image_url, category_id, specifications";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  brand: string;
  description: string;
  tags: string[] | null;
  homeowner_price: number;
  unit: string;
  stock_status: string;
  delivery_estimate: string;
  image_url: string | null;
  category_id: string | null;
  specifications: unknown;
};

async function toBotProduct(r: ProductRow): Promise<BotProduct> {
  const cats = await loadCategories();
  return {
    id: r.id,
    name: r.name,
    sku: r.sku,
    brand: r.brand,
    category: cats.find((c) => c.id === r.category_id)?.name ?? "",
    price: Number(r.homeowner_price),
    unit: r.unit,
    stock: r.stock_status,
    delivery: r.delivery_estimate,
    imageUrl: r.image_url,
    url: `/products/${r.id}`,
  };
}

// PostgREST .or() filter values can't contain these.
const safe = (s: string) => s.replace(/[,()*%\\"]/g, " ").trim();

export async function searchProducts(opts: {
  query: string;
  category?: string;
  maxPrice?: number;
  limit?: number;
}): Promise<BotProduct[]> {
  const limit = Math.min(Math.max(opts.limit ?? 6, 1), 10);
  const raw = safe(opts.query).slice(0, 120);
  const words = terms(raw).slice(0, 6);
  if (!raw && !opts.category) return [];

  let q = client().from("products").select(PRODUCT_COLS).eq("is_active", true);

  if (opts.category) {
    const cats = await loadCategories();
    const c = opts.category.toLowerCase();
    const hit = cats.find((x) => x.name.toLowerCase().includes(c) || x.id.includes(c));
    if (hit) q = q.eq("category_id", hit.id);
  }
  if (opts.maxPrice && opts.maxPrice > 0) q = q.lte("homeowner_price", opts.maxPrice);

  if (words.length || raw) {
    const ors = new Set<string>();
    if (raw) ors.add(`sku.ilike.%${raw}%`);
    for (const w of words) {
      ors.add(`name.ilike.%${w}%`);
      ors.add(`brand.ilike.%${w}%`);
      ors.add(`description.ilike.%${w}%`);
      ors.add(`sku.ilike.%${w}%`);
      ors.add(`tags.cs.{${w}}`);
    }
    q = q.or([...ors].join(","));
  }

  const { data, error } = await q.limit(60);
  if (error) {
    console.error("[chatbot] product search failed:", error.message);
    return [];
  }

  // Rank: exact SKU, then name hits, then tags/brand, then description.
  const rows = (data ?? []) as ProductRow[];
  const lowRaw = raw.toLowerCase();
  const ranked = rows
    .map((r) => {
      const name = r.name.toLowerCase();
      const tags = (r.tags ?? []).join(" ").toLowerCase();
      let s = 0;
      if (r.sku && r.sku.toLowerCase() === lowRaw) s += 100;
      for (const w of words) {
        if (name.includes(w)) s += 4;
        if (tags.includes(w)) s += 3;
        if (r.brand.toLowerCase().includes(w)) s += 2;
        if (r.description.toLowerCase().includes(w)) s += 1;
      }
      return { r, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, limit);

  return Promise.all(ranked.map(({ r }) => toBotProduct(r)));
}

/** One product by SKU or id, with its description and specs. */
export async function getProductDetail(ref: string) {
  const key = safe(ref).slice(0, 80);
  if (!key) return null;
  const { data } = await client()
    .from("products")
    .select(PRODUCT_COLS)
    .eq("is_active", true)
    .or(`sku.ilike.${key},id.eq.${key}`)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const r = data as ProductRow;
  return {
    ...(await toBotProduct(r)),
    description: r.description.slice(0, 800),
    specifications: Array.isArray(r.specifications) ? r.specifications.slice(0, 15) : [],
  };
}
