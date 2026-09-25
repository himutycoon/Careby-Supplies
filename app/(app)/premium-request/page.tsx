import type { Metadata } from "next";
import { Suspense } from "react";
import { Ruler, Truck, UserRound } from "lucide-react";
import { PremiumRequestWizard } from "@/components/homeowner/premium-request-wizard";
import { FlowPageHeader } from "@/components/app-shell/flow-page-header";
import { SupplySteps } from "@/components/shared/supply-steps";

export const metadata: Metadata = {
  title: "Request Premium Supply — CareBy Supplies",
};

const STEPS = [
  {
    icon: Ruler,
    title: "A takeoff from your drawings",
    body: "Send what you have and we work out the quantities from it.",
  },
  {
    icon: Truck,
    title: "Deliveries to your dates",
    body: "Staged so material lands ahead of the trade that needs it.",
  },
  {
    icon: UserRound,
    title: "A named contact",
    body: "One person who knows your job, reachable by phone or email.",
  },
];

export default function PremiumRequestPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <FlowPageHeader
        eyebrow="Premium supply"
        title="Hand us the drawings,"
        accent="take delivery"
        description="Tell us what you need and an advisor takes the material side from there — priced, staged and delivered around your build."
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
