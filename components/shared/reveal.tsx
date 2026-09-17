import { cn } from "@/lib/utils";

/**
 * Fades and lifts its children as they scroll into view.
 *
 * Deliberately a Server Component with no JavaScript: the whole effect
 * is a CSS scroll-driven animation (`animation-timeline: view()`), so
 * there is no observer, no hydration and no state.
 *
 * Where that CSS isn't supported the `@supports` guard simply never
 * applies and content renders normally — the failure mode is "no
 * animation", never "invisible page", which is the usual bug with
 * JS-driven reveals that start at opacity 0.
 *
 * Motion is also skipped entirely under `prefers-reduced-motion`.
 */
export function Reveal({
  children,
  className,
  /** Stagger within a group. Keep the whole group under ~200ms. */
  delay,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: 75 | 150 | 225;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={cn(
        "reveal",
        delay === 75 && "reveal-delay-1",
        delay === 150 && "reveal-delay-2",
        delay === 225 && "reveal-delay-3",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
