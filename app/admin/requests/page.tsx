import type { Metadata } from "next";
import { AdminRecordTable } from "@/components/admin/admin-record-table";

export const metadata: Metadata = { title: "Service Requests — CareBy Admin" };

export default function AdminRequestsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Service requests</h1>
        <p className="mt-1 text-muted-foreground">
          Repair, consultation, architect and permit requests.
        </p>
      </div>
      <AdminRecordTable
        source="requests"
        table="service_requests"
        statuses={["requested", "reviewing", "contacted", "scheduled", "in_progress", "completed", "cancelled"]}
        columnLabels={{ reference: "Reference", label: "Service", sublabel: "Category" }}
        emptyTitle="No service requests"
        emptyDescription="Requests submitted from the repair and premium flows appear here."
      />
    </div>
  );
}
