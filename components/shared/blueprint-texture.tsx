import { cn } from "@/lib/utils";

/**
 * Construction-industry surface texture.
 *
 * The project ships with no photography, and hotlinking stock images
 * would be fragile and a licensing problem. These give sections the feel
 * of drawing paper without pretending to be photos of work CareBy has
 * done.
 *
 * Implemented with CSS gradients rather than SVG <pattern> on purpose:
 * pattern defs need document-unique ids, and these render more than once
 * per page (hero and showcase both use the grid). Duplicate ids are
 * invalid and the second instance silently references the first.
 *
 * Decorative only: aria-hidden, pointer-events-none, behind content at
 * low opacity so text contrast is unaffected.
 */

/** Fine blueprint grid with heavier major gridlines. */
export function BlueprintGrid({
  className,
  opacity = 0.05,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        className,
      )}
      style={{
        opacity,
        backgroundImage: [
          // Major gridlines
          "linear-gradient(to right, currentColor 1.5px, transparent 1.5px)",
          "linear-gradient(to bottom, currentColor 1.5px, transparent 1.5px)",
          // Minor gridlines
          "linear-gradient(to right, currentColor 1px, transparent 1px)",
          "linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px",
      }}
    />
  );
}
