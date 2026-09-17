import type { Metadata } from "next";
import { OrderDetail } from "@/components/shop/order-detail";

export const metadata: Metadata = { title: "Order — CareBy Canada" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <OrderDetail orderId={id} />
    </div>
  );
}
