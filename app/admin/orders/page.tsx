import type { Metadata } from "next";
import { AdminRecordTable } from "@/components/admin/admin-record-table";

export const metadata: Metadata = { title: "Orders — CareBy Admin" };

export default function AdminOrdersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          Every material order placed on the platform.
        </p>
      </div>
      <AdminRecordTable
        source="orders"
        table="orders"
        statuses={["processing", "confirmed", "shipped", "delivered", "cancelled"]}
        columnLabels={{ reference: "Order", label: "Customer", sublabel: "Total" }}
        emptyTitle="No orders yet"
        emptyDescription="Orders appear here as soon as customers check out."
      />
    </div>
  );
}
