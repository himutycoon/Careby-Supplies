"use client";

import * as React from "react";
import { ProductSelector } from "@/components/wizard-kit/product-selector";
import { stageSlot } from "@/services/curated-products";
import { cn } from "@/lib/utils";
import type { ScopeStage } from "@/data/project-scopes";

/**
 * What we stock for each part they ticked, one stage at a time.
 *
 * Extracted alongside ScopeChecklist so the contractor's order-by-
 * category flow shows the same grid the homeowner sees, at trade
 * prices. The only difference between the two is `showContractorPrice`.
 *
 * Which stage is open is this component's own business — the caller
 * passes the ticked stages and nothing else — so neither flow has to
 * carry a piece of state that only exists for this screen.
 */
export function ScopeMaterials({
  projectId,
  stages,
  showContractorPrice = false,
  helper,
}: {
  /** The project scope these stages came from, for curated lookups. */
  projectId: string;
  /** The ticked stages, in scope order. */
  stages: ScopeStage[];
  showContractorPrice?: boolean;
  helper?: string;
}) {
  const [openStage, setOpenStage] = React.useState("");

  /*
   * Open the first ticked stage on arrival rather than an empty grid,
   * and re-open it if the ticks change underneath — a stage that is no
   * longer ticked must not stay on screen.
   *
   * Compared as a string rather than an effect, because this is derived
   * state: the open stage is a function of what is ticked.
   */
  const view = `${projectId}|${stages.map((s) => s.id).join(",")}`;
  const [lastView, setLastView] = React.useState(view);
  if (view !== lastView) {
    setLastView(view);
    setOpenStage(stages[0]?.id ?? "");
  }

  const active = stages.find((s) => s.id === openStage) ?? stages[0];
  if (!active) return null;

  return (
    <div className="flex flex-col gap-4">
      {helper ? (
        <p className="text-sm text-muted-foreground">{helper}</p>
      ) : null}

      {/* One stage open at a time: a bathroom can carry 29 of them,
          and fetching a grid for every one would be 29 requests to
          fill a screen nobody has scrolled to yet. */}
      <div className="scroll-row gap-2 pb-1">
        {stages.map((stage) => {
          const on = stage.id === active.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setOpenStage(stage.id)}
              aria-pressed={on}
              className={cn(
                "press flex min-h-9 items-center rounded-full border px-3 text-sm font-medium whitespace-nowrap",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {stage.label}
            </button>
          );
        })}
      </div>

      <ProductSelector
        key={active.id}
        slot={stageSlot(projectId, active.id)}
        tags={active.tags}
        keywords={active.keywords}
        categoryIds={active.categories}
        showContractorPrice={showContractorPrice}
        emptyMessage={`We don't stock ${active.label.toLowerCase()} online yet — leave it ticked and we'll price it with your request.`}
      />
    </div>
  );
}
