import Link from "next/link";
import { ArrowRight, Hammer, PackageCheck, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST = [
  {
    Icon: PackageCheck,
    title: "Quality materials",
    body: "Specified to the job, from brands trades already rely on.",
  },
  {
    Icon: Truck,
    title: "Reliable delivery",
    body: "Scheduled to your site so material arrives when it's needed.",
  },
  {
    Icon: Users,
    title: "Materials advice",
    body: "Talk to someone who knows what each product suits and what it costs.",
  },
  {
    Icon: Hammer,
    title: "Trusted brands",
    body: "One supplier across lumber, finishes, electrical and tools.",
  },
];

/**
 * Quote prompt + service strip.
 *
 * "Request a Quote" goes to the existing contact form rather than a new
 * endpoint — there is no quoting backend, and a button that silently
 * did nothing would be worse than one that reaches a real inbox.
 */
export function QuoteCta() {
  return (
    <>
      <section className="border-t border-border bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-16">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-balance text-ink-foreground sm:text-3xl">
              Building a bigger project?
            </h2>
            <p className="mt-3 text-pretty text-ink-foreground/75">
              Get project pricing, material estimates and scheduled delivery
              from CareBy.
            </p>
          </div>
          <Button
            variant="hi-vis"
            size="lg"
            className="press w-full shrink-0 sm:w-auto"
            render={
              <Link href="/contact?about=quote">
                Request a Quote <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>
      </section>

      <section
        aria-label="Why buy from CareBy"
        className="border-t border-border bg-background"
      >
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-12">
          {TRUST.map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
