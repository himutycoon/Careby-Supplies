import type { Metadata } from "next";
import { AdminRecordTable } from "@/components/admin/admin-record-table";

export const metadata: Metadata = { title: "Call Orders — CareBy Admin" };

export default function AdminCallsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Call orders</h1>
        <p className="mt-1 text-muted-foreground">
          Scheduled ordering calls, newest first.
        </p>
      </div>
      <AdminRecordTable
        source="calls"
        table="call_orders"
        statuses={["scheduled", "confirmed", "completed", "cancelled"]}
        columnLabels={{ reference: "Reference", label: "Category", sublabel: "When" }}
        emptyTitle="No calls scheduled"
        emptyDescription="Calls booked by contractors appear here."
      />
    </div>
  );
}
