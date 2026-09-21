import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The header every dashboard panel shares: icon, title, optional
 * "View all". Exported separately so a client component that owns its
 * own heading (RecommendedProducts changes its title with the data) can
 * still render the identical header.
 */
export function PanelHeader({
  icon: IconComponent,
  title,
  subtitle,
  href,
  hrefLabel = "View all",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <IconComponent
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 className="font-sans text-base font-semibold tracking-normal">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {hrefLabel}
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export function DashboardPanel({
  icon,
  title,
  subtitle,
  href,
  hrefLabel,
  id,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  /** Anchor target — the sidebar's "My projects" links to #projects. */
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        // scroll-mt clears the sticky top bar when an anchor jumps here.
        "scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-5",
        className,
      )}
    >
      <PanelHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        href={href}
        hrefLabel={hrefLabel}
      />
      {children}
    </section>
  );
}
