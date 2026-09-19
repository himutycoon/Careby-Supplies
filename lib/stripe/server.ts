import "server-only";
import Stripe from "stripe";

/**
 * Stripe client — server only.
 *
 * STRIPE_SECRET_KEY must never reach the browser, so this module is
 * marked server-only and is imported by route handlers alone. The
 * publishable key is the one that goes in NEXT_PUBLIC_*.
 *
 * Constructed lazily rather than at module scope: a build machine has no
 * Stripe key, and throwing at import time would fail `next build` on
 * every route that transitively imports this.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — payments are not configured.",
    );
  }

  client = new Stripe(key);
  return client;
}

/** True when payments are configured, so the UI can degrade honestly. */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

/**
 * Dollars to the integer cents Stripe charges in.
 *
 * Multiplying a float by 100 gives 37999.999999999996 for 379.99999-style
 * values, so this rounds rather than truncates.
 */
export function toCents(amountCad: number): number {
  return Math.round(amountCad * 100);
}
