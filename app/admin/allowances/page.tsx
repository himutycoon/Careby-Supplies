import type { Metadata } from "next";
import { AllowancesTable } from "@/components/admin/allowances-table";

export const metadata: Metadata = { title: "Allowances — CareBy Admin" };

export default function AdminAllowancesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Allowances</h1>
        <p className="mt-1 text-muted-foreground">
          What a package budgets for each item. The customer portal measures
          their choice against this — above it shows as an upgrade, below it
          as a credit.
        </p>
      </div>

      <AllowancesTable />
    </div>
  );
}
