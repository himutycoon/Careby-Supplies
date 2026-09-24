import type { Metadata } from "next";
import { PremiumRequestWizard } from "@/components/homeowner/premium-request-wizard";

export const metadata: Metadata = {
  title: "Request Premium Supply — CareBy Supplies",
};

export default function PremiumRequestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Premium supply</h1>
        <p className="mt-1 text-muted-foreground">
          Tell us what you need and an advisor will take it from there.
        </p>
      </div>
      <PremiumRequestWizard />
    </div>
  );
}
