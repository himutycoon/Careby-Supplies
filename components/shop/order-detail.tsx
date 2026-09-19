"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelSkeleton } from "@/components/shared/skeleton";
import { EditorialImage } from "@/components/shared/editorial-image";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { StepIndicator } from "@/components/shared/step-indicator";
import { getOrderByReference } from "@/services/orders";
import { deliveryMethodLabel } from "@/lib/delivery";
import { formatCad, formatDate } from "@/lib/format";
import type { Order } from "@/lib/types";

const FULFILMENT_STAGES = ["Processing", "Confirmed", "Shipped", "Delivered"];
const STAGE_INDEX: Record<Order["status"], number> = {
  processing: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  cancelled: 0,
};

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    getOrderByReference(orderId)
      .then((data: Order | null) => {
        if (!cancelled) setOrder(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <PanelSkeleton rows={2} />
        <PanelSkeleton rows={4} />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon="Receipt"
        title="Order not found"
        description="This order doesn't exist, or it was placed on another account. Check the reference on your confirmation email — it should look like ORD-XXXXXX."
        action={<Button render={<Link href="/products">Shop Products</Link>} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{order.id}</h1>
          <p className="mt-1 text-muted-foreground">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status !== "cancelled" ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-5 text-sm font-semibold">Fulfilment</h2>
          <StepIndicator
            steps={FULFILMENT_STAGES}
            current={STAGE_INDEX[order.status]}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section>
          <h2 className="mb-3 text-lg">Items</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {order.lines.map((line) => {
              return (
                <li key={line.productId} className="flex items-center gap-4 p-4">
                  <EditorialImage
                    tone="slate"
                    alt={line.name}
                    className="size-16 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${line.productId}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {line.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {line.brand} · {formatCad(line.unitPriceCad)} /{" "}
                      {line.unit}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    × {line.quantity}
                  </span>
                  <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {formatCad(line.unitPriceCad * line.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg">Summary</h2>
            <dl className="mt-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">
                  {formatCad(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium tabular-nums">
                  {order.delivery === 0 ? "Free" : formatCad(order.delivery)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">HST (13%)</dt>
                <dd className="font-medium tabular-nums">
                  {formatCad(order.tax)}
                </dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCad(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg">Delivery</h2>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Truck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {deliveryMethodLabel(order.deliveryMethod)}
            </p>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {order.contact.name}
                <br />
                {order.contact.address}
                <br />
                {order.contact.city}, {order.contact.postalCode}
              </span>
            </p>
          </div>
        </aside>
      </div>

      <div>
        <Button
          variant="outline"
          render={
            <Link href="/orders">
              <ArrowLeft className="size-4" /> All orders
            </Link>
          }
        />
      </div>
    </div>
  );
}
