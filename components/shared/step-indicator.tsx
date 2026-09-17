import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared progress indicator for every multi-step flow (wizards,
 * checkout, package builder) so step affordances stay identical
 * across the product.
 */
export function StepIndicator({
  steps,
  current,
  className,
}: {
  steps: string[];
  current: number;
  className?: string;
}) {
  return (
    <ol
      className={cn("flex items-center gap-2 sm:gap-0", className)}
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const isComplete = index < current;
        const isCurrent = index === current;

        return (
          <li
            key={step}
            className="flex flex-1 items-center last:flex-none sm:last:flex-1"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  isCurrent &&
                    "border-primary bg-primary text-primary-foreground",
                  isComplete && "border-primary bg-primary/10 text-primary",
                  !isCurrent &&
                    !isComplete &&
                    "border-border text-muted-foreground",
                )}
              >
                {isComplete ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium whitespace-nowrap sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>

            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "mx-2 h-px flex-1 transition-colors sm:mx-3",
                  isComplete ? "bg-primary" : "bg-border",
                )}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
