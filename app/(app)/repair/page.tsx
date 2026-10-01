import type { Metadata } from "next";
import { PackageSearch, ShoppingBag, Wrench } from "lucide-react";
import { RepairFlow } from "@/components/homeowner/repair-flow";
import { FlowPageHeader } from "@/components/app-shell/flow-page-header";
import { SupplySteps } from "@/components/shared/supply-steps";

export const metadata: Metadata = { title: "Repair — CareBy Supplies" };

/**
 * The third step is where a tinted "we don't do repairs" callout used to
 * be. Said as part of how the flow runs it is a fact about the process
 * rather than a notice telling someone off before they have typed
 * anything.
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <FlowPageHeader
        eyebrow="Repair parts"
        title="Find the parts to"
        accent="fix it"
        description="Tell us what's wrong and we'll point you at the parts and materials that put it right."
        imageSlot="categoryRepair"
      />

      {/* Form left, reassurance right — the rail drops under the form on
          anything narrower than a laptop. */}
      {/* grid-cols-[minmax(0,1fr)] is load-bearing on a phone. A single-
          column grid with no explicit template puts its items in an
          `auto` track, and an auto track is sized by its items'
          min-content -- so one wide descendant makes the whole column
          wider than the screen, and body's overflow-x:hidden clips it
          rather than scrolling. The lg: track below already says
          minmax(0,1fr) for exactly this reason; the mobile one never
          did. */}
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-5 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <RepairFlow />
        <SupplySteps steps={STEPS} variant="rail" />
      </div>
    </div>
  );
}
