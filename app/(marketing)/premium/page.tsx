import type { Metadata } from "next";
import { PremiumSection } from "@/components/home/premium-section";
import { Section, SectionHeading } from "@/components/shared/section";
import { Icon } from "@/components/shared/icon";
import { CtaBand } from "@/components/home/cta-band";
import { PREMIUM_TIMELINE } from "@/data/platform";

export const metadata: Metadata = {
  title: "Premium Supply — CareBy Supplies",
};

const FAQS = [
  {
    question: "Who is Premium Supply for?",
    answer:
      "Anyone ordering material for a big job — a whole-home renovation, an addition, a new build — who would rather hand over a set of drawings than build the order line by line.",
  },
  {
    question: "Do you do the work as well?",
    answer:
      "No. CareBy Supplies sells and delivers building materials. We do not install them, employ trades or manage the build. Our quantities are written so your contractor can price their labour against them.",
  },
  {
    question: "What does a takeoff cover?",
    answer:
      "You send drawings or measurements; we come back with a list of what the job needs, in the quantities it needs, priced from our catalogue with alternates where a cheaper grade would do the same work.",
  },
  {
    question: "What if we order too much?",
    answer:
      "Full, undamaged stock comes back within 30 days. Tell us what is left over and we will book the pickup with your next delivery.",
  },
];

export default function PremiumPage() {
  return (
    <>
      <PremiumSection />

      <Section>
        <SectionHeading
          eyebrow="What happens"
          title="From drawings to delivery"
          subtitle="Six stages, one contact who knows your job throughout."
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
