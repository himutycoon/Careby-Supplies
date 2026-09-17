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
}: {
  lines: OrderLine[];
  action?: React.ReactNode;
  title?: string;
  deliveryMethod?: DeliveryMethod;
}) {
  const { subtotal, delivery, tax, total } = calculateOrderTotals(
    lines,
    deliveryMethod,
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg">{title}</h2>

      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </dt>
          <dd className="font-medium tabular-nums">{formatCad(subtotal)}</dd>
        </div>
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
      {delivery > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Add {formatCad(FREE_DELIVERY_THRESHOLD - subtotal)} more for free
          delivery.
        </p>
      ) : null}

      {action}
    </div>
  );
}
