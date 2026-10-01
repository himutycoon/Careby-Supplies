/**
 * Rules layer — how well a product answers a particular need.
 *
 * Pure and dependency-free like the rest of lib/rules: it is handed
 * candidates and a description of the need, and returns them ordered.
 * No network, no Supabase, no React.
 *
 * Three things decide the order, in this order of authority:
 *
 *   1. Tags — the shop's own statement of what a thing IS. A product
 *      tagged "toilet and accessories" is a toilet part; a product that
 *      merely mentions toilets in its description is not.
 *   2. Words — the need's own keywords, against name then description.
 *   3. Budget — how close the price is to what this line is worth.
 *
 * Budget is the one that was missing everywhere. A package line carries
 * an allowance: "Toilet, $480". The portal then offered twelve products
 * from the plumbing aisle with no regard for it, so a $480 decision was
 * presented alongside $4 wax rings and $3,200 fixtures with nothing to
 * say which was in the right order of magnitude. The allowance is the
 * single best piece of budget information in the system and it was
 * being thrown away at the moment of choosing.
 *
 * Budget RANKS, it does not FILTER. Filtering to a price band empties
 * lists — the catalogue is uneven, and a band with four products in it
 * is a worse answer than a full list in a sensible order. Someone who
 * genuinely wants the cheapest thing can still sort by price.
 */

export interface ProductLike {
  id: string;
  name: string;
  description: string;
  brand: string;
  tags?: string[];
  priceCad: number;
  stock: "in-stock" | "low-stock" | "out-of-stock";
}

export interface NeedDescription {
  /** The shop's words for this need, from data/product-tags. */
  tags?: string[];
  /** The need's own words, e.g. ["faucet", "tap"]. */
  keywords?: string[];
  /**
   * What one unit of this line is budgeted at, in CAD.
   *
   * Null where nothing has set a budget — a checklist stage has no
   * allowance, only a package line does — and then price plays no part.
   */
  allowanceCad?: number | null;
  /** Package finish palette, e.g. "matte black". A nudge, never a filter. */
  finish?: string;
}

/**
 * How well the price suits a line worth `allowance`, from -3 to +4.
 *
 * The shape, in multiples of the allowance:
 *
 *   under 0.15   -3   an accessory to the thing, not the thing
 *   0.15 – 0.45  +1   a cheap one, still plausibly the thing
 *   0.45 – 1.30  +4   what this line is for
 *   1.30 – 2.00  +1   an upgrade; they may well want it
 *   over 2.00    -2   a different conversation
 *
 * Exported so the bands can be read, argued with and changed by someone
 * who knows the trade better than this file does.
 */
export function budgetScore(priceCad: number, allowanceCad: number): number {
  if (!(allowanceCad > 0) || !(priceCad > 0)) return 0;
  const ratio = priceCad / allowanceCad;
  if (ratio < 0.15) return -3;
  if (ratio < 0.45) return 1;
  if (ratio <= 1.3) return 4;
  if (ratio <= 2) return 1;
  return -2;
}

/**
 * The price range worth asking the database for, given an allowance.
 *
 * Wider than the band that scores well, because this one does filter:
 * it is a query bound, and a bound that is too tight comes back empty.
 * Call sites must be ready to drop it and ask again.
 */
export function budgetBounds(allowanceCad: number): {
  minPrice: number;
  maxPrice: number;
} {
  return {
    minPrice: Math.max(0, allowanceCad * 0.15),
    maxPrice: allowanceCad * 3,
  };
}

/*
 * Word forms, because a shopper's word and a product's word are rarely
 * the same shape.
 *
 * Someone searching "waterproofing" got five results and none of them
 * was the waterproofing membrane, which is called "Waterproof". Someone
 * searching "tiles" got nothing a search for "tile" would have found.
 * This is not a stemmer — a real one would turn "bathroom" into
 * "bathroom" and "roses" into "rose" and also "universal" into
 * "univers" — it is the two endings that actually matter here, plurals
 * and -ing, applied conservatively and always ALONGSIDE the original
 * word rather than instead of it.
 */
