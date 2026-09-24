import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { BlueprintGrid } from "@/components/shared/blueprint-texture";
import { cn } from "@/lib/utils";

/**
 * The four service flows that are fully built and database-backed.
 *
 * Every href points at a real, working screen — call booking, package
 * building, drawing upload and the premium wizard all persist to
 * Supabase and appear in the admin queues. Nothing here is a teaser for
 * something that doesn't exist yet.
 *
 * `audience` decides which surface the link goes to, because the
 * contractor flows live under /contractor and are role-guarded.
 */
const FLOWS = [
  {
    icon: "Phone",
    audience: "Contractors",
    title: "Schedule a call order",
    body: "Pick a category, choose a slot, and place a large order with a person instead of a cart.",
    steps: ["Choose category", "Pick a time", "We call you"],
    href: "/contractor/call-order",
  },
  {
    icon: "Package",
    audience: "Contractors",
    title: "Build a customer package",
    body: "Bundle materials at trade pricing, send it to your client, and track approval.",
    steps: ["Add products", "Add customer", "Share & approve"],
    href: "/contractor/packages/new",
  },
  {
    icon: "FileUp",
    audience: "Contractors",
    title: "Upload a drawing",
    body: "Send a drawing and get back the material list it needs, ready to order.",
    steps: ["Upload", "Add comments", "Review materials"],
    href: "/contractor/drawings",
  },
  {
    icon: "Crown",
    audience: "Homeowners",
    title: "Premium supply",
    body: "A takeoff from your drawings, trade pricing and delivery booked around your dates.",
    steps: ["Choose a tier", "Project profile", "We contact you"],
    href: "/premium-request",
  },
] as const;

export function ServiceShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-ink text-ink-foreground">
      <BlueprintGrid className="text-white" opacity={0.07} />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-hi-vis uppercase">
            Services that do the work
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-ink-foreground sm:mt-3 sm:text-4xl">
            More than a catalogue.
          </h2>
          <p className="mt-2.5 text-sm text-pretty text-ink-foreground/75 sm:mt-4 sm:text-lg">
            Book a call, build a package for your customer, turn a drawing
            into a material list, or let us work out the whole order for you.
          </p>
        </div>

        <div className="mt-6 grid gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:mt-12 lg:grid-cols-4">
          {FLOWS.map((flow) => (
            <Link
              key={flow.href}
              href={flow.href}
              className={cn(
                // Solid light cards against the dark band: higher
                // contrast than a translucent panel, and they read as
                // product cards rather than an overlay.
                "group relative overflow-hidden rounded-xl bg-card p-3.5 text-card-foreground sm:flex sm:flex-col sm:p-5",
                "shadow-[0_1px_2px_rgb(0_0_0/0.16)] transition-[box-shadow,transform] duration-200",
                "hover:shadow-[0_8px_24px_rgb(0_0_0/0.28)] sm:hover:-translate-y-1",
                "focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:outline-none",
              )}
            >
              {/* Phones: icon beside the title instead of above it, and
                  the numbered steps collapse to one inline line. The
                  stacked layout made each card nearly a full screen. */}
              <div className="flex items-center gap-3 sm:block">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-11">
                  <Icon name={flow.icon} className="size-4.5 sm:size-5.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-wider text-primary uppercase sm:mt-4 sm:text-[11px]">
                    {flow.audience}
                  </p>
                  <h3 className="text-base font-semibold sm:mt-1.5 sm:text-lg">
                    {flow.title}
                  </h3>
                </div>

                <ArrowRight
                  className="size-4 shrink-0 text-primary sm:hidden"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">
                {flow.body}
              </p>

              {/* One line on a phone; the numbered list returns at sm. */}
              <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground sm:hidden">
                {flow.steps.map((step, index) => (
                  <span key={step}>
                    {index > 0 ? <span className="mr-1.5">›</span> : null}
                    {step}
                  </span>
                ))}
              </p>

              <ol className="mt-4 hidden flex-col gap-1.5 border-t border-border pt-4 sm:flex">
                {flow.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2.5 text-xs text-muted-foreground"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <span className="mt-4 hidden items-center gap-1.5 text-sm font-medium text-primary sm:inline-flex">
                Start
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
