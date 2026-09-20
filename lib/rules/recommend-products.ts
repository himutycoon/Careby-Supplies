/**
 * Rules layer — product recommendations.
 *
 * Pure and dependency-free, like the rest of lib/rules: it takes the
 * signals a homeowner has already given us and a candidate list, and
 * returns a ranked selection with the reason for each pick. No network,
 * no Supabase, no React — so it can be reasoned about and unit-tested on
 * its own.
 *
 * Deliberately rule-based, not statistical. There is no behavioural data
 * to learn from (no click stream, a dozen products, invented review
 * counts), so a "model" here would be noise wearing a lab coat. Everything
 * below is a stated rule that a person can read, argue with and correct.
 *
 * The hard requirement: a recommendation must be explainable. Every
 * returned item carries `reasons`, and the UI shows them. If we cannot say
 * why a product is being suggested, it should not be suggested.
 */

import type { Product, RenovationInput, RoomType, ScopeLevel } from "@/lib/types";

/** What we know about this person, gathered from their own submissions. */
export interface RecommendationSignals {
  /** Rooms they have asked us about, most recent first. */
  roomTypes: RoomType[];
  /** How deep the work goes — drives structural vs cosmetic materials. */
  scopeLevels: ScopeLevel[];
  /** Free text they wrote: wishlist lines and notes. */
  wishes: string[];
  /** Problems the report found, as labels and descriptions. */
  issues: string[];
  /** Trades the estimate costed, e.g. "Plumbing", "Electrical". */
  trades: string[];
  /** Category ids they have already bought from. */
  purchasedCategoryIds: string[];
  /** Product ids already ordered, so we don't re-sell the same item. */
  purchasedProductIds: string[];
  /** Project budget, used only to avoid suggesting absurd line items. */
  budgetCad: number | null;
}

export function emptySignals(): RecommendationSignals {
  return {
    roomTypes: [],
    scopeLevels: [],
    wishes: [],
    issues: [],
    trades: [],
    purchasedCategoryIds: [],
    purchasedProductIds: [],
    budgetCad: null,
  };
}

/** True when there is enough to personalise rather than guess. */
export function hasSignal(signals: RecommendationSignals): boolean {
  return (
    signals.roomTypes.length > 0 ||
    signals.wishes.length > 0 ||
    signals.issues.length > 0 ||
    signals.trades.length > 0 ||
    signals.purchasedCategoryIds.length > 0
  );
}

export interface Recommendation {
  product: Product;
  score: number;
  /** Shown to the user. Plain language, never jargon or scores. */
  reasons: string[];
}

/*
 * Room → the aisles that room actually needs.
 *
 * Weights are ordered by how certain the link is: a bathroom always means
 * plumbing, usually means tile, and only sometimes means lumber. Category
 * ids match the live catalogue (schema-05).
 */
const ROOM_CATEGORIES: Record<RoomType, Record<string, number>> = {
  bathroom: { plumbing: 5, flooring: 3, paint: 2, hardware: 2, electrical: 1 },
  kitchen: {
    plumbing: 4,
    electrical: 3,
    flooring: 3,
    hardware: 2,
    paint: 2,
    lumber: 1,
  },
  basement: { lumber: 4, electrical: 3, flooring: 3, paint: 2 },
  addition: {
    lumber: 5,
    roofing: 4,
    "doors-windows": 3,
    electrical: 2,
    hardware: 2,
  },
  deck: { lumber: 5, hardware: 4, tools: 2, paint: 1 },
  // Deprecated room types the wizard no longer offers, kept because old
  // submissions still carry them and must still produce sane suggestions.
  bedroom: { flooring: 4, paint: 4, electrical: 2, hardware: 1 },
  living: { flooring: 4, paint: 4, electrical: 2, hardware: 1 },
  "whole-home": {
    paint: 3,
    flooring: 3,
    electrical: 3,
    plumbing: 2,
    lumber: 2,
  },
};

/*
 * Scope → what kind of material is appropriate.
 *
 * A cosmetic refresh should never be sold framing lumber, and a full gut
 * needs the structural aisles a repaint does not.
 */
const SCOPE_CATEGORIES: Record<ScopeLevel, Record<string, number>> = {
  cosmetic: { paint: 3, hardware: 2, flooring: 2 },
  moderate: { flooring: 2, plumbing: 2, electrical: 2, paint: 1 },
  "full-gut": {
    lumber: 3,
    "doors-windows": 2,
    plumbing: 2,
    electrical: 2,
    tools: 1,
  },
};

/*
 * Words a homeowner actually types → the aisle that solves it.
 *
 * Taken from the wishlist and notes verbatim, so this maps their language
 * ("soft flooring near the tub", "better lighting over the vanity") rather
 * than ours. Matched as substrings, lowercased.
 */
