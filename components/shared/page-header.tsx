import { cn } from "@/lib/utils";

/**
 * Compact page heading for marketing and catalog pages.
 *
 * Deliberately smaller than the homepage hero: on a listing page the
 * title is a label, not a headline, and the display scale pushed the
 * actual content (filters, grid) off the first screen.
 */
export function PageHeader({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  /** Listing pages read better left-aligned, close to the content. */
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "mx-auto px-4 pt-8 pb-4 sm:px-6 sm:pt-12 sm:pb-6",
        align === "center" ? "max-w-3xl text-center" : "max-w-7xl lg:px-8",
      )}
    >
      <h1 className="text-2xl sm:text-3xl lg:text-4xl">{title}</h1>
      {subtitle ? (
        <p
          className={cn(
            "mt-2 text-sm text-muted-foreground sm:text-base",
            align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
