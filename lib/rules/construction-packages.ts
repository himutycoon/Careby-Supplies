/**
 * Rules layer — paid new-build advisory packages.
 *
 * Sibling to lib/rules/consultation.ts, and here for the same reason:
 * the fee is quoted on the page, shown in the wizard and charged by
 * Stripe, and those three must never be able to disagree. The server
 * reads these constants when it creates the Checkout Session; the
 * browser never sends an amount.
 *
 * These are advisory fees for time — an advisor, an architect, a
 * designer. They are not material prices, and they are credited back
 * against the material order (see PACKAGE_CREDIT_NOTE in
 * data/new-construction.ts).
 */

/** The paid tiers of the new-build ladder, in CAD. */
export const CONSTRUCTION_TIER_FEES_CAD = {
  "plan-check": 10,
  "architect-review": 70,
  "full-team": 150,
} as const;

export type PaidConstructionTier = keyof typeof CONSTRUCTION_TIER_FEES_CAD;

export type ConstructionTierId = "basic" | PaidConstructionTier;

export function isPaidConstructionTier(
  tierId: string,
): tierId is PaidConstructionTier {
  return tierId in CONSTRUCTION_TIER_FEES_CAD;
}

/** The fee for a tier, or null when the tier is free or unknown. */
export function constructionTierFeeCad(tierId: string): number | null {
  return isPaidConstructionTier(tierId)
    ? CONSTRUCTION_TIER_FEES_CAD[tierId]
    : null;
}

/** What the customer is buying, shown on the Stripe page and the receipt. */
export const CONSTRUCTION_PRODUCT_NAME: Record<PaidConstructionTier, string> = {
  "plan-check": "CareBy plan check",
  "architect-review": "CareBy architect review",
  "full-team": "CareBy full project team",
};

export const CONSTRUCTION_PRODUCT_DESCRIPTION: Record<
  PaidConstructionTier,
  string
> = {
  "plan-check":
    "An advisor reviews your build plan and prices the material it needs.",
  "architect-review":
    "A licensed architect reviews your plan, with an advisor pricing the material.",
  "full-team":
    "Architect, designer and materials advisor working through your build together.",
};
