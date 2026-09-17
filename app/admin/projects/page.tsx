import type { Metadata } from "next";
import { AdminRecordTable } from "@/components/admin/admin-record-table";

export const metadata: Metadata = { title: "Projects — CareBy Admin" };

export default function AdminProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Projects</h1>
        <p className="mt-1 text-muted-foreground">
          Repair, renovation and new-construction projects.
        </p>
      </div>
      <AdminRecordTable
        source="projects"
        table="projects"
        statuses={["planning", "in_progress", "materials_ready", "completed", "cancelled"]}
        columnLabels={{ reference: "Type", label: "Project", sublabel: "Subtype" }}
        emptyTitle="No projects yet"
        emptyDescription="Projects created by homeowners and contractors appear here."
      />
    </div>
  );
}
