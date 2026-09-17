import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import type { AppNavItem } from "@/data/navigation";

export function QuickActionGrid({ items }: { items: AppNavItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon name={item.icon} className="size-5" />
          </span>
          <span className="text-xs font-medium leading-tight">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
