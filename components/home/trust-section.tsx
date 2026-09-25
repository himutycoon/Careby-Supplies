import { Section, SectionHeading } from "@/components/shared/section";
import { Icon } from "@/components/shared/icon";
import { TRUST_POINTS } from "@/data/platform";

export function TrustSection() {
  return (
    <Section tone="muted">
      <SectionHeading
        eyebrow="Why CareBy"
        title="Built for people who have to get it right"
        subtitle="Whether you order every week or once in your life, the material has to be right."
      />

      <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST_POINTS.map((point) => (
          <div key={point.title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon name={point.icon} className="size-5" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-base">{point.title}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {point.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
