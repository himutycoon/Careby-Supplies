import type { Metadata } from "next";
import { AdminRecordTable } from "@/components/admin/admin-record-table";

export const metadata: Metadata = { title: "Drawings — CareBy Admin" };

export default function AdminDrawingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Drawing uploads</h1>
        <p className="mt-1 text-muted-foreground">
          Uploaded drawings awaiting material takeoff.
        </p>
      </div>
      <AdminRecordTable
        source="drawings"
        table="drawing_uploads"
        statuses={["uploaded", "analyzing", "ready", "failed"]}
        statusColumn="processing_status"
        columnLabels={{ reference: "Reference", label: "Project", sublabel: "Drawing type" }}
        emptyTitle="No drawings uploaded"
        emptyDescription="Drawings uploaded by contractors appear here for review."
      />
    </div>
  );
}
