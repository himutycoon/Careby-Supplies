import type { Metadata } from "next";
import { NewConstructionWizard } from "@/components/homeowner/new-construction-wizard";

export const metadata: Metadata = {
  title: "New Construction — CareBy Supplies",
};

export default function NewConstructionPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <NewConstructionWizard />
    </div>
  );
}
