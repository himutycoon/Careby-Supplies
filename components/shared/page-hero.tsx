import { BlueprintGrid } from "@/components/shared/blueprint-texture";
import { siteImage, siteImageAlt, type SiteImageSlot } from "@/data/site-images";
import { cn } from "@/lib/utils";

/**
 * Commercial page hero, shared by the catalog and services pages.
 *
 * The background photo is optional: set the matching slot in
 * data/site-images.ts and the section flips to navy with a scrim so the
 * headline stays readable over any image. Without one it keeps a warm
 * concrete ground and a faint blueprint grid, which looks deliberate
 * rather than unfinished.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  imageSlot,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  imageSlot?: SiteImageSlot;
  /** CTA buttons — rendered right-aligned on desktop. */
  actions?: React.ReactNode;
}) {
  const background = imageSlot ? siteImage(imageSlot) : undefined;

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border",
        background
          ? "bg-ink text-ink-foreground"
          : "bg-surface-muted",
      )}
    >
      {background ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={background}
            alt={imageSlot ? siteImageAlt(imageSlot) : ""}
            className="absolute inset-0 size-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink/80" />
        </>
      ) : (
        <BlueprintGrid className="text-foreground" opacity={0.04} />
      )}

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div
          className={cn(
            "grid gap-6",
            actions && "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12",
          )}
        >
          <div className="max-w-2xl">
            {eyebrow ? (
              <p
                className={cn(
                  "text-xs font-semibold tracking-[0.16em] uppercase",
                  // Navy-on-navy would vanish under the scrim.
                  background ? "text-hi-vis" : "text-primary",
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl",
                eyebrow && "mt-3",
              )}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={cn(
                  "mt-4 max-w-xl text-pretty sm:text-lg",
                  background
                    ? "text-ink-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
