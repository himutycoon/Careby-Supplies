import { Section, SectionHeading } from "@/components/shared/section";
import { PROCESS_STEPS } from "@/data/platform";

export function HowItWorks() {
  return (
    <Section>
      <SectionHeading
        eyebrow="How it works"
        title="Four steps from idea to delivery"
        subtitle="However you start — a photo, a drawing, or a question — you end up with a material list you can order from."
      />

      <ol className="mt-6 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-6">
        {PROCESS_STEPS.map((item, index) => (
          <li
            key={item.step}
            className="relative flex flex-row items-baseline gap-3 sm:flex-col"
          >
            {/* Connector rule between steps on desktop. */}
            {index < PROCESS_STEPS.length - 1 ? (
              <span
                className="absolute top-4 left-12 hidden h-px w-[calc(100%-2rem)] bg-border lg:block"
                aria-hidden="true"
              />
            ) : null}

            <span className="font-heading text-2xl font-medium text-primary sm:text-3xl">
              {item.step}
            </span>
            <div className="flex min-w-0 flex-col gap-1 sm:contents">
              <h4 className="text-balance text-base sm:text-xl">{item.title}</h4>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
