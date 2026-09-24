import type { Metadata } from "next";
import { RepairFlow } from "@/components/homeowner/repair-flow";

export const metadata: Metadata = { title: "Repair — CareBy Supplies" };

export default function RepairPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Fix something</h1>
        <p className="mt-1 text-muted-foreground">
          Tell us what&apos;s wrong and we&apos;ll point you at the right
          parts — or the right person.
        </p>
      </div>
      <RepairFlow />
    </div>
  );
}
