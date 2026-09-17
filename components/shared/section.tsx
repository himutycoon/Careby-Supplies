import { cn } from "@/lib/utils";

/**
 * Consistent page-section rhythm: max width, horizontal gutters and
 * vertical spacing. Every marketing section uses this so paddings never
 * drift between sections.
 */
export function Section({
  children,
  className,
  width = "default",
  tone = "default",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  width?: "default" | "wide" | "narrow";
  tone?: "default" | "muted" | "ink";
  /** Anchor target, so in-page CTAs can scroll to a section. */
  id?: string;
}) {
  const widths = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
  };

  const tones = {
    default: "",
    // A cool tinted ground that sits under the navy rather than
    // fighting it. The token carries the dark-theme value too.
    muted: "bg-surface-muted",
    ink: "bg-ink text-ink-foreground",
  };

  return (
    <section id={id} className={cn(tones[tone], className)}>
      {/* Tighter vertical rhythm on phones — desktop spacing on a small
          screen reads as dead space and pushes content below the fold. */}
      <div
        className={cn(
          "mx-auto px-4 py-10 sm:px-6 sm:py-16 lg:py-24",
          widths[width],
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "default",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  tone?: "default" | "inverted";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "font-sans text-xs font-semibold tracking-[0.14em] uppercase",
            tone === "inverted" ? "text-hi-vis" : "text-primary",
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "text-balance",
          tone === "inverted" && "text-ink-foreground",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "text-pretty text-base",
            tone === "inverted"
              ? "text-ink-foreground/70"
              : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
