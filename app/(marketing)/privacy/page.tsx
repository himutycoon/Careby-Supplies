import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { LegalContent } from "@/components/shared/legal-content";

export const metadata: Metadata = { title: "Privacy Policy — CareBy Canada" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy Policy" />
      <LegalContent
        updatedAt="August 2026"
        sections={[
          {
            heading: "Information we collect",
            body: [
              "When you submit a renovation request, we collect the photos, dimensions, wish-list, budget, and contact details you provide, along with basic account information if you create one.",
            ],
          },
          {
            heading: "How we use your information",
            body: [
              "We use your submission to generate your instant AI estimate and to prepare your hand-designed renovation plan. We may also use your contact information to follow up about your submission or share relevant product updates, which you can opt out of at any time.",
            ],
          },
          {
            heading: "How photos are processed",
            body: [
              "Photos you upload are analyzed by an AI vision system to detect fixtures, finishes, and visible issues. Photos and submission data are retained so your designer can prepare your full plan and so you can access your report later.",
            ],
          },
          {
            heading: "Sharing your information",
            body: [
              "We do not sell your personal information. We may share data with service providers who help us operate CareBy (such as hosting and email delivery), under confidentiality obligations.",
            ],
          },
          {
            heading: "Your choices",
            body: [
              "You can request access to, correction of, or deletion of your personal information by contacting us. Some information may be retained where required for record-keeping or legal purposes.",
            ],
          },
        ]}
      />
    </>
  );
}
