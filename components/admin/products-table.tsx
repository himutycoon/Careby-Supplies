"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FileUp, ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { ProductImportDialog } from "@/components/admin/product-import-dialog";
import { StockControl } from "@/components/admin/stock-control";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAsyncData } from "@/lib/store/hooks";
import {
  deleteProduct,
  getAllCategoriesForAdmin,
  getAllProductsForAdmin,
  setProductActive,
  setProductStock,
  type AdminProductRow,
} from "@/services/admin";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";

type StockFilter =
  | "all"
  | "in-stock"
  | "low-stock"
  | "out-of-stock"
  | "inactive";

type SortKey =
  | "name"
  | "name-desc"
  | "stock-asc"
  | "stock-desc"
  | "price-asc"
  | "price-desc";

const SORTS: [SortKey, string][] = [
  ["name", "Name A–Z"],
  ["name-desc", "Name Z–A"],
  ["stock-asc", "Stock: lowest first"],
  ["stock-desc", "Stock: highest first"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
];

/*
 * The catalogue is 3,449 products. Painting every row locks the tab for
 * seconds on a mid-range laptop and does nobody any good, since nothing
 * past the first screenful is being read. Filters and counts still run
 * over the whole set -- only the rendering is capped.
 */
const PAGE = 100;

const STOCK_TONE: Record<string, string> = {
  "in-stock": "bg-success/12 text-success",
  "low-stock": "bg-warning/15 text-warning-foreground",
  "out-of-stock": "bg-destructive/10 text-destructive",
};

function Thumb({ src, name }: { src: string; name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <ImageOff
          className="size-4 text-muted-foreground"
          aria-label={`No photo for ${name}`}
        />
      )}
    </span>
  );
}

