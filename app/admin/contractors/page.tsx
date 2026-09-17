import type { Metadata } from "next";
import { ContractorsTable } from "@/components/admin/contractors-table";

export const metadata: Metadata = { title: "Contractors — CareBy Admin" };

export default function AdminContractorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Contractors</h1>
        <p className="mt-1 text-muted-foreground">
          Business details and verification status.
        </p>
      </div>
      <ContractorsTable />
    </div>
  );
}
