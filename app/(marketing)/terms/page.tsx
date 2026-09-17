import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { LegalContent } from "@/components/shared/legal-content";

export const metadata: Metadata = { title: "Terms of Service — CareBy Canada" };

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms of Service" />
      <LegalContent
        updatedAt="August 2026"
        sections={[
          {
            heading: "What CareBy provides",
            body: [
              "CareBy provides an instant, AI-generated indicative estimate based on photos and information you submit, followed by a hand-designed renovation plan prepared by a CareBy designer within 48 hours.",
            ],
          },
          {
            heading: "Not a permit or a contract",
            body: [
              "Output provided through CareBy — including the instant estimate and the full delivered plan — is indicative planning guidance only. It is not a permit submission, a building code determination, or a construction contract. Final scope, pricing, and code compliance must be confirmed with a licensed contractor and your local building authority before any work begins.",
            ],
          },
          {
            heading: "Accuracy of estimates",
            body: [
              "Estimates are based on the photos, dimensions, and information you provide, and on conditions visible in your photos at the time of submission. Actual project costs may vary based on conditions not visible in photos, material availability, contractor pricing, and site-specific factors discovered during construction.",
            ],
          },
          {
            heading: "Your account",
            body: [
              "You're responsible for the accuracy of the information you submit and for keeping your account credentials secure.",
            ],
          },
          {
            heading: "Limitation of liability",
            body: [
              "CareBy is not liable for decisions made based on indicative estimates or plans, or for costs, delays, or damages arising from renovation work undertaken based on CareBy output.",
            ],
          },
        ]}
      />
    </>
  );
}
