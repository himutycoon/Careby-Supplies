import Link from "next/link";
import { ChevronRight, HardHat, Home } from "lucide-react";
import { USER_TYPES } from "@/data/platform";

/*
 * Homeowner first here, contractor first in USER_TYPES.
 *
 * The order in the data suits the contractor-facing surfaces. On the
 * public home page most visitors are homeowners, and the first row is
 * the one a thumb reaches without thinking.
 */
const ORDER = ["homeowner", "contractor"] as const;

const ICONS = { homeowner: Home, contractor: HardHat } as const;

const BLURB: Record<string, string> = {
  homeowner: "Plan your dream space",
  contractor: "Get trade pricing & bulk",
};

/**
 * "I'm a…" — the fork, placed directly under the hero on phones.
 *
 * The hero already carries two pills, but they are a nudge beside the
 * main call to action. This is the same choice given room: full-width
 * rows, a line of copy each, and a chevron, so a first-time visitor on a
 * phone can pick their path without scrolling to the section that
 * explains it further down.
 *
 * Phone only. On desktop the hero pills and the "What are you working
 * on?" section already cover this, and a third copy would be noise.
 */
export function RoleChooserCard() {
  return (
    <section className="px-4 pt-6 lg:hidden">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          I&apos;m a…
        </h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {ORDER.map((id) => USER_TYPES.find((t) => t.id === id)!).map((type) => {
            const Icon = ICONS[type.id];
            return (
              <Link
                key={type.id}
                href={type.href}
                className="press-sm group flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span
                  className={
                    type.id === "homeowner"
                      ? "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      : "flex size-10 shrink-0 items-center justify-center rounded-lg bg-hi-vis/20 text-hi-vis-foreground dark:text-hi-vis"
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {type.shortLabel}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {BLURB[type.id]}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
