import { createClient } from "@/lib/supabase/client";
import { getProducts } from "@/services/products";
import { getOrders } from "@/services/orders";
import {
  candidateCategoryIds,
  emptySignals,
  hasSignal,
  recommendProducts,
  signalsFromSubmission,
  type Recommendation,
  type RecommendationSignals,
} from "@/lib/rules/recommend-products";
import type { Product, RenovationInput } from "@/lib/types";

/**
 * Recommendations for the signed-in homeowner.
 *
 * This layer only gathers evidence. Every judgement about what to suggest
 * and why lives in lib/rules/recommend-products, per the architecture
 * rule: services fetch, rules decide.
 */

export interface RecommendationResult {
  items: Recommendation[];
  /**
   * False when we had nothing to go on and fell back to the popular list.
   * The UI uses this to avoid claiming "for you" when it isn't.
   */
  personalised: boolean;
}

/** How many past submissions to weigh. Older ones are noise. */
const SUBMISSION_LOOKBACK = 3;

async function gatherSignals(): Promise<RecommendationSignals> {
  const signals = emptySignals();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return signals;

  // Newest first: the rules layer tapers older submissions by position.
  const { data: submissions } = await supabase
    .from("submissions")
    .select("input, estimate, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(SUBMISSION_LOOKBACK);

  for (const row of submissions ?? []) {
    const input = row.input as RenovationInput | null;
    if (!input) continue;

    const part = signalsFromSubmission(
      input,
      row.estimate as Parameters<typeof signalsFromSubmission>[1],
    );

    signals.roomTypes.push(...part.roomTypes);
    signals.scopeLevels.push(...part.scopeLevels);
    signals.wishes.push(...part.wishes);
    signals.issues.push(...part.issues);
    signals.trades.push(...part.trades);
    // The most recent submission's budget is the relevant one.
    if (signals.budgetCad === null) signals.budgetCad = part.budgetCad;
  }

  /*
   * What they have already bought. Orders carry product ids only, so the
   * categories are resolved from the catalogue rather than stored twice.
   */
  const orders = await getOrders();
  const orderedIds = [
    ...new Set(orders.flatMap((order) => order.lines.map((l) => l.productId))),
  ];

  if (orderedIds.length > 0) {
    signals.purchasedProductIds = orderedIds;
    const { data: bought } = await supabase
      .from("products")
      .select("category_id")
      .in("id", orderedIds);

    signals.purchasedCategoryIds = [
      ...new Set(
        (bought ?? [])
          .map((row) => row.category_id as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }

  return signals;
}

/**
 * Ranked, explained product suggestions for this user.
 *
 * Falls back to the popular list — and says so via `personalised: false` —
 * when the account has no submissions and no order history. Showing the
 * same three products to everyone under a "Recommended for you" heading
 * is what this replaces; the fallback is honest about being generic.
 */
export async function getRecommendedProducts(
  count = 3,
): Promise<RecommendationResult> {
  const signals = await gatherSignals();

  if (!hasSignal(signals)) {
    const popular = await getProducts({ pageSize: count });
    return {
      items: popular.items.map((product) => ({
        product,
        score: 0,
        reasons: [],
      })),
      personalised: false,
    };
  }

  /*
   * Query the aisles the signals point at rather than the whole catalogue.
   * Correct on 13 products and still correct at 13,000. A generous page
   * size because ranking needs candidates to choose between — the cap is
   * applied after scoring, not before.
   */
  const categories = candidateCategoryIds(signals).slice(0, 6);
  const pool = await getProducts({
    categoryIds: categories.length > 0 ? categories : null,
    pageSize: 60,
  });

  let candidates: Product[] = pool.items;

  // A narrow catalogue can leave the chosen aisles nearly empty; widen
  // rather than return one item.
  if (candidates.length < count * 3) {
    const wider = await getProducts({ pageSize: 60 });
    const seen = new Set(candidates.map((p) => p.id));
    candidates = [
      ...candidates,
      ...wider.items.filter((p) => !seen.has(p.id)),
    ];
  }

  const items = recommendProducts(candidates, signals, { count });

  // Every candidate scored zero — treat that as no signal rather than
  // dressing up an arbitrary pick as a recommendation.
  if (items.length === 0) {
    const popular = await getProducts({ pageSize: count });
    return {
      items: popular.items.map((product) => ({
        product,
        score: 0,
        reasons: [],
      })),
      personalised: false,
    };
  }

  return { items, personalised: true };
}