function singular(word: string): string | null {
  // accessories -> accessory, assemblies -> assembly
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  // brushes -> brush, latches -> latch. Stripping the bare "s" from
  // these gives "brushe" and "latche", which match nothing.
  if (/(?:sh|ch|ss|x|z)es$/.test(word)) return word.slice(0, -2);
  // "glass" and "sound" are not plurals.
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return null;
}

/** The word itself, plus its singular and -ing stem where they differ. */
export function wordForms(word: string): string[] {
  const lower = word.toLowerCase();
  const out = [lower];
  const base = singular(lower);
  if (base) out.push(base);
  // flooring -> floor, caulking -> caulk, waterproofing -> waterproof.
  if (lower.length > 6 && lower.endsWith("ing")) out.push(lower.slice(0, -3));
  return [...new Set(out)].filter((form) => form.length >= 3);
}

function wholeWord(haystack: string, token: string): boolean {
  if (!token) return false;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
}

/**
 * Scores one product against one need. Higher is a better answer.
 *
 * Exported for the same reason `budgetScore` is: the weights are the
 * argument, and they should be legible.
 */
export function fitScore(
  product: ProductLike,
  need: NeedDescription,
): number {
  const name = (product.name ?? "").toLowerCase();
  const description = (product.description ?? "").toLowerCase();
  const tags = (product.tags ?? []).map((tag) => tag.toLowerCase());

  let score = 0;

  /*
   * A tag is worth more than any number of word matches, because it is
   * the only signal here that somebody asserted rather than inferred.
   * One tag is enough; carrying four of a stage's tags does not make a
   * product four times the answer.
   */
  const needTags = (need.tags ?? []).map((tag) => tag.toLowerCase());
  if (needTags.length > 0 && needTags.some((tag) => tags.includes(tag))) {
    score += 10;
  }

  for (const raw of need.keywords ?? []) {
    const keyword = raw.toLowerCase().trim();
    if (!keyword) continue;
    if (wholeWord(name, keyword)) score += 4;
    else if (name.includes(keyword)) score += 1;
    else if (description.includes(keyword)) score += 0.5;
  }

  if (typeof need.allowanceCad === "number" && need.allowanceCad > 0) {
    score += budgetScore(product.priceCad, need.allowanceCad);
  }

  const finish = (need.finish ?? "").toLowerCase().trim();
  if (finish && (name.includes(finish) || description.includes(finish))) {
    score += 2;
  }

  // Faint, and last. Something they can actually have beats something
  // marginally more apt that they cannot.
  if (product.stock === "out-of-stock") score -= 5;
  else if (product.stock === "low-stock") score -= 0.5;

  return score;
}

/** True when there is anything here to rank on. */
export function canRank(need: NeedDescription): boolean {
  return (
    (need.tags?.length ?? 0) > 0 ||
    (need.keywords?.length ?? 0) > 0 ||
    (typeof need.allowanceCad === "number" && need.allowanceCad > 0)
  );
}

/**
 * Orders candidates by how well they answer the need.
 *
 * Stable: equal scores keep a fixed order by name, so "show more" can
 * never repeat or skip a product between loads.
 *
 * An empty need is returned untouched rather than sorted. Every product
 * would score zero, the name tiebreak would decide the whole list, and
 * this catalogue names things by size — so "suggested materials" with
 * nothing to go on would open on a 0.220x3-3/8" screw and look broken.
 * Whatever order the caller already had is at least not that.
 */
export function rankByFit<T extends ProductLike>(
  products: T[],
  need: NeedDescription,
  limit?: number,
): T[] {
  if (!canRank(need)) {
    return typeof limit === "number" ? products.slice(0, limit) : products;
  }

  const ranked = products
    .map((product) => ({ product, score: fitScore(product, need) }))
    .sort(
      (a, b) =>
        b.score - a.score || a.product.name.localeCompare(b.product.name),
    )
    .map((entry) => entry.product);

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}
