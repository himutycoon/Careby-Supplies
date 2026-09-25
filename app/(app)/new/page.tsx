import type { Metadata } from "next";
import { Camera, HardHat, Receipt } from "lucide-react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { FlowPageHeader } from "@/components/app-shell/flow-page-header";
import { SupplySteps } from "@/components/shared/supply-steps";

export const metadata: Metadata = { title: "New Estimate — CareBy Supplies" };

/**
 * What this flow does, with the last step naming who installs. It used
 * to be a tinted callout above the stepper, which read as a warning;
 * beside the form it reads as the reason to use us.
 */
const STEPS = [
  {
    icon: Camera,
    title: "We price the materials",
    body: "An itemised list in the quantities your room actually needs.",
  },
  {
    icon: Receipt,
    title: "Delivery to your site",
    body: "Scheduled to your install date, across the GTA.",
  },
  {
    icon: HardHat,
    title: "Your contractor installs",
    body: "We supply the material; labour is priced by your own trades.",
  },
];

export default function NewEstimatePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <FlowPageHeader
        eyebrow="Material estimate"
        title="Price the materials for"
        accent="your project"
        description="Tell us about your room and we'll come back with a detailed material list. We supply the materials — your contractor handles the installation."
        imageSlot="categoryRenovation"
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <WizardShell />
        <SupplySteps steps={STEPS} variant="rail" />
      </div>
    </div>
  );
}
