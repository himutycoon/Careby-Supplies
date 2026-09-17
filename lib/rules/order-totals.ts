/**
 * Rules layer — order money.
 *
 * Pure and dependency-free so cart, checkout, order detail and packages
 * can never disagree on a number, and so it can be unit-tested without
 * pulling in stores or services.
 */
export const HST_RATE = 0.13;
export const FREE_DELIVERY_THRESHOLD = 500;
export const DELIVERY_FEE = 79;

export interface OrderTotals {
  subtotal: number;
  delivery: number;
  tax: number;
  total: number;
}

/** Ids, not labels — the order row stores this and the trigger reads it. */
export type DeliveryMethod = "standard" | "scheduled" | "pickup";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Nothing to deliver, collecting it yourself, or over the threshold.
 *
 * Checkout has always offered "Branch pickup — Free" while this derived
 * the fee from the subtotal alone, so collecting an order still cost $79.
 * `recalculate_order_totals` in schema-08 applies the same three rules.
 */
export function calculateDeliveryFee(
  subtotal: number,
  method: DeliveryMethod = "standard",
): number {
  if (subtotal === 0) return 0;
  if (method === "pickup") return 0;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_FEE;
}

export function calculateOrderTotals(
  lines: { unitPriceCad: number; quantity: number }[],
  method: DeliveryMethod = "standard",
): OrderTotals {
  const subtotal = round2(
    lines.reduce((sum, line) => sum + line.unitPriceCad * line.quantity, 0),
  );
  const delivery = calculateDeliveryFee(subtotal, method);
  const tax = round2((subtotal + delivery) * HST_RATE);
  const total = round2(subtotal + delivery + tax);

  return { subtotal, delivery, tax, total };
}

/** Packages always charge delivery — the contractor is the buyer. */
export function calculatePackageTotals(
  lines: { unitPriceCad: number; quantity: number }[],
): OrderTotals {
  const subtotal = round2(
    lines.reduce((sum, line) => sum + line.unitPriceCad * line.quantity, 0),
  );
  const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
  const tax = round2((subtotal + delivery) * HST_RATE);
  const total = round2(subtotal + delivery + tax);

  return { subtotal, delivery, tax, total };
}
