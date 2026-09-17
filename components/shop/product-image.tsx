import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product imagery slot for catalog and cart surfaces.
 *
 * Deliberately separate from EditorialImage: that one paints a tinted
 * architectural gradient, which reads as art direction on a marketing
 * page but as "broken product photo" in a shop grid. Here a missing
 * image gets a neutral container instead, so a catalog with partial
 * photography still looks deliberate.
 *
 * Photos are object-contain on a light ground — supplier shots are cut
 * out on white and get cropped badly by object-cover.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizeHint = "grid",
}: {
  src?: string;
  alt: string;
  className?: string;
  /** Controls padding — a detail page can breathe more than a grid tile. */
  sizeHint?: "grid" | "detail" | "thumb";
}) {
  const padding = {
    grid: "p-3",
    detail: "p-6",
    thumb: "p-1.5",
  }[sizeHint];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-surface-muted",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "size-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.04]",
            padding,
          )}
        />
      ) : (
        <span
          className="flex flex-col items-center gap-1.5 text-muted-foreground"
          role="img"
          aria-label={`${alt} — no photo available`}
        >
          <Package
            className={cn(sizeHint === "thumb" ? "size-4" : "size-7")}
            aria-hidden="true"
          />
          {sizeHint !== "thumb" ? (
            <span className="text-[10px] font-medium tracking-wide uppercase">
              No photo
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}
