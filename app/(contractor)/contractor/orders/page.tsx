import type { Metadata } from "next";
import { OrdersList } from "@/components/shop/orders-list";

export const metadata: Metadata = { title: "Orders — CareBy Contractor" };

export default function ContractorOrdersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          Track material orders and delivery status.
        </p>
      </div>
      <OrdersList />
    </div>
  );
}
