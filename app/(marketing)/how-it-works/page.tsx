import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { HowItWorks } from "@/components/home/how-it-works";
import { FeatureGrid } from "@/components/home/feature-grid";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = { title: "How It Works — CareBy Supplies" };

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="From photos to an order you can place"
        subtitle="Three steps, one submission. Here's exactly what happens after you upload."
      />
      <HowItWorks />
      <FeatureGrid />
      <CtaBand />
    </>
  );
}
