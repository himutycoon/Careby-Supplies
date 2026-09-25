import Link from "next/link";
import { MapPin, ShieldCheck, Truck } from "lucide-react";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/rules/order-totals";

/**
 * The strip above the header.
 *
 * Two jobs at once: the three things worth knowing before you start
 * shopping, and the links people arrive looking for rather than browse
 * to — an order they are chasing, or a person to ask.
 *
 * Static on a wide screen, where all six fit. Below lg there is nowhere
 * near the room, so the same three claims scroll instead and the links
 * stand down to the header's own menu. One set of facts either way: the
 * delivery figure is read from the order rules rather than typed, so it
 * cannot drift from what checkout actually charges.
 */
const CLAIMS = [
  {
    icon: Truck,
    text: `Free delivery on orders over $${FREE_DELIVERY_THRESHOLD}`,
  },
  { icon: ShieldCheck, text: "Trusted supplies for your project" },
  { icon: MapPin, text: "Serving across the GTA" },
];

const LINKS = [
  { label: "Track order", href: "/orders" },
  { label: "Help", href: "/faq" },
  { label: "Contact us", href: "/contact" },
];

function ClaimList({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden ? "true" : undefined}
    >
      {CLAIMS.map(({ icon: Glyph, text }) => (
        <li key={text} className="flex items-center gap-2 px-6">
          <Glyph className="size-3.5 shrink-0 text-hi-vis" aria-hidden="true" />
          <span className="text-xs whitespace-nowrap">{text}</span>
        </li>
      ))}
    </ul>
  );
}

export function UtilityBar() {
  return (
    <div className="bg-ink text-ink-foreground">
      {/* Phone and tablet: the claims scroll past. */}
      <div className="overflow-hidden py-2 lg:hidden">
        <div className="marquee flex w-max">
          <ClaimList />
          <ClaimList hidden />
        </div>
      </div>

      {/* Desktop: everything sits still and the links take the right. */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-8 py-2 lg:flex">
        <ul className="flex items-center gap-7">
          {CLAIMS.map(({ icon: Glyph, text }) => (
            <li key={text} className="flex items-center gap-2">
              <Glyph
                className="size-3.5 shrink-0 text-hi-vis"
                aria-hidden="true"
              />
              <span className="text-xs">{text}</span>
            </li>
          ))}
        </ul>

        <nav aria-label="Support">
          <ul className="flex items-center gap-5 text-xs">
            {LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-ink-foreground/70 transition-colors hover:text-ink-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