export function ProductsTable() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { data, loading, error, reload } = useAsyncData(
    getAllProductsForAdmin,
  );
  const { data: categoryData } = useAsyncData(getAllCategoriesForAdmin);
  const categories = React.useMemo(() => categoryData ?? [], [categoryData]);

  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [stockPendingId, setStockPendingId] = React.useState<string | null>(
    null,
  );
  const [search, setSearch] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);
  // The dashboard links straight to a filtered view, e.g. ?stock=low-stock.
  const initialFilter = (searchParams.get("stock") ?? "all") as StockFilter;
  const [filter, setFilter] = React.useState<StockFilter>(initialFilter);
  const [category, setCategory] = React.useState(
    searchParams.get("category") ?? "all",
  );
  const [sort, setSort] = React.useState<SortKey>("name");
  const [shown, setShown] = React.useState(PAGE);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminProductRow | null>(null);
  const [deleting, setDeleting] = React.useState<AdminProductRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteProduct(deleting.id);
    setDeletePending(false);

    if (result.ok) {
      toast("Product deleted");
      setDeleting(null);
      reload();
    } else {
      // The guard explains why (on an order, in a package) — keep the
      // dialog open so the reason is read, not dismissed.
      toast(result.error, "error");
      setDeleting(null);
    }
  }

  const categoryNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const all = React.useMemo(() => data ?? [], [data]);

  // Counts respect the category, so switching aisle re-labels the chips
  // instead of promising 3,000 products behind a filter that holds 40.
  const inCategory = React.useMemo(
    () => (category === "all" ? all : all.filter((p) => p.categoryId === category)),
    [all, category],
  );

  const counts = React.useMemo(
    () => ({
      all: inCategory.filter((p) => p.isActive).length,
      "in-stock": inCategory.filter(
        (p) => p.isActive && p.stockStatus === "in-stock",
      ).length,
      "low-stock": inCategory.filter(
        (p) => p.isActive && p.stockStatus === "low-stock",
      ).length,
      "out-of-stock": inCategory.filter(
        (p) => p.isActive && p.stockStatus === "out-of-stock",
      ).length,
      inactive: inCategory.filter((p) => !p.isActive).length,
    }),
    [inCategory],
  );

  // Only the aisles that hold something, with their live count.
  const categoryOptions = React.useMemo(() => {
    const tally = new Map<string, number>();
    for (const product of all) {
      tally.set(product.categoryId, (tally.get(product.categoryId) ?? 0) + 1);
    }
    return [...tally.entries()]
      .map(([id, count]) => ({
        id,
        name: categoryNames.get(id) ?? id ?? "Uncategorised",
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all, categoryNames]);

  const products = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = inCategory.filter((product) => {
      // "inactive" is its own view; every other filter shows live products.
      if (filter === "inactive") {
        if (product.isActive) return false;
      } else {
        if (!product.isActive) return false;
        if (filter !== "all" && product.stockStatus !== filter) return false;
      }
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.id.toLowerCase().includes(term)
      );
    });

    const by: Record<SortKey, (a: AdminProductRow, b: AdminProductRow) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      "name-desc": (a, b) => b.name.localeCompare(a.name),
      "stock-asc": (a, b) => a.stockQuantity - b.stockQuantity,
      "stock-desc": (a, b) => b.stockQuantity - a.stockQuantity,
      "price-asc": (a, b) => a.homeownerPrice - b.homeownerPrice,
      "price-desc": (a, b) => b.homeownerPrice - a.homeownerPrice,
    };
    // Ties fall back to the name, so re-sorting never shuffles equals.
    return [...matched].sort(
      (a, b) => by[sort](a, b) || a.name.localeCompare(b.name),
    );
  }, [inCategory, search, filter, sort]);

  /*
   * A narrower view starts at the top, not 400 rows into the old one.
   *
   * Adjusted during render rather than in an effect: an effect would
   * paint the stale row count first and then immediately replace it,
   * which is the cascading render React warns about.
   */
  const view = `${search}|${filter}|${category}|${sort}`;
  const [lastView, setLastView] = React.useState(view);
  if (view !== lastView) {
    setLastView(view);
    setShown(PAGE);
  }

  const visible = React.useMemo(() => products.slice(0, shown), [products, shown]);

  async function toggleActive(id: string, next: boolean) {
    setPendingId(id);
    const result = await setProductActive(id, next);
    setPendingId(null);

    if (result.ok) {
      toast(next ? "Product activated" : "Product deactivated");
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  async function commitStock(id: string, quantity: number) {
    setStockPendingId(id);
    const result = await setProductStock(id, quantity);
    setStockPendingId(null);

    if (result.ok) {
      // Reload so the derived stock status badge reflects the new count.
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: AdminProductRow) {
    setEditing(product);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load products"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

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
            placeholder="Search products…"
            aria-label="Search products"
            className="pl-9 md:pl-9"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="press w-full sm:w-auto"
            onClick={() => setImportOpen(true)}
          >
            <FileUp className="size-4" /> Import CSV
          </Button>
          <Button className="press w-full sm:w-auto" onClick={openNew}>
            <Plus className="size-4" /> New product
          </Button>
        </div>
      </div>

      {/* Scrollable chip row: on a phone four filters won't fit, and
          wrapping them pushed the list below the fold. */}
      <div className="scroll-row gap-2 pb-1">
        {(
          [
            ["all", "All"],
            ["in-stock", "In stock"],
            ["low-stock", "Running low"],
            ["out-of-stock", "Out of stock"],
            ["inactive", "Deactivated"],
          ] as [StockFilter, string][]
        ).map(([value, label]) => {
          const active = filter === value;
          const count = counts[value];
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={active}
              className={cn(
                "press flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
                count === 0 && !active && "opacity-60",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="h-10 min-w-40 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-8"
            >
              <option value="all">All categories ({all.length})</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.count})
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort products"
              className="h-10 min-w-40 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-8"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-sm text-muted-foreground tabular-nums">
          {products.length === all.length
            ? `${products.length} products`
            : `${products.length} of ${all.length} products`}
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="Boxes"
          title={
            search || category !== "all" || filter !== "all"
              ? "Nothing matches"
              : "No products yet"
          }
          description={
            search || category !== "all" || filter !== "all"
              ? "Widen the category, the stock filter, or the search term."
              : "Add your first product to start selling."
          }
          action={
            search || category !== "all" || filter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={openNew}>New product</Button>
            )
          }
        />
      ) : (
        <>
          {/* Phones get stacked cards — a 7-column table is unreadable
              below ~700px even with horizontal scrolling. */}
          {/* Phones: name + stock on top, controls beneath. Stock is the
              thing being maintained, so it gets the prominent position
              rather than being one field inside an edit form. */}
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background lg:hidden">
            {visible.map((product) => (
              <li key={product.id} className="flex flex-col gap-2 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Thumb src={product.imageUrl} name={product.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {product.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatCad(product.homeownerPrice)} ·{" "}
                      {formatCad(product.contractorPrice)} trade
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap capitalize",
                      product.isActive
                        ? STOCK_TONE[product.stockStatus]
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {product.isActive
                      ? product.stockStatus.replace("-", " ")
                      : "Deactivated"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <StockControl
                    value={product.stockQuantity}
                    unit={product.unit}
                    pending={stockPendingId === product.id}
                    onCommit={(next) => commitStock(product.id, next)}
                  />

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="press"
                      aria-label={`Edit ${product.name}`}
                      onClick={() => openEdit(product)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant={product.isActive ? "outline" : "default"}
                      className="press"
                      disabled={pendingId === product.id}
                      onClick={() => toggleActive(product.id, !product.isActive)}
                    >
                      {product.isActive ? "Off" : "On"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      className="press"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => setDeleting(product)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-border bg-background lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-right">Trade</TableHead>
                  <TableHead>In stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2.5">
                        <Thumb src={product.imageUrl} name={product.name} />
                        {product.name}
                        {!product.isActive ? (
                          <Badge variant="destructive">Off</Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.brand || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {categoryNames.get(product.categoryId) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCad(product.homeownerPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCad(product.contractorPrice)}
                    </TableCell>
                    <TableCell>
                      <StockControl
                        value={product.stockQuantity}
                        unit={product.unit}
                        pending={stockPendingId === product.id}
                        onCommit={(next) => commitStock(product.id, next)}
                      />
                    </TableCell>
                    <TableCell>
                      {/* Derived from the count by a database trigger —
                          never set by hand, so it can't contradict it. */}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap capitalize",
                          STOCK_TONE[product.stockStatus] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {product.stockStatus.replace("-", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={product.isActive ? "outline" : "default"}
                          disabled={pendingId === product.id}
                          onClick={() =>
                            toggleActive(product.id, !product.isActive)
                          }
                        >
                          {product.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => setDeleting(product)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Deactivated products stop appearing in the catalog and can no
              longer be ordered — the database rejects them at order time.
            </p>
          </div>

          {products.length > visible.length ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="press"
                onClick={() => setShown((n) => n + PAGE)}
              >
                Show more
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Showing {visible.length} of {products.length}
              </span>
            </div>
          ) : null}
        </>
      )}

      <ProductImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        categories={categories}
        existingIds={(data ?? []).map((product) => product.id)}
        onImported={reload}
      />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        onSaved={reload}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "product"}?`}
        description="This permanently removes the product from the catalog. Products that appear on an order can't be deleted — deactivate those instead."
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
