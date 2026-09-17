import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { LegalContent } from "@/components/shared/legal-content";

export const metadata: Metadata = { title: "Refund Policy — CareBy Canada" };

export default function RefundPage() {
  return (
    <>
      <PageHeader title="Refund Policy" />
      <LegalContent
        updatedAt="August 2026"
        sections={[
          {
            heading: "Instant estimate",
            body: [
              "The instant AI estimate is free, so no refund applies to this step.",
            ],
          },
          {
            heading: "Full plan submissions",
            body: [
              "If you're not satisfied with your delivered plan, contact us within 7 days of delivery. We'll work with you and your designer to address the issue, which may include revisions to the plan.",
            ],
          },
          {
            heading: "Eligibility for a refund",
            body: [
              "A refund may be issued if CareBy fails to deliver your full plan within a reasonable time after the 48-hour window, or if the delivered plan does not reasonably reflect the scope and budget you submitted.",
            ],
          },
          {
            heading: "How to request a refund",
            body: [
              "Contact us with your submission ID and the reason for your request. We aim to respond within 2 business days.",
            ],
          },
        ]}
      />
    </>
  );
}
