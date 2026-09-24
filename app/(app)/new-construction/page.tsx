import type { Metadata } from "next";
import { NewConstructionWizard } from "@/components/homeowner/new-construction-wizard";
import { SuppliesOnlyNotice } from "@/components/shared/supplies-only-notice";

export const metadata: Metadata = {
  title: "New Construction — CareBy Supplies",
};

export default function NewConstructionPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <SuppliesOnlyNotice className="mb-8">
        <span className="font-medium text-foreground">
          We supply the material for your build.
        </span>{" "}
        Everything priced here is material, delivered. Your builder prices
        their own labour, equipment and permits on top — a builder&apos;s
        all-in rate typically runs two to three times these figures.
      </SuppliesOnlyNotice>

      <NewConstructionWizard />
    </div>
  );
}
