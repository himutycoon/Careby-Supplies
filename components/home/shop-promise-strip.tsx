import Link from "next/link";
import { BadgePercent, HardHat, PhoneCall, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Thin service bar between the hero and the catalog.
 *
 * Four claims the business can actually stand behind — no delivery
 * promise in days, because lead times are per-product and already shown
 * on the product page. Each one is a link, so the strip is navigation
 * rather than decoration.
 */
const PROMISES = [
  {
    icon: Truck,
    title: "Delivery across the GTA",
    caption: "Scheduled to your site",
    href: "/services",
  },
  {
    icon: BadgePercent,
    title: "Trade pricing",
    caption: "For verified contractors",
    href: "/signup?role=contractor",
  },
  {
    icon: HardHat,
    title: "Bulk & project orders",
    caption: "Quoted for the whole job",
    href: "/contact?about=quote",
  },
  {
    icon: PhoneCall,
    title: "Talk to an advisor",
    caption: "Product choice and quantities",
    href: "/contact",
  },
] as const;

export function ShopPromiseStrip() {
  return (
    <section
      aria-label="Ordering and delivery"
      className="border-b border-border/70 bg-background"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden bg-border/70 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {PROMISES.map(({ icon: Glyph, title, caption, href }) => (
          <Link
            key={title}
            href={href}
            className={cn(
              "group flex items-center gap-3 bg-background px-3 py-4 transition-colors hover:bg-muted/50",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-5",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Glyph className="size-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium group-hover:text-primary">
                {title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {caption}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
