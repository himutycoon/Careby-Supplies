"use client";

import * as React from "react";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import {
  clearAllowance,
  getAllowanceOverrides,
  setAllowance,
} from "@/services/allowances";
import {
  SELECTION_ITEMS,
  TIER_LABELS,
  TIER_MULTIPLIER,
  type BudgetTier,
} from "@/data/packages/selection-items";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * What a contractor's package budgets for each item.
 *
 * This is the number the customer portal measures their choice against:
 * pick a tile above the allowance and they are shown an upgrade, below
 * it a credit. It used to live in a TypeScript file with a note calling
 * the figures placeholders to review before quoting real customers, and
 * changing one meant a deploy.
 *
 * Edits apply to the NEXT package. An existing one snapshots its
 * allowances when it is created, because they are a promise already made
 * to a named customer.
 */
export function AllowancesTable() {
  const { toast } = useToast();
  const { data, reload } = useAsyncData(getAllowanceOverrides);
  const overrides = React.useMemo(() => data ?? {}, [data]);

  const [search, setSearch] = React.useState("");
  const [tier, setTier] = React.useState<BudgetTier>("medium");
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState("");

  const rows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return SELECTION_ITEMS.filter(
      (item) =>
        !term ||
        item.label.toLowerCase().includes(term) ||
        item.room.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term),
    );
  }, [search]);

  function baseFor(itemId: string, fallback: number): number {
    return overrides[itemId] ?? fallback;
  }

  async function save(itemId: string, fallback: number) {
    const raw = drafts[itemId];
    const value = Number(raw);
    if (raw === undefined || !Number.isFinite(value) || value < 0) {
      toast("Enter an amount of zero or more.", "error");
      return;
    }
    setSavingId(itemId);
    const result = await setAllowance(itemId, value);
    setSavingId("");

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(
      value === fallback
        ? "Saved — same as the built-in figure"
        : `Saved: ${formatCad(value)} at Medium`,
    );
    setDrafts((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    reload();
  }

  async function reset(itemId: string) {
    setSavingId(itemId);
    const result = await clearAllowance(itemId);
    setSavingId("");
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Back to the built-in figure");
    setDrafts((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    reload();
  }

  const overrideCount = Object.keys(overrides).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or rooms…"
            aria-label="Search allowances"
            className="pl-9 md:pl-9"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">
            Preview at
          </span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as BudgetTier)}
            aria-label="Tier to preview"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-8"
          >
            {(Object.keys(TIER_LABELS) as BudgetTier[]).map((key) => (
              <option key={key} value={key}>
                {TIER_LABELS[key]} (×{TIER_MULTIPLIER[key]})
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-muted-foreground">
        You set the <strong>Medium</strong> figure; Basic and Luxury are
        worked out from it. {overrideCount === 0
          ? "Nothing has been changed yet, so every item is using its built-in figure."
          : `${overrideCount} ${overrideCount === 1 ? "item has" : "items have"} been changed.`}{" "}
        Changes apply to the next package — one already sent keeps what it
        was quoted.
      </p>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
        {rows.map((item) => {
          const base = baseFor(item.id, item.allowanceCad);
          const edited = overrides[item.id] !== undefined;
          const draft = drafts[item.id];
          const shown = draft === undefined ? String(base) : draft;
          const preview = Math.round(Number(shown || 0) * TIER_MULTIPLIER[tier]);

          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.room} · {item.categoryId}
                  {edited ? (
                    <span className="ml-1.5 text-primary">· changed</span>
                  ) : null}
                </span>
              </span>

              <label className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={shown}
                  aria-label={`Medium allowance for ${item.label}`}
                  onChange={(e) =>
                    setDrafts((current) => ({
                      ...current,
                      [item.id]: e.target.value,
                    }))
                  }
                  className="h-9 w-28 tabular-nums"
                />
              </label>

              <span
                className={cn(
                  "w-28 text-right text-xs tabular-nums",
                  tier === "medium"
                    ? "text-muted-foreground"
                    : "font-medium text-foreground",
                )}
              >
                {TIER_LABELS[tier]} {formatCad(preview)}
              </span>

              <span className="flex gap-1.5">
                <Button
                  size="sm"
                  disabled={draft === undefined || savingId === item.id}
                  onClick={() => save(item.id, item.allowanceCad)}
                >
                  Save
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Reset ${item.label} to the built-in figure`}
                  disabled={!edited || savingId === item.id}
                  onClick={() => reset(item.id)}
                  title={`Built in: ${formatCad(item.allowanceCad)}`}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
