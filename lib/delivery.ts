import type { DeliveryMethod } from "@/lib/rules/order-totals";

export interface DeliveryOption {
  id: DeliveryMethod;
  label: string;
  detail: string;
  note: string;
}

/**
 * The delivery choices offered at checkout.
 *
 * Orders store the `id`, because `recalculate_order_totals` reads the
 * column to decide whether the $79 fee applies. Everything the customer
 * reads comes from `deliveryMethodLabel()`, so the stored value can stay
 * a stable key while the wording changes.
 */
export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: "standard",
    label: "Standard delivery",
    detail: "2–5 business days",
    note: "Standard rates",
  },
  {
    id: "scheduled",
    label: "Scheduled delivery",
    detail: "Choose a date at dispatch",
    note: "Standard rates",
  },
  {
    id: "pickup",
    label: "Branch pickup",
    detail: "Ready in 4 hours, Mississauga",
    note: "Free",
  },
];

/**
 * Orders placed before the id/label split stored the label itself, so an
 * unrecognised value is shown as-is rather than replaced with a fallback
 * that would be wrong for those rows.
 */
export function deliveryMethodLabel(stored: string): string {
  return DELIVERY_OPTIONS.find((o) => o.id === stored)?.label ?? stored;
}
