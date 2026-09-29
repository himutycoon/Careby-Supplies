"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ImageOff, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/shared/toast";
import {
  getCuratedCounts,
  getCuratedProductIds,
  itemSlot,
  setCuratedProducts,
  stageSlot,
} from "@/services/curated-products";
import { getProducts, getProductsByIds } from "@/services/products";
import { PROJECT_SCOPES, stagesFor } from "@/data/project-scopes";
import { SELECTION_ITEMS } from "@/data/packages/selection-items";
import type { Product } from "@/lib/types";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Pick which products show against a stage.
 *
 * "If I want to show tiles for the washroom I can select manually from
 * admin all the tiles that will display." A stage currently offers a
 * whole aisle — four hundred tiles for "Tile" — and the point of the
 * checklist is to narrow that to what this shop actually recommends.
 *
 * Anything left uncurated keeps falling back to the category filtering
 * that runs today, so this is worth doing one aisle at a time rather
 * than being a 140-stage chore before any of it helps.
 */

type Source = "checklist" | "package";

interface Slot {
  slot: string;
  label: string;
  hint: string;
}

function checklistSlots(projectId: string): Slot[] {
  const project = PROJECT_SCOPES.find((p) => p.id === projectId);
  if (!project) return [];
  return stagesFor(project).map((stage) => ({
    slot: stageSlot(project.id, stage.id),
    label: stage.label,
    hint: stage.categories.join(", "),
  }));
}

function packageSlots(): Slot[] {
  return SELECTION_ITEMS.map((item) => ({
    slot: itemSlot(item.id),
    label: `${item.room} — ${item.label}`,
    hint: item.categoryId,
  }));
}

function Thumb({ src }: { src: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  );
}

export function CurationTable() {
  const { toast } = useToast();

  const [source, setSource] = React.useState<Source>("checklist");
  const [projectId, setProjectId] = React.useState(PROJECT_SCOPES[0]?.id ?? "");
  const [slot, setSlot] = React.useState("");
  const [counts, setCounts] = React.useState<Record<string, number>>({});

  const [chosen, setChosen] = React.useState<Product[]>([]);
  const [loadingSlot, setLoadingSlot] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<Product[]>([]);
  const [searching, setSearching] = React.useState(false);

  const slots = React.useMemo(
    () => (source === "checklist" ? checklistSlots(projectId) : packageSlots()),
    [source, projectId],
  );

  // How many stages already have a list, so progress is visible.
  React.useEffect(() => {
    let cancelled = false;
    getCuratedCounts(slots.map((s) => s.slot)).then((data) => {
      if (!cancelled) setCounts(data);
    });
    return () => {
      cancelled = true;
    };
  }, [slots]);

  React.useEffect(() => {
    // The empty case is handled where the slot is cleared, not here: a
    // setState in the effect body paints the previous stage's list and
    // then immediately blanks it.
    if (!slot) return;
    let cancelled = false;
    // Loading is switched on where the stage is chosen, and off in the
    // callback below. Setting it here would be a second render before
    // the fetch has even started.
    getCuratedProductIds(slot)
      .then(async (ids) => {
        if (ids.length === 0) return [] as Product[];
        const products = await getProductsByIds(ids);
        const byId = new Map(products.map((p) => [p.id, p]));
        return ids
          .map((id) => byId.get(id))
          .filter((p): p is Product => Boolean(p));
      })
      .then((products) => {
        if (cancelled) return;
        setChosen(products);
        setLoadingSlot(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  async function runSearch() {
    if (!search.trim()) return;
    setSearching(true);
    const page = await getProducts({ search: search.trim(), pageSize: 24 });
    setResults(page.items);
    setSearching(false);
  }

  function add(product: Product) {
    setChosen((current) =>
      current.some((p) => p.id === product.id) ? current : [...current, product],
    );
  }

  function move(index: number, by: number) {
    setChosen((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    if (!slot) return;
    setSaving(true);
    const result = await setCuratedProducts(
      slot,
      chosen.map((p) => p.id),
    );
    setSaving(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(
      result.data === 0
        ? "List cleared — this stage falls back to its categories"
        : `${result.data} products saved for this stage`,
    );
    setCounts((current) => ({ ...current, [slot]: result.data }));
  }

  const activeSlot = slots.find((s) => s.slot === slot);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Where</span>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as Source);
              setSlot("");
              setChosen([]);
            }}
            className="h-10 min-w-48 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="checklist">Renovation material list</option>
            <option value="package">Contractor package</option>
          </select>
        </label>

        {source === "checklist" ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Project</span>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setSlot("");
              }}
              className="h-10 min-w-48 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {PROJECT_SCOPES.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">
            Stage {slots.length > 0 ? `(${slots.length})` : ""}
          </span>
          <select
            value={slot}
            onChange={(e) => {
              setSlot(e.target.value);
              setChosen([]);
              setLoadingSlot(Boolean(e.target.value));
            }}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">Choose a stage…</option>
            {slots.map((s) => (
              <option key={s.slot} value={s.slot}>
                {s.label}
                {counts[s.slot] ? ` — ${counts[s.slot]} picked` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!slot ? (
        <EmptyState
          icon="Boxes"
          title="Choose a stage"
          description="Pick a stage to say which products a customer sees for it. Anything left alone keeps showing its whole category, which is what happens today."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Label>
                Showing for &ldquo;{activeSlot?.label}&rdquo;
                <span className="block text-xs font-normal text-muted-foreground">
                  {chosen.length === 0
                    ? `Nothing picked — falls back to ${activeSlot?.hint}`
                    : "In this order, and nothing else."}
                </span>
              </Label>
              <Button size="sm" onClick={save} disabled={saving || loadingSlot}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>

            {loadingSlot ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : chosen.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Search on the right and add what belongs here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {chosen.map((product, index) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2"
                  >
                    <span className="w-5 text-center text-xs text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <Thumb src={product.imageUrl ?? ""} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {product.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatCad(product.priceCad)}
                      </span>
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move down"
                      disabled={index === chosen.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Remove ${product.name}`}
                      onClick={() =>
                        setChosen((current) =>
                          current.filter((p) => p.id !== product.id),
                        )
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <Label htmlFor="curation-search">Find products to add</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="curation-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  placeholder="Name, brand or SKU…"
                  className="pl-9 md:pl-9"
                />
              </div>
              <Button variant="outline" onClick={runSearch} disabled={searching}>
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>

            <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
              {results.map((product) => {
                const already = chosen.some((p) => p.id === product.id);
                return (
                  <li
                    key={product.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border border-border p-2",
                      already ? "bg-muted/60" : "bg-card",
                    )}
                  >
                    <Thumb src={product.imageUrl ?? ""} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {product.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatCad(product.priceCad)}
                      </span>
                    </span>
                    <Button
                      size="icon-sm"
                      variant={already ? "ghost" : "outline"}
                      aria-label={`Add ${product.name}`}
                      disabled={already}
                      onClick={() => add(product)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
