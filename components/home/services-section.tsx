import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/shared/section";
import { Icon } from "@/components/shared/icon";
import { SERVICES } from "@/data/platform";

export function ServicesSection() {
  return (
    <Section tone="muted">
      <SectionHeading
        eyebrow="What we supply"
        title="Every material your project needs"
        subtitle="From the first material estimate to the last delivery — one supplier."
      />

      <div className="mt-6 grid gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Link
            key={service.title}
            href={service.href}
            className="group flex flex-row items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-col sm:gap-4 sm:p-6 sm:hover:-translate-y-0.5 sm:hover:border-primary/40 sm:hover:shadow-lg"
          >
            <div className="flex shrink-0 items-start justify-between sm:w-full">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors sm:size-11 sm:group-hover:bg-primary sm:group-hover:text-primary-foreground">
                <Icon name={service.icon} className="size-4.5 sm:size-5.5" />
              </span>
              <ArrowUpRight
                className="hidden size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block"
                aria-hidden="true"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
              <h4 className="text-base sm:text-xl">{service.title}</h4>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {service.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
