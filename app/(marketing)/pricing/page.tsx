import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PricingPreview } from "@/components/home/pricing-preview";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = { title: "Pricing — CareBy Supplies" };

export default function PricingPage() {
  return (
    <>
      <PageHeader
        title="Simple, upfront pricing"
        subtitle="The instant material estimate is always free. Pay only when you want the full list checked by hand."
      />
      <PricingPreview showFooterLink={false} />
      <FaqAccordion />
      <CtaBand />
    </>
  );
}
