/**
 * Rules layer — paid consultation.
 *
 * The fee lives here, with the rest of the money math, for the same
 * reason order totals do: it is quoted on the marketing page, shown in
 * the wizard, and charged by Stripe, and those three must never be able
 * to disagree. The server reads this constant when it creates the
 * Checkout Session; the browser never sends an amount.
 */

/** One-time expert consultation, in CAD. */
export const CONSULTATION_FEE_CAD = 20;

/**
 * The tier that is paid.
 *
 * The other premium tiers are scoped conversations — the advisor quotes
 * them after a call — so only this one has a fixed price to charge up
 * front.
 */
export const PAID_CONSULTATION_TIER = "expert-session";

export function isPaidConsultationTier(tierId: string): boolean {
  return tierId === PAID_CONSULTATION_TIER;
}

/** What the customer is buying, shown on the Stripe page and the receipt. */
export const CONSULTATION_PRODUCT_NAME = "CareBy expert consultation";
export const CONSULTATION_PRODUCT_DESCRIPTION =
  "One-to-one session with a project advisor, plus a curated materials list.";
