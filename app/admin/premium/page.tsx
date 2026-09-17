import type { Metadata } from "next";
import { AdminRecordTable } from "@/components/admin/admin-record-table";

export const metadata: Metadata = { title: "Premium Requests — CareBy Admin" };

export default function AdminPremiumPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Premium requests</h1>
        <p className="mt-1 text-muted-foreground">
          Concierge enquiries waiting on an advisor.
        </p>
      </div>
      <AdminRecordTable
        source="premium"
        table="premium_requests"
        statuses={[
          "requested",
          "reviewing",
          "contacted",
          "scheduled",
          "in_progress",
          "completed",
          "cancelled",
        ]}
        columnLabels={{
          reference: "Reference",
          label: "Service",
          sublabel: "Scope",
        }}
        emptyTitle="No premium requests yet"
        emptyDescription="Concierge enquiries appear here as they come in."
      />
    </div>
  );
}
