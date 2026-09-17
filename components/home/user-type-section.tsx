import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/shared/section";
import { Icon } from "@/components/shared/icon";
import { USER_TYPES } from "@/data/platform";

export function UserTypeSection() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Get started"
        title="What are you working on?"
        subtitle="Two paths through the same platform — one built for the trade, one built for your home."
      />

      <div className="mt-6 grid gap-3 sm:mt-10 sm:gap-6 md:grid-cols-2">
        {USER_TYPES.map((type) => (
          <div
            key={type.id}
            className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 sm:gap-5 sm:p-7 sm:hover:-translate-y-0.5 sm:hover:border-primary/40 sm:hover:shadow-xl"
          >
            {/* Phones: icon and title share a row. Stacking them cost a
                whole card-height of vertical space for no information. */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-12 sm:rounded-xl">
                <Icon name={type.icon} className="size-5 sm:size-6" />
              </span>

              <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
                <h3 className="text-lg sm:text-2xl">{type.title}</h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  {type.description}
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-1.5 sm:gap-2">
              {type.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-center gap-2 text-xs sm:gap-2.5 sm:text-sm"
                >
                  <Check
                    className="size-3.5 shrink-0 text-primary sm:size-4"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{bullet}</span>
                </li>
              ))}
            </ul>

            <Button
              size="sm"
              className="press mt-auto w-full sm:w-fit"
              variant={type.id === "contractor" ? "default" : "outline"}
              render={
                <Link href={type.href}>
                  {type.ctaLabel} <ArrowRight className="size-4" />
                </Link>
              }
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