const KEYWORD_CATEGORIES: { match: string[]; category: string; label: string }[] =
  [
    { match: ["shower", "tub", "bath", "faucet", "tap", "sink", "toilet", "drain", "plumb", "pipe", "leak", "water"], category: "plumbing", label: "plumbing" },
    { match: ["light", "lighting", "outlet", "switch", "wiring", "electric", "pot light", "fan", "ventilation", "vent"], category: "electrical", label: "lighting and power" },
    { match: ["tile", "floor", "flooring", "vinyl", "laminate", "hardwood", "carpet", "subfloor"], category: "flooring", label: "flooring" },
    { match: ["paint", "colour", "color", "primer", "wall", "drywall", "finish"], category: "paint", label: "paint and finishes" },
    { match: ["door", "window", "frame", "entry", "glazing"], category: "doors-windows", label: "doors and windows" },
    { match: ["roof", "shingle", "gutter", "soffit", "eaves"], category: "roofing", label: "roofing" },
    { match: ["framing", "stud", "joist", "beam", "lumber", "wood", "deck", "structural"], category: "lumber", label: "lumber" },
    { match: ["handle", "knob", "hinge", "screw", "fastener", "bracket", "hardware"], category: "hardware", label: "hardware" },
    { match: ["tool", "saw", "drill", "ladder", "compressor"], category: "tools", label: "tools" },
  ];

/** "Plumbing" from a costed trade → the plumbing aisle. */
const TRADE_CATEGORIES: Record<string, string> = {
  plumbing: "plumbing",
  electrical: "electrical",
  electric: "electrical",
  flooring: "flooring",
  tiling: "flooring",
  tile: "flooring",
  painting: "paint",
  paint: "paint",
  carpentry: "lumber",
  framing: "lumber",
  demolition: "tools",
  roofing: "roofing",
  drywall: "paint",
  hvac: "electrical",
};

function normalise(text: string): string {
  return text.toLowerCase();
}

/**
 * Builds the per-category weighting for this person.
 *
 * Exported so the reason strings and the candidate query can be derived
 * from exactly the same numbers the ranking uses.
 */
export function categoryWeights(
  signals: RecommendationSignals,
): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (category: string, amount: number) => {
    if (!category || amount <= 0) return;
    weights.set(category, (weights.get(category) ?? 0) + amount);
  };

  /*
   * Recency taper. The room someone asked about most recently is the one
   * they are working on now; an older submission still counts, but less.
   */
  signals.roomTypes.forEach((room, index) => {
    const decay = 1 / (index + 1);
    const map = ROOM_CATEGORIES[room];
    if (!map) return;
    for (const [category, weight] of Object.entries(map)) {
      add(category, weight * decay);
    }
  });

  /*
   * Scope refines the room's aisles; it must never introduce new ones.
   *
   * Applied unconditionally, "moderate" adds plumbing and flooring to
   * every job — which recommended a bathroom faucet for a deck build,
   * captioned "plumbing for your deck". Scope answers "how deep does
   * this go", not "which trades are involved", so once a room has
   * spoken it only adjusts what the room already implied. With no room
   * on file it may still seed, since then it is all we have.
   */
  const roomScoped = weights.size > 0;
  signals.scopeLevels.forEach((scope, index) => {
    const decay = 1 / (index + 1);
    const map = SCOPE_CATEGORIES[scope];
    if (!map) return;
    for (const [category, weight] of Object.entries(map)) {
      if (roomScoped && !weights.has(category)) continue;
      add(category, weight * decay);
    }
  });

  // Trades come out of the rules layer's own cost breakdown, so they are
  // the most reliable statement of what this job involves.
  for (const trade of signals.trades) {
    const key = normalise(trade).trim();
    for (const [needle, category] of Object.entries(TRADE_CATEGORIES)) {
      if (key.includes(needle)) add(category, 4);
    }
  }

  // Their own words, weighted above our inference: an explicit "better
  // lighting" beats our guess that a bathroom might need some.
  const text = [...signals.wishes, ...signals.issues].map(normalise);
  for (const entry of KEYWORD_CATEGORIES) {
    const hits = text.filter((line) =>
      entry.match.some((needle) => line.includes(needle)),
    ).length;
    if (hits > 0) add(entry.category, 3 + Math.min(hits, 3));
  }

  // Already shopping in an aisle is a mild signal they are still in it.
  for (const category of signals.purchasedCategoryIds) add(category, 1.5);

  return weights;
}

/** The aisles worth querying at all, best first. */
export function candidateCategoryIds(
  signals: RecommendationSignals,
): string[] {
  return [...categoryWeights(signals).entries()]
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);
}

/** Which of their phrases this product actually answers. */
function matchedPhrases(product: Product, signals: RecommendationSignals) {
  const haystack = normalise(
    `${product.name} ${product.description} ${product.brand}`,
  );
  const phrases: string[] = [];

  for (const line of [...signals.wishes, ...signals.issues]) {
    const words = normalise(line)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3);
    // Two content words in common, so "better lighting over the vanity"
    // matches a vanity light rather than anything containing "over".
    const hits = words.filter((word) => haystack.includes(word)).length;
    if (hits >= 2) phrases.push(line);
  }

  return phrases;
}

export interface RankOptions {
  count?: number;
  /**
   * Cap on how many picks may share a category. A bathroom job that
   * returns three taps is a category listing, not a recommendation.
   */
  maxPerCategory?: number;
}

