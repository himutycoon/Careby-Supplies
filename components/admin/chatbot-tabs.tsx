"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Admin > Chatbot as tabs instead of one long scroll. Only the open tab is
 * mounted (the flow canvas needs a visible box to fit itself). The URL hash
 * picks the tab, so links like #inbox or #rules (a Library sub-tab) work
 * from anywhere on the page and the back button steps between tabs.
 */

export type ChatbotTab = { id: string; label: string; badge?: number | null };

export function ChatbotTabs({
  tabs,
  panels,
  aliases = {},
}: {
  tabs: ChatbotTab[];
  panels: Record<string, React.ReactNode>;
  /** extra hashes that open a tab, e.g. { rules: "library" } */
  aliases?: Record<string, string>;
}) {
  const ids = React.useMemo(() => tabs.map((t) => t.id), [tabs]);
  const [active, setActive] = React.useState(ids[0]);
  const bar = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      const id = ids.includes(h) ? h : aliases[h];
      if (id) setActive(id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [ids, aliases]);

  function open(id: string) {
    // pushState keeps the back button working without a hashchange round trip
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    setActive(id);
    // keep the tab bar in view when switching from far down a long tab
    const el = bar.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 76;
      if (window.scrollY > top) window.scrollTo({ top });
    }
  }

  return (
    <>
      <div ref={bar} className="sticky top-18 z-30 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-1.5">
        <nav aria-label="Assistant sections" className="flex gap-1 overflow-x-auto py-1.5" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              onClick={() => open(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition",
                active === t.id ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t.label}
              {t.badge ? (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold",
                    active === t.id ? "bg-primary-foreground/20" : "bg-orange-500/15 text-orange-700 dark:text-orange-300",
                  )}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>
      <div role="tabpanel" className="flex min-w-0 flex-col gap-6">
        {panels[active]}
      </div>
    </>
  );
}
