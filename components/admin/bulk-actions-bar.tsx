"use client";

import * as React from "react";
import {
  CircleCheck,
  CircleSlash,
  Eye,
  EyeOff,
  Loader2,
  Percent,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast";
import {
  bulkAdjustPrices,
  bulkDeleteProducts,
  bulkSetActive,
  bulkSetCategory,
  bulkSetStock,
  bulkSetStockStatus,
  type AdminCategoryRow,
  type BulkResult,
} from "@/services/admin";
import type { ServiceResult } from "@/services/client";

/**
 * Everything you can do to a selection of products at once.
 *
 * A 3,405-product catalogue is not maintained a row at a time. Putting a
 * supplier's range back in stock, moving a mis-filed aisle or repricing
 * after a cost change are each one decision, and the screen should let
 * them be one action.
 *
 * Destructive and wide-reaching actions confirm first; the rest apply
 * immediately, because an undo-less confirmation on "mark in stock"
 * trains people to click through confirmations that matter.
 */
export function BulkActionsBar({
  ids,
  categories,
  onDone,
  onClear,
}: {
  ids: string[];
  categories: AdminCategoryRow[];
  onDone: () => void;
  onClear: () => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [percent, setPercent] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [confirmReprice, setConfirmReprice] = React.useState(false);

  const count = ids.length;

  async function run(
    label: string,
    action: () => Promise<ServiceResult<BulkResult>>,
    describe: (result: BulkResult) => string,
  ) {
    setBusy(label);
    const result = await action();
    setBusy("");

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(describe(result.data), "success");
    onDone();
  }

  const plural = count === 1 ? "product" : "products";

  return (
    <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-primary/30 bg-card p-3 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {count} {plural} selected
        </p>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="size-4" /> Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(busy)}
          onClick={() =>
            run("in-stock", () => bulkSetStockStatus(ids, "in-stock"), (r) =>
              `${r.changed} ${plural} marked in stock`)
          }
        >
          {busy === "in-stock" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CircleCheck className="size-4" />
          )}
          Mark in stock
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(busy)}
          onClick={() =>
            run("out-of-stock", () => bulkSetStockStatus(ids, "out-of-stock"), (r) =>
              `${r.changed} ${plural} marked out of stock`)
          }
        >
          <CircleSlash className="size-4" /> Mark out of stock
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(busy)}
          onClick={() =>
            run("activate", () => bulkSetActive(ids, true), (r) =>
              `${r.changed} ${plural} activated`)
          }
        >
          <Eye className="size-4" /> Activate
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(busy)}
          onClick={() =>
            run("deactivate", () => bulkSetActive(ids, false), (r) =>
              `${r.changed} ${plural} deactivated`)
          }
        >
          <EyeOff className="size-4" /> Deactivate
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          disabled={Boolean(busy)}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">Set count</span>
          <Input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-9 w-24"
            aria-label="Stock count to apply"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={Boolean(busy) || quantity === ""}
            onClick={() =>
              run("stock", () => bulkSetStock(ids, Number(quantity)), (r) => {
                setQuantity("");
                return `${r.changed} ${plural} set to ${Number(quantity)}`;
              })
            }
          >
            Apply
          </Button>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">Move to</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category to move to"
            className="h-9 min-w-36 rounded-lg border border-input bg-background px-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">Choose category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="secondary"
            disabled={Boolean(busy) || !category}
            onClick={() =>
              run("category", () => bulkSetCategory(ids, category), (r) => {
                const name = categories.find((c) => c.id === category)?.name ?? category;
                setCategory("");
                return `${r.changed} ${plural} moved to ${name}`;
              })
            }
          >
            Move
          </Button>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <Percent className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground whitespace-nowrap">Price change</span>
          <Input
            type="number"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="-10"
            className="h-9 w-20"
            aria-label="Percentage price change"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={Boolean(busy) || percent === "" || Number(percent) === 0}
            onClick={() => setConfirmReprice(true)}
          >
            Apply
          </Button>
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        Marking stock without a count leaves these products uncounted —
        they stay as set until you change them. Setting a count puts them
        back under counted stock.
      </p>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${count} ${plural}?`}
        description="This cannot be undone. Anything on an order or in a package is kept and reported instead — deleting it would rewrite somebody's order history."
        confirmLabel="Delete"
        pending={busy === "delete"}
        onConfirm={() =>
          run("delete", () => bulkDeleteProducts(ids), (r) => {
            setConfirmDelete(false);
            return r.skipped.length
              ? `Deleted ${r.changed}. Kept ${r.skipped.length} still in use.`
              : `Deleted ${r.changed} ${plural}`;
          })
        }
      />

      <ConfirmDialog
        open={confirmReprice}
        onOpenChange={setConfirmReprice}
        title={`Change ${count} ${plural} by ${percent}%?`}
        description="Both the retail and the trade price move. There is no undo, so check the figure before applying it."
        confirmLabel="Reprice"
        pending={busy === "price"}
        onConfirm={() =>
          run("price", () => bulkAdjustPrices(ids, Number(percent)), (r) => {
            setConfirmReprice(false);
            setPercent("");
            return `${r.changed} ${plural} repriced`;
          })
        }
      />
    </div>
  );
}
