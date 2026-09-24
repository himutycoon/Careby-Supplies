import type { Metadata } from "next";
import { RepairFlow } from "@/components/homeowner/repair-flow";
import { SuppliesOnlyNotice } from "@/components/shared/supplies-only-notice";

export const metadata: Metadata = { title: "Repair — CareBy Supplies" };

export default function RepairPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Find the parts to fix it</h1>
        <p className="mt-1 text-muted-foreground">
          Tell us what&apos;s wrong and we&apos;ll point you at the parts
          and materials that put it right.
        </p>
      </div>

      <SuppliesOnlyNotice className="mb-8">
        <span className="font-medium text-foreground">
          We supply the parts, not the repair.
        </span>{" "}
        We&apos;ll help you work out what has failed and what it takes to
        fix it. The repair itself is done by you or your own tradesperson.
      </SuppliesOnlyNotice>
      <RepairFlow />
    </div>
  );
}
