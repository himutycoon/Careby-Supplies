"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScopeStage } from "@/data/project-scopes";

/**
 * "Tick every part you need materials for."
 *
 * Extracted from the homeowner's material checklist so the contractor's
 * order-by-category flow can show the same thing rather than a second
 * implementation of it. The client asked for them to match; two copies
 * of this that look the same on the day they are written is not the
 * same thing as one component.
 *
 * Deliberately stateless. The caller owns `picked`, because the two
 * flows keep it in different places — the homeowner's lives in a
 * persisted store so a login round trip cannot lose it, the
 * contractor's is ordinary state inside a wizard that is already
 * behind a login.
 */
export function ScopeChecklist({
  stages,
  picked,
  onToggle,
  onSelectAll,
  onClear,
}: {
  stages: ScopeStage[];
  picked: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Tick every part you need materials for. {picked.size} of{" "}
          {stages.length} selected.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
            Select all
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stages.map((stage) => {
          const on = picked.has(stage.id);
          return (
            <button
              key={stage.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(stage.id)}
              className={cn(
                "flex min-w-0 items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                on
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {on ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-tight font-medium">
                  {stage.label}
                </span>
                {stage.note ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {stage.note}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
