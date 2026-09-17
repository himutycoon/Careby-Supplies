import type { Metadata } from "next";
import { OrdersList } from "@/components/shop/orders-list";

export const metadata: Metadata = { title: "Orders — CareBy Canada" };

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-8">
        <h1 className="text-4xl">Your orders</h1>
        <p className="mt-1 text-muted-foreground">
          Track materials from order through delivery.
        </p>
      </div>
      <OrdersList />
    </div>
  );
}
