import type { Metadata } from "next";
import { Building2, ClipboardList, Truck } from "lucide-react";
import { NewConstructionWizard } from "@/components/homeowner/new-construction-wizard";
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl">Budget the material for your build</h1>
        <p className="mt-1 text-muted-foreground">
          Answer a few questions and we&apos;ll come back with what the
          material costs, stage by stage.
        </p>

        <SupplySteps steps={STEPS} className="mt-6" />
      </div>

      <NewConstructionWizard />
    </div>
  );
}
