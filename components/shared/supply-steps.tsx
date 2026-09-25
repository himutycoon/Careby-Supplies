import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * How a flow works, in three steps, with the last one naming who does
 * the physical work.
 *
 * This replaces a tinted callout that said the same thing. The callout
 * was read as a warning — a bordered box with an icon is an alert
 * whatever words are in it, and being told off before you have done
 * anything is a poor way to open a form. Said as the third step of a
 * process it is just how the job goes: you ask, we price the material,
 * your trades fit it.
 *
 * Deliberately unboxed: no border, no fill, no accent panel. It is part
 * of the page header rather than an interruption of it.
 */
export interface SupplyStep {
  icon: LucideIcon;
  title: string;
  body: string;
}

export function SupplySteps({
  steps,
  className,
}: {
  steps: SupplyStep[];
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "grid gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-3",
        className,
      )}
    >
      {steps.map(({ icon: Glyph, title, body }, index) => (
        <li key={title} className="flex items-start gap-3 sm:flex-col sm:gap-2">
          <span className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Glyph className="size-3.5" aria-hidden="true" />
            </span>
            {/* The number carries the sequence on a phone, where the
                three sit stacked and left-to-right order is lost. */}
            <span className="text-xs font-semibold text-muted-foreground tabular-nums sm:hidden">
              {index + 1}
            </span>
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-medium">{title}</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
              {body}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
