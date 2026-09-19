"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset } from "lucide-react";

/** Routes where a floating "talk to us" would be talking over itself. */
const SUPPRESSED = ["/contact", "/get-started"];

/**
 * Floating "Talk to an Expert" control, persistent across the public
 * site.
 *
 * Bottom-right rather than centred: centre-bottom is where the mobile
 * tab bar lives, and on desktop a centred bar covers the content a
 * reader is working through. The `bottom-tabbar` offset lifts it clear
 * of that bar (and the iOS home indicator) on phones; desktop drops it
 * back to a normal inset since the bar is lg:hidden.
 *
 * z-30 deliberately sits under the sticky header, the tab bar and any
 * dialog or sheet (z-40+). Nothing overlaps it spatially, but a modal
 * must always win.
 */
export function ExpertFab() {
  const pathname = usePathname();

  // On the contact form itself the button would scroll the user to the
  // form they are already filling in.
  if (SUPPRESSED.includes(pathname)) return null;

  return (
    <Link
      href="/contact?about=consultation"
      data-slot="expert-fab"
      className="glow-hi-vis press bottom-tabbar fixed right-4 z-30 inline-flex items-center gap-2 rounded-full bg-hi-vis px-4 py-3 text-sm font-semibold text-hi-vis-foreground transition-transform hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-5 lg:right-6 lg:bottom-6"
    >
      <Headset className="size-5 shrink-0" aria-hidden="true" />
      Talk to an Expert
    </Link>
  );
}
