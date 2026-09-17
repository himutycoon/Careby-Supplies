"use client";

import * as React from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Inline stock adjuster.
 *
 * Changing a count was previously a ten-field modal; here it is two taps
 * from the list. Edits are debounced and written once the user stops
 * changing the number, so holding "+" is a single write rather than one
 * per press.
 */
export function StockControl({
  value,
  unit,
  pending,
  onCommit,
}: {
  value: number;
  unit: string;
  pending?: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = React.useState(value);
  const [dirty, setDirty] = React.useState(false);

  // Held in a ref so a new inline callback each render doesn't restart
  // the debounce timer below.
  const onCommitRef = React.useRef(onCommit);
  React.useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  // Follow the server value, but never clobber an edit in flight.
  // Adjusting during render is React's documented pattern for state
  // derived from props — doing it in an effect causes a second render
  // pass and trips react-hooks/set-state-in-effect.
  const [lastSeen, setLastSeen] = React.useState(value);
  if (value !== lastSeen && !dirty) {
    setLastSeen(value);
    setDraft(value);
  }

  // Commit once the user stops adjusting.
  React.useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      onCommitRef.current(draft);
      setDirty(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, dirty]);

  function adjust(delta: number) {
    setDraft((current) => Math.max(0, current + delta));
    setDirty(true);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="outline"
        className="press shrink-0"
        aria-label="Decrease stock"
        disabled={draft <= 0}
        onClick={() => adjust(-1)}
      >
        <Minus className="size-3.5" />
      </Button>

      <label className="sr-only" htmlFor={`stock-${unit}-${value}`}>
        Stock count
      </label>
      <input
        id={`stock-${unit}-${value}`}
        type="number"
        inputMode="numeric"
        min={0}
        value={draft}
        onChange={(e) => {
          const next = Number(e.target.value);
          setDraft(Number.isFinite(next) && next >= 0 ? next : 0);
          setDirty(true);
        }}
        className={cn(
          "h-8 w-14 rounded-md border border-input bg-background px-1.5 text-center text-sm tabular-nums focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          dirty && "border-primary",
        )}
      />

      <Button
        size="icon-sm"
        variant="outline"
        className="press shrink-0"
        aria-label="Increase stock"
        onClick={() => adjust(1)}
      >
        <Plus className="size-3.5" />
      </Button>

      {pending ? (
        <Loader2
          className="size-3.5 shrink-0 animate-spin text-muted-foreground"
          aria-label="Saving"
        />
      ) : null}
    </div>
  );
}
