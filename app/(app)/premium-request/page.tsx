import type { Metadata } from "next";
import { Suspense } from "react";
import { FileUp, HardHat, ListChecks } from "lucide-react";
import { PremiumRequestWizard } from "@/components/homeowner/premium-request-wizard";
import { FlowPageHeader } from "@/components/app-shell/flow-page-header";
import { SupplySteps } from "@/components/shared/supply-steps";

export const metadata: Metadata = {
  title: "Project Takeoff & DIY Support — CareBy Supplies",
};

/*
 * What the two packages actually hand over.
 *
 * This rail used to promise staged deliveries and a named contact. Those
 * belonged to a third package that no longer exists, so the page was
 * selling a service nobody could buy — the fastest way to lose the sale
 * is at the moment someone asks for the thing you described.
 */
const STEPS = [
  {
    icon: FileUp,
    title: "Send your drawings",
    body: "Plans, a sketch, or photos of what you have. We work the quantities out from them.",
  },
  {
    icon: ListChecks,
    title: "Get a priced list back",
    body: "Free, with alternates where they save money, and no obligation to order.",
  },
  {
    icon: HardHat,
    title: "Add a contractor if you want one",
    body: "A session with an experienced contractor for when you are building it yourself.",
  },
];

export default function PremiumRequestPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <FlowPageHeader
        eyebrow="Premium · Project takeoff"
        tone="premium"
        title="Upload your drawings,"
        accent="get the materials"
        description="A takeoff from your own plans, priced and itemised — free. Add on-demand contractor guidance if you are building it yourself."
        imageSlot="premium"
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The wizard reads ?tier= to preselect from the home page, so it
            needs a boundary on this statically-rendered page. */}
        <Suspense fallback={<div className="h-96" />}>
          <PremiumRequestWizard />
        </Suspense>

        <SupplySteps steps={STEPS} variant="rail" />
      </div>
    </div>
  );
}
