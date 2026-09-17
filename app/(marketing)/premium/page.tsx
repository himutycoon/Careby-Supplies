import type { Metadata } from "next";
import { PremiumSection } from "@/components/home/premium-section";
import { Section, SectionHeading } from "@/components/shared/section";
import { Icon } from "@/components/shared/icon";
import { CtaBand } from "@/components/home/cta-band";
import { PREMIUM_TIMELINE } from "@/data/platform";

export const metadata: Metadata = {
  title: "Premium Package — CareBy Canada",
};

const FAQS = [
  {
    question: "Who is Premium for?",
    answer:
      "Homeowners taking on a large renovation or a new build who'd rather not coordinate designers, permits, trades and material orders themselves.",
  },
  {
    question: "What does the architect support cover?",
    answer:
      "We connect you with a licensed architect or designer appropriate to your scope, and coordinate their drawings with your material and permit needs.",
  },
  {
    question: "Do you guarantee permit approval?",
    answer:
      "No. We prepare and coordinate submissions, but approval rests with your municipality. Nothing we produce is a permit or a code determination.",
  },
];

export default function PremiumPage() {
  return (
    <>
      <PremiumSection />

      <Section>
        <SectionHeading
          eyebrow="What happens"
          title="How a Premium project runs"
          subtitle="Six stages, one point of contact throughout."
        />
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PREMIUM_TIMELINE.map((stage) => (
            <li
              key={stage.step}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name={stage.icon} className="size-5" />
              </span>
              <span className="font-heading text-2xl text-primary">
                {stage.step}
              </span>
              <h3 className="text-lg">{stage.title}</h3>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" width="narrow">
        <SectionHeading
          eyebrow="Questions"
          title="Before you commit"
          align="left"
        />
        <dl className="mt-8 flex flex-col divide-y divide-border">
          {FAQS.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-2 py-5">
              <dt className="font-semibold">{faq.question}</dt>
              <dd className="leading-relaxed text-muted-foreground">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBand />
    </>
  );
}
