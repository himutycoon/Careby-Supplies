"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, User } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import type { AppNavItem } from "@/data/navigation";

export function DashboardSidebar({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar lg:block">
      <div className="sticky top-18 flex h-[calc(100vh-4.5rem)] flex-col justify-between overflow-y-auto p-3">
        <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
          {items.map((item, index) => {
            // Section roots must match exactly, or they'd light up for
            // every child route.
            const isActive = ["/contractor", "/dashboard", "/admin"].includes(
              item.href,
            )
              ? pathname === item.href
              : pathname.startsWith(item.href);

            // A heading is printed whenever the group changes, so a long
            // flat list reads as a few short ones.
            const showGroup =
              item.group && item.group !== items[index - 1]?.group;

            return (
              <React.Fragment key={item.href}>
                {showGroup ? (
                  <p className="mt-4 px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase first:mt-0">
                    {item.group}
                  </p>
                ) : null}
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon name={item.icon} className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="flex flex-col gap-0.5 border-t border-border pt-3">
          {/* Was /dashboard/profile, which never existed — a 404 in the
              sidebar of every signed-in screen. */}
          <Link
            href="/account"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <User className="size-4 shrink-0" aria-hidden="true" />
            Account
          </Link>
          <Link
            href="/contact?about=support"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HelpCircle className="size-4 shrink-0" aria-hidden="true" />
            Help & Support
          </Link>
        </div>
      </div>
    </aside>
  );
}
