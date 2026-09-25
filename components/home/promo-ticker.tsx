import { FREE_DELIVERY_THRESHOLD } from "@/lib/rules/order-totals";

/**
 * The running strip under the hero.
 *
 * Every claim here has to be one the rest of the site keeps: the free
 * delivery figure is read from the order rules rather than typed, and
 * the returns window is the one the Premium FAQ states. A ticker full of
 * promises nobody honours is worse than no ticker.
 *
 * It is decoration for a sighted visitor scanning the page, so the
 * duplicated track is hidden from assistive tech and the first copy
 * carries the text once.
 */
const CLAIMS = [
  "Better products than your local building supply store — at better prices",
  "Trade pricing for contractors on every order",
  `Free delivery across the GTA over $${FREE_DELIVERY_THRESHOLD}`,
  "Send us a room or a drawing — we work out the material list free",
  "Unused material comes back within 30 days",
  "Scheduled to your install date, not ours",
];

function Claims({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden ? "true" : undefined}
    >
      {CLAIMS.map((claim) => (
        <li key={claim} className="flex items-center gap-8 px-8">
          <span className="text-sm font-medium whitespace-nowrap">{claim}</span>
          <span
            className="size-1.5 rounded-full bg-hi-vis"
            aria-hidden="true"
          />
        </li>
      ))}
    </ul>
  );
}

export function PromoTicker() {
  return (
    <div className="overflow-hidden border-y border-white/10 bg-ink py-2.5 text-ink-foreground">
      <div className="marquee flex w-max">
        <Claims />
        <Claims hidden />
      </div>
    </div>
  );
}
