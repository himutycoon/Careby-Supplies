import type { Product, UserRole } from "@/lib/types";

/**
 * Which of a product's two prices this viewer is shown.
 *
 * Product cards already did this via a `showContractorPrice` prop passed
 * down from the contractor-only screens, but the cart and checkout are
 * shared with the public site and had no prop to pass — so they always
 * rendered retail. A contractor saw $105 for a faucet in the cart, agreed
 * to a $208 total, and the order was written at the $90 trade price the
 * database enforces: $191. Same catalog, three different numbers.
 *
 * This is presentation only. `enforce_order_item_price` decides what is
 * actually charged.
 */
export function priceForRole(
  product: Pick<Product, "priceCad" | "contractorPriceCad">,
  role: UserRole | null | undefined,
): number {
  return role === "contractor" ? product.contractorPriceCad : product.priceCad;
}