/**
 * Ranks candidates for this person and explains each pick.
 *
 * Returns fewer than `count` rather than padding with filler: an honest
 * short list beats three items where the third is noise.
 */
export function recommendProducts(
  products: Product[],
  signals: RecommendationSignals,
  options: RankOptions = {},
): Recommendation[] {
  const { count = 3, maxPerCategory = 1 } = options;
  const weights = categoryWeights(signals);
  const topRoom = signals.roomTypes[0];

  const scored = products
    .filter((product) => product.stock !== "out-of-stock")
    .map((product) => {
      const reasons: string[] = [];
      let score = 0;

      const categoryWeight = weights.get(product.categoryId) ?? 0;
      score += categoryWeight * 2;

      if (categoryWeight > 0 && topRoom) {
        const aisle =
          KEYWORD_CATEGORIES.find((e) => e.category === product.categoryId)
            ?.label ?? product.categoryId.replace(/-/g, " ");
        reasons.push(`${aisle} for your ${topRoom.replace(/-/g, " ")}`);
      }

      const phrases = matchedPhrases(product, signals);
      if (phrases.length > 0) {
        // Their explicit words outrank every inference above.
        score += 6 * phrases.length;
        reasons.unshift(`You mentioned: "${truncate(phrases[0], 60)}"`);
      }

      // Don't re-sell something already bought; related items still rank.
      if (signals.purchasedProductIds.includes(product.id)) score -= 8;

      /*
       * Budget sanity, not budget filtering. A single item eating a fifth
       * of the whole project budget is almost never the right suggestion,
       * but a cheap item is not automatically better, so this only
       * penalises the extreme.
       */
      if (signals.budgetCad && signals.budgetCad > 0) {
        if (product.priceCad > signals.budgetCad * 0.2) score -= 3;
      }

      // Faint tiebreakers only. Rating must never outrank relevance —
      // that is how every surface ends up showing the same popular items.
      score += Math.min(product.rating, 5) * 0.2;
      if (product.stock === "low-stock") score -= 0.5;

      return { product, score, reasons, relevant: categoryWeight > 0 || phrases.length > 0 };
    })
    /*
     * Relevance is a gate, not a score. An item in an aisle this job has
     * no use for, matching none of their words, is not a weak
     * recommendation — it is not a recommendation. Without this the
     * rating tiebreaker alone lifted every product above zero and the
     * list filled up with whatever was best reviewed.
     */
    .filter((entry) => entry.relevant && entry.score > 0)
    .sort((a, b) => b.score - a.score);

  /*
   * Floor, relative to the best match.
   *
   * A deck build scored its lumber at 34.9 and a stray faucet at 4.9;
   * both passed a "> 0" test, so the faucet was shipped as a suggestion.
   * Anything under a quarter of the leader is noise next to it, and a
   * short honest list is worth more than a padded one.
   */
  const floor = scored.length > 0 ? scored[0].score * 0.25 : 0;
  const eligible = scored.filter((entry) => entry.score >= floor);

  // Spread across aisles so the result reads as a kit for the job.
  const picked: Recommendation[] = [];
  const perCategory = new Map<string, number>();

  for (const entry of eligible) {
    if (picked.length >= count) break;
    const used = perCategory.get(entry.product.categoryId) ?? 0;
    if (used >= maxPerCategory) continue;
    perCategory.set(entry.product.categoryId, used + 1);
    picked.push(entry);
  }

  /*
   * Relax the diversity cap only among items that already cleared the
   * floor. Returning two strong picks is the correct answer when there
   * is no honest third.
   */
  if (picked.length < count) {
    for (const entry of eligible) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.product.id === entry.product.id)) continue;
      picked.push(entry);
    }
  }

  return picked.map(({ product, score, reasons }) => ({
    product,
    score,
    reasons,
  }));
}

function truncate(text: string, max: number): string {
  const clean = text.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Pulls signals out of a submission's stored input and estimate. */
export function signalsFromSubmission(
  input: RenovationInput,
  estimate?: {
    cost?: { lineItems?: { trade?: string }[] };
    vision?: { issues?: { label?: string; description?: string }[] };
  } | null,
): Pick<
  RecommendationSignals,
  "roomTypes" | "scopeLevels" | "wishes" | "issues" | "trades" | "budgetCad"
> {
  return {
    roomTypes: input.roomType ? [input.roomType] : [],
    scopeLevels: input.scopeLevel ? [input.scopeLevel] : [],
    wishes: [...(input.wishlist ?? []), input.notes ?? ""].filter(
      (line) => line.trim().length > 0,
    ),
    issues: (estimate?.vision?.issues ?? [])
      .map((issue) =>
        [issue.label, issue.description].filter(Boolean).join(" — "),
      )
      .filter((line) => line.trim().length > 0),
    trades: (estimate?.cost?.lineItems ?? [])
      .map((item) => item.trade ?? "")
      .filter(Boolean),
    budgetCad: input.budgetCad ?? null,
  };
}
