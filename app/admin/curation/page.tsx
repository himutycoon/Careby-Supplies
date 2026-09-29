import type { Metadata } from "next";
import { CurationTable } from "@/components/admin/curation-table";

export const metadata: Metadata = { title: "Product picks — CareBy Admin" };

export default function AdminCurationPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Product picks</h1>
        <p className="mt-1 text-muted-foreground">
          Choose exactly which products a customer sees for a stage of a
          job. Anything you leave alone keeps showing its whole category.
        </p>
      </div>

      <CurationTable />
    </div>
  );
}
