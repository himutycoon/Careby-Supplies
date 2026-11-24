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
 * The chat assistant owns the bottom-right corner, so this stacks above
 * the chat launcher instead of on top of it. Hidden on phones.
 *
 * z-30 deliberately sits under the sticky header, the tab bar and any
 * dialog or sheet (z-40+). Nothing overlaps it spatially, but a modal
 * must always win.
 */
export function ExpertFab() {
  const pathname = usePathname();

  // On the contact form itself the button would scroll the user to the
  // form they are already filling in.
  if (SUPPRESSED.includes(pathname) || pathname.startsWith("/admin")) return null;

  /*
   * Desktop only. On a phone the chat assistant already sits in the
   * corner with its own "Talk to expert" option, so a second floating
   * button beside it is the same offer twice and covers the page.
   */
  return (
    <Link
      href="/contact?about=consultation"
      data-slot="expert-fab"
      className="glow-hi-vis press fixed right-6 bottom-20 z-30 hidden h-11 items-center gap-1.5 rounded-full bg-hi-vis px-4 text-[13px] font-semibold text-hi-vis-foreground transition-transform hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:inline-flex"
    >
      <Headset className="size-4 shrink-0" aria-hidden="true" />
      Talk to an Expert
    </Link>
  );
}
