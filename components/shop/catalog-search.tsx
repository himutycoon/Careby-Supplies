"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Catalog search for the site header.
 *
 * The magnifier is the submit button, not decoration. On a phone the
 * field sits inline in the header with no room for a labelled "Search"
 * control, and an icon that looks like a button but does nothing when
 * tapped reads as broken — pressing Enter is not discoverable on a
 * touch keyboard. Enter still submits either way.
 *
 * One component rather than a form per breakpoint: the two copies in
 * the navbar had drifted apart already (one hovered its border, one
 * did not), and the submit affordance is needed by both.
 */
export function CatalogSearch({
  className,
  placeholder = "Search materials, tools, SKU...",
  variant = "header",
}: {
  className?: string;
  /** Shortened on narrow layouts, where the full string just clips. */
  placeholder?: string;
  /**
   * `hero` is the big one: taller, on a white pill, with a labelled
   * button instead of a bare magnifier. It is the primary way into the
   * catalogue on that screen, so it should look like one.
   */
  variant?: "header" | "hero";
}) {
  const router = useRouter();
  const [term, setTerm] = React.useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = term.trim();
    router.push(
      query ? `/products?q=${encodeURIComponent(query)}#catalog` : "/products",
    );
  }

  if (variant === "hero") {
    return (
      <form
        onSubmit={handleSubmit}
        role="search"
        className={cn(
          "flex w-full items-center gap-2 rounded-full bg-background p-1.5 pl-4 shadow-lg ring-1 ring-black/5",
          className,
        )}
      >
        <Search
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={placeholder}
          aria-label="Search products"
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none sm:text-sm"
        />
        <button
          type="submit"
          className="press h-10 shrink-0 rounded-full bg-hi-vis px-5 text-sm font-semibold text-hi-vis-foreground transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Search
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("relative min-w-0", className)}
    >
      {/* 16px text below sm, or iOS zooms the page in on focus — which
          on a sticky header leaves the user scrolled sideways. */}
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="h-10 w-full rounded-lg border border-input bg-background pr-10 pl-3 text-base transition-colors hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:text-sm"
      />
      <button
        type="submit"
        aria-label="Search"
        className="press absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
