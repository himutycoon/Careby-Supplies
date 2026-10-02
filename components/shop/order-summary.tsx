import { formatCad } from "@/lib/format";
import { calculateOrderTotals } from "@/services/orders";
import type { DeliveryMethod } from "@/lib/rules/order-totals";
import type { OrderLine } from "@/lib/types";

const FREE_DELIVERY_THRESHOLD = 500;

export function OrderSummary({
  lines,
  action,
  title = "Order summary",
  deliveryMethod = "standard",
  supportPackage,
  onRemoveSupportPackage,
}: {
  lines: OrderLine[];
  action?: React.ReactNode;
  title?: string;
  deliveryMethod?: DeliveryMethod;
  /** A contractor support package being charged on this order. */
  supportPackage?: { name: string; priceCad: number };
  /**
   * Lets them take it off.
   *
   * The package is chosen in a different flow and remembered until an
   * order is placed, so without this a contractor who picked Premium,
   * abandoned that job and came back a week later for a box of screws
   * would be charged $1,200 for them. Shown wherever the charge is.
   */
  onRemoveSupportPackage?: () => void;
}) {
  const packageCad = supportPackage?.priceCad ?? 0;
  const { subtotal, delivery, tax, total } = calculateOrderTotals(
    lines,
    deliveryMethod,
    packageCad,
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  // The materials figure, which is what the free-delivery promise is
  // measured against and what the "N items" line is counting.
  const itemsSubtotal = subtotal - packageCad;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg">{title}</h2>

      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </dt>
          <dd className="font-medium tabular-nums">
            {formatCad(itemsSubtotal)}
          </dd>
        </div>

        {/* Named, not folded into the subtotal. Somebody about to pay
            $149 more than their cart says should be able to see what
            the $149 is. */}
        {supportPackage && packageCad > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="min-w-0 text-muted-foreground">
              {supportPackage.name} package
              {onRemoveSupportPackage ? (
                <button
                  type="button"
                  onClick={onRemoveSupportPackage}
                  className="ml-2 underline underline-offset-2 hover:text-foreground"
                >
                  Remove
                </button>
              ) : null}
            </dt>
            <dd className="font-medium tabular-nums">
              {formatCad(packageCad)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="font-medium tabular-nums">
            {delivery === 0 ? "Free" : formatCad(delivery)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">HST (13%)</dt>
          <dd className="font-medium tabular-nums">{formatCad(tax)}</dd>
        </div>
        <div className="mt-1 flex justify-between border-t border-border pt-3 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold tabular-nums">{formatCad(total)}</dd>
        </div>
      </dl>

      {/* Keyed off the fee actually charged, so it disappears when pickup
          has already made delivery free. */}
      {delivery > 0 && itemsSubtotal < FREE_DELIVERY_THRESHOLD ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Add {formatCad(FREE_DELIVERY_THRESHOLD - itemsSubtotal)} more in
          materials for free delivery.
        </p>
      ) : null}

      {action}
    </div>
  );
}
