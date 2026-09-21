"use client";

import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { useAsyncData } from "@/lib/store/hooks";
import { getOrders } from "@/services/orders";
import { formatCad, formatDate } from "@/lib/format";

/** "1 item", "3 items" — this read "1 items" on every single-line order. */
function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function OrdersList({
  limit,
  compact = false,
}: {
  limit?: number;
  /** Shorter empty state, for a dashboard panel rather than a page. */
  compact?: boolean;
}) {
  const { data, loading, error, reload } = useAsyncData(getOrders);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: limit ?? 3 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load orders"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const orders = data ?? [];
  const visible = limit ? orders.slice(0, limit) : orders;

  if (visible.length === 0) {
    return (
      <EmptyState
        icon="Receipt"
        title="No orders yet"
        description="Materials you order will show up here with their delivery status."
        className={compact ? "gap-2 px-4 py-6" : undefined}
        action={
          <Button render={<Link href="/products">Browse materials</Link>} />
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {visible.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{order.id}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3" aria-hidden="true" />
                {formatDate(order.createdAt)} ·{" "}
                {itemCountLabel(
                  order.lines.reduce((sum, l) => sum + l.quantity, 0),
                )}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
            <span className="font-semibold tabular-nums">
              {formatCad(order.total)}
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
