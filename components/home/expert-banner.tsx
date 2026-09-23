import Link from "next/link";
import { ChevronRight, Headset } from "lucide-react";

/**
 * "Talk to a CareBy Expert" — an inline row, not a floating button.
 *
 * The floating control is deliberately suppressed on this page for
 * phones (see ExpertFab): at 390px it covers the bottom-right corner of
 * whatever you are reading, and the home page is exactly where someone
 * is browsing products. A row in the flow says the same thing without
 * sitting on top of the content.
 */
export function ExpertBanner() {
  return (
    <section className="px-4 py-6 sm:px-6">
      <Link
        href="/contact?about=consultation"
        className="press-sm group mx-auto flex max-w-6xl items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hi-vis text-hi-vis-foreground">
          <Headset className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Talk to a CareBy Expert</span>
          <span className="block text-xs text-muted-foreground sm:text-sm">
            Get help with products, quantities and your project.
          </span>
        </span>
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
