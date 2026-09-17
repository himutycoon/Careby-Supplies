"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Icon } from "@/components/shared/icon";
import { useCart } from "@/components/shop/cart-provider";
import { cn } from "@/lib/utils";
import type { AppNavItem } from "@/data/navigation";

const PRIMARY_COUNT = 4;

function isActiveHref(pathname: string, href: string): boolean {
  // Section roots match exactly; deeper routes match by prefix.
  // "/" must be exact — every path startsWith("/"), so prefix matching
  // would leave Home lit up on every screen.
  return ["/", "/contractor", "/dashboard", "/admin"].includes(href)
    ? pathname === href
    : pathname.startsWith(href);
}

/**
 * Mobile bottom navigation. Shows four primary destinations plus a
 * "More" sheet, so every sidebar destination stays reachable on small
 * screens (the sidebar itself is desktop-only).
 */
export function MobileTabBar({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { itemCount } = useCart();

  const primary = items.slice(0, PRIMARY_COUNT);
  const overflow = items.slice(PRIMARY_COUNT);
  const overflowActive = overflow.some((item) =>
    isActiveHref(pathname, item.href),
  );

  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      aria-label="Primary"
    >
      <ul className="flex items-stretch">
        {primary.map((item) => {
          const active = isActiveHref(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "press relative flex h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={
                  item.badge === "cart" && itemCount > 0
                    ? `${item.label}, ${itemCount} items`
                    : undefined
                }
              >
                {active ? (
                  <span
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative">
                  <Icon name={item.icon} className="size-5" />
                  {item.badge === "cart" && itemCount > 0 ? (
                    <span className="absolute -top-1 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-4 font-semibold text-primary-foreground tabular-nums">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  ) : null}
                </span>
                <span className="line-clamp-1">{item.label}</span>
              </Link>
            </li>
          );
        })}

        {overflow.length > 0 ? (
          <li className="flex-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "press flex h-16 w-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                      overflowActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <MoreHorizontal className="size-5" aria-hidden="true" />
                    <span>More</span>
                  </button>
                }
              />
              <SheetContent
                side="bottom"
                className="pb-[calc(2rem+env(safe-area-inset-bottom))]"
              >
                <SheetHeader>
                  <SheetTitle>All destinations</SheetTitle>
                </SheetHeader>
                <ul className="grid grid-cols-2 gap-2 px-4">
                  {overflow.map((item) => {
                    const active = isActiveHref(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "press flex min-h-12 items-center gap-2.5 rounded-lg border px-3 py-3 text-sm font-medium",
                            active
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <Icon name={item.icon} className="size-4 shrink-0" />
                          <span className="line-clamp-1">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </SheetContent>
            </Sheet>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
