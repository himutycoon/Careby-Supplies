import type { Metadata } from "next";
import { Building2, ClipboardList, Truck } from "lucide-react";
import { NewConstructionWizard } from "@/components/homeowner/new-construction-wizard";
import { FlowPageHeader } from "@/components/app-shell/flow-page-header";
import { SupplySteps } from "@/components/shared/supply-steps";

export const metadata: Metadata = {
  title: "New Construction — CareBy Supplies",
};

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us about the build",
    body: "Size, finish level and the parts of the house that carry their own cost.",
  },
  {
    icon: Truck,
    title: "We budget the material",
    body: "A figure per finished square foot, delivered, HST excluded.",
  },
  {
    icon: Building2,
    title: "Your builder builds it",
    body: "Labour, equipment and permits are theirs to price — usually two to three times the material.",
  },
];

export default function NewConstructionPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <FlowPageHeader
        eyebrow="New build materials"
        title="Budget the material for"
        accent="your build"
        description="Answer a few questions and we'll come back with what the material costs, stage by stage."
        imageSlot="categoryNewConstruction"
      />

      {/* grid-cols-[minmax(0,1fr)] is load-bearing on a phone. A single-
          column grid with no explicit template puts its items in an
          `auto` track, and an auto track is sized by its items'
          min-content -- so one wide descendant makes the whole column
          wider than the screen, and body's overflow-x:hidden clips it
          rather than scrolling. The lg: track below already says
          minmax(0,1fr) for exactly this reason; the mobile one never
          did. */}
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-5 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <NewConstructionWizard />
        <SupplySteps steps={STEPS} variant="rail" />
      </div>
    </div>
  );
}
