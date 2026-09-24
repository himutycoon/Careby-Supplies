import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = { title: "FAQ — CareBy Supplies" };

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        subtitle="Everything homeowners ask us before their first submission."
      />
      <FaqAccordion />
      <CtaBand />
    </>
  );
}
