import type { Metadata } from "next";
import { PackageSearch, ShoppingBag, Wrench } from "lucide-react";
import { RepairFlow } from "@/components/homeowner/repair-flow";
import { SupplySteps } from "@/components/shared/supply-steps";

export const metadata: Metadata = { title: "Repair — CareBy Supplies" };

/**
 * The third step is where the old callout's warning used to be. Said as
 * part of how the flow runs, "you or your tradesperson fit it" is a fact
 * about the process rather than a notice telling someone off before they
 * have typed anything.
 */
const STEPS = [
  {
    icon: PackageSearch,
    title: "Tell us what's wrong",
    body: "A few questions about the symptom and where it is.",
  },
  {
    icon: ShoppingBag,
    title: "We find the parts",
    body: "The part that failed, plus what goes with it, priced and in stock.",
  },
  {
    icon: Wrench,
    title: "You or your trade fit them",
    body: "We supply parts and materials — we don't carry out the repair.",
  },
];

export default function RepairPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Find the parts to fix it</h1>
        <p className="mt-1 text-muted-foreground">
          Tell us what&apos;s wrong and we&apos;ll point you at the parts
          and materials that put it right.
        </p>

        <SupplySteps steps={STEPS} className="mt-6" />
      </div>

      <RepairFlow />
    </div>
  );
}
