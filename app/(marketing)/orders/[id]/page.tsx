import type { Metadata } from "next";
import { OrderDetail } from "@/components/shop/order-detail";

export const metadata: Metadata = { title: "Order — CareBy Supplies" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      {/* Stripe's success_url is /orders/REF?paid=1 — see
          app/api/checkout/session/route.ts. */}
      <OrderDetail orderId={id} justPaid={query.paid === "1"} />
    </div>
  );
}
