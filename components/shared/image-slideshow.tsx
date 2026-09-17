"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteImage } from "@/data/site-images";

const INTERVAL_MS = 5000;
const FADE_MS = 900;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Subscribes to the OS motion preference.
 *
 * matchMedia is an external store, so useSyncExternalStore is the right
 * primitive — mirroring it into state inside an effect causes a second
 * render pass and trips react-hooks/set-state-in-effect.
 */
function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    // On the server assume motion is fine; the client corrects on
    // hydration, and the only cost is one frame of a fade.
    () => false,
  );
}

/**
 * Crossfading image panel for the hero surfaces.
 *
 * Behaviour is deliberately conservative:
 *   - One image renders as a still, with no timer and no controls.
 *   - Motion stops entirely under `prefers-reduced-motion`; it shows the
 *     first slide and the dots still work as manual navigation. An
 *     auto-advancing carousel is exactly what that setting exists to
 *     prevent.
 *   - The timer pauses when the tab is hidden, so returning to the page
 *     doesn't replay a burst of queued transitions.
 *   - A visible pause control, because WCAG 2.2.2 requires any
 *     auto-moving content lasting over five seconds to be stoppable.
 *
 * Images are stacked with opacity rather than translated, so there is no
 * layout work per frame — only compositor-level opacity.
 */
export function ImageSlideshow({
  slides,
  className,
  imageClassName,
}: {
  slides: SiteImage[];
  className?: string;
  imageClassName?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const total = slides.length;
  const animating = total > 1 && !paused && !reducedMotion;

  React.useEffect(() => {
    if (!animating) return;

    const timer = setInterval(() => {
      // A hidden tab still fires intervals; skipping keeps the sequence
      // in step with what the viewer has actually seen.
      if (document.hidden) return;
      setIndex((current) => (current + 1) % total);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [animating, total]);

  if (total === 0) return null;

  return (
    <div
      className={cn("group relative overflow-hidden", className)}
      aria-roledescription={total > 1 ? "carousel" : undefined}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity ease-in-out motion-reduce:transition-none"
          style={{
            opacity: i === index ? 1 : 0,
            transitionDuration: `${FADE_MS}ms`,
          }}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.alt}
            // Only the first slide is worth blocking paint for.
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className={cn("size-full object-cover", imageClassName)}
          />
        </div>
      ))}

      {total > 1 ? (
        <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-sm"
            role="tablist"
            aria-label="Choose slide"
          >
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1} of ${total}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "size-1.5 rounded-full transition-all duration-200",
                  i === index
                    ? "w-4 bg-white"
                    : "bg-white/45 hover:bg-white/70",
                )}
              />
            ))}
          </div>

          {!reducedMotion ? (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
              className="flex size-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              {paused ? (
                <Play className="size-3 fill-current" aria-hidden="true" />
              ) : (
                <Pause className="size-3 fill-current" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
