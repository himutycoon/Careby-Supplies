import type { Metadata } from "next";
import { ClipboardList, HardHat, Truck } from "lucide-react";
import { FlowPageHeader } from "@/components/app-shell/flow-page-header";
import { SupplySteps } from "@/components/shared/supply-steps";
import { ScopeRequestFlow } from "@/components/homeowner/scope-request-flow";

export const metadata: Metadata = {
  title: "Material checklist — CareBy Supplies",
};

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tick what you need",
    body: "Every stage of the job, so nothing gets left off the order.",
  },
  {
    icon: Truck,
    title: "We price and deliver",
    body: "A material list for what you ticked, delivered across the GTA.",
  },
  {
    icon: HardHat,
    title: "Your contractor installs",
    body: "We supply the material; labour is priced by your own trades.",
  },
];

export default function MaterialsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <FlowPageHeader
        eyebrow="Material checklist"
        title="Tell us what your job"
        accent="actually needs"
        description="Pick the project and tick the parts you need materials for. Whether you think of it as materials for a room or an order by category, it lands in the same place."
        imageSlot="categoryRenovation"
      />

      {/* grid-cols-[minmax(0,1fr)] is load-bearing on a phone. A single-
          column grid with no explicit template puts its items in an
          `auto` track, and an auto track is sized by its items'
          min-content -- so one wide descendant makes the whole column
          wider than the screen, and body's overflow-x:hidden clips it
          rather than scrolling. The lg: track below already says
          minmax(0,1fr) for exactly this reason; the mobile one never
          did.

          [&>*]:min-w-0 is the other half: a grid ITEM also defaults to
          min-width:auto, so a constrained track alone still lets the
          item spill out of it. */}
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-5 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ScopeRequestFlow />
        <SupplySteps steps={STEPS} variant="rail" />
      </div>
    </div>
  );
}
