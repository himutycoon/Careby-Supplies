"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartControl } from "@/components/shop/add-to-cart-control";
import { ProductCardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getProducts, getProductsByIds } from "@/services/products";
import { getCuratedProductIds } from "@/services/curated-products";
import { canRank, rankByFit } from "@/lib/rules/product-fit";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import type { ProductSort } from "@/services/products";

/**
 * Materials step used by every project flow. Pulls suggestions through
 * the service layer so the list can become a real API call later.
 */
const PAGE_SIZE = 9;

/**
 * How many matches to rank before showing a page of them.
 *
 * The database can order by price or by date; it cannot order by "is
 * this actually a faucet", so that happens here and it needs to see
 * more rows than it shows. 200 covers every stage in the checklist —
 * the widest, Fasteners, matches 194 — and past that the aisle link is
 * the honest way through.
 */
const RANK_WINDOW = 200;

/**
 * Budget, in the only terms this screen can honestly offer.
 *
 * There is no project budget on a material checklist — nobody asked for
 * one and inventing a figure to filter against would be a guess. What
 * someone does know at the moment of buying is roughly what they want
 * to spend per item, so the bands are absolute and few. "Any" first,
 * because most people want to see the range before narrowing it.
 *
 * These bands filter rather than rank, because the customer picked
 * them: a price filter that still showed the expensive things would be
 * broken. The count above the grid always says what the filter did.
 */
const BUDGET_BANDS: { id: string; label: string; min?: number; max?: number }[] =
  [
    { id: "any", label: "Any price" },
    { id: "value", label: "Under $25", max: 25 },
    { id: "mid", label: "$25 – $100", min: 25, max: 100 },
    { id: "upper", label: "$100 – $500", min: 100, max: 500 },
    { id: "premium", label: "$500+", min: 500 },
  ];

const SORTS: { id: ProductSort; label: string }[] = [
  { id: "popular", label: "Best match" },
  { id: "price-asc", label: "Price: low first" },
  { id: "price-desc", label: "Price: high first" },
];

export function ProductSelector({
  categoryId,
  categoryIds,
  slot,
  tag,
  tags,
  keywords,
  showContractorPrice = false,
  emptyMessage = "We don't stock materials for this option online yet.",
}: {
  categoryId?: string | null;
  /** Several aisles at once — a kitchen job spans more than one. */
  categoryIds?: string[] | null;
  /**
   * What job this is for, e.g. "tile".
   *
   * The middle of three answers. A hand-picked list wins; failing that,
   * products marked as answering this job; failing that, the aisles.
   * Each rung is cheaper to maintain than the one above it, and an
   * untagged catalogue behaves exactly as it did before.
   */
  tag?: string;
  /**
   * Several tags, any one of which answers this step.
   *
   * A stage is rarely one word: waterproofing is bought out of
   * membranes, sealants and flashing. Takes precedence over `tag`.
   */
  tags?: string[];
  /**
   * Words that describe the thing itself, for ordering.
   *
   * Tags decide what is eligible and these decide what leads. Without
   * them every tagged product scores the same and the list falls back
   * to alphabetical, which in a catalogue named by size means it opens
   * on a 1/2" fitting.
   */
  keywords?: string[];
  /**
   * A curated list to prefer over the aisles.
   *
   * Where an admin has hand-picked products for this stage, those are
   * what a customer should see — "tile" across a whole aisle is 400
   * products, and the point of the checklist is to narrow it. An empty
   * or uncurated slot falls through to the categories, so this can be
   * filled in one stage at a time.
   */
  slot?: string;
  showContractorPrice?: boolean;
  emptyMessage?: string;
}) {
  // Joined so the effect below compares by value, not by array identity —
  // a fresh array literal on every render would refetch forever.
  const categoryKey = (categoryIds ?? []).join(",");
  const tagKey = (tags && tags.length > 0 ? tags : tag ? [tag] : []).join("|");
  const keywordKey = (keywords ?? []).join("|");

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  /*
   * Nine products and no way past them. A stage would show four or nine
   * suggestions and end there -- no more, no similar, no way into the
   * aisle they came from -- so a customer who did not like those nine
   * concluded we did not stock it.
   *
   * `total` is how many match at all, `page` how many pages have been
   * asked for. A curated list has no more behind it by definition, so
   * it reports its own length and hides the button.
   */
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [band, setBand] = React.useState("any");
  const [sort, setSort] = React.useState<ProductSort>("popular");
  /*
   * True when a hand-picked list is on screen. The price and order
   * controls are hidden then: an admin chose these five, in this order,
   * and re-sorting them by price would quietly discard that.
   */
  const [curated, setCurated] = React.useState(false);

  const budget = BUDGET_BANDS.find((b) => b.id === band) ?? BUDGET_BANDS[0];

  React.useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      try {
        const curatedIds = slot ? await getCuratedProductIds(slot) : [];

        if (curatedIds.length > 0) {
          const picked = await getProductsByIds(curatedIds);
          // getProductsByIds does not promise an order, and the admin's
          // order is the point of curating.
          const byId = new Map(picked.map((p) => [p.id, p]));
          const ordered = curatedIds
            .map((id) => byId.get(id))
            .filter((p): p is Product => Boolean(p));
          if (!cancelled) {
            setProducts(ordered);
            setTotal(ordered.length);
            setCurated(true);
          }
          return;
        }
        if (!cancelled) setCurated(false);

        const wanted = tagKey ? tagKey.split("|") : [];
        const need = {
          tags: wanted,
          keywords: keywordKey ? keywordKey.split("|") : [],
        };

        /*
         * "Best match" is ours to decide, so it asks for a window and
         * orders it here. An explicit price sort is the customer asking
         * for a specific order and the database does it properly, over
         * the whole result rather than a window of it.
         *
         * With nothing to rank on — the contractor's broad "suggested
         * materials" step passes neither tags nor words — there is
         * nothing to win by fetching 200 rows to show nine.
         */
        const ranking = sort === "popular" && canRank(need);
        const shown = page * PAGE_SIZE;

        const shared = {
          pageSize: ranking ? RANK_WINDOW : PAGE_SIZE,
          page: ranking ? 1 : page,
          sort,
          minPrice: budget.min,
          maxPrice: budget.max,
          useContractorPrice: showContractorPrice,
        };

        const present = (items: Product[], total: number) => {
          if (cancelled) return;
          setProducts(ranking ? rankByFit(items, need, shown) : items);
          setTotal(total);
        };

        // Tagged products, if any carry these tags.
        if (wanted.length > 0) {
          const tagged = await getProducts({ tags: wanted, ...shared });
          if (tagged.items.length > 0) {
            present(tagged.items, tagged.total);
            return;
          }
          /*
           * Nothing tagged AND nothing in this price band is ambiguous:
           * it could be an untagged stage, or a band with nothing in
           * it. Ask once without the band to tell them apart, so a
           * narrow budget does not silently demote the stage to its
           * whole aisle.
           */
          if (budget.min !== undefined || budget.max !== undefined) {
            const unbanded = await getProducts({
              tags: wanted,
              pageSize: 1,
              useContractorPrice: showContractorPrice,
            });
            if (unbanded.total > 0) {
              if (!cancelled) {
                setProducts([]);
                setTotal(0);
              }
              return;
            }
          }
        }

        const result = await getProducts({
          categoryId: categoryId ?? null,
          categoryIds: categoryKey ? categoryKey.split(",") : null,
          ...shared,
        });
        present(result.items, result.total);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    categoryId,
    categoryKey,
    slot,
    tagKey,
    keywordKey,
    page,
    sort,
    budget.min,
    budget.max,
    showContractorPrice,
  ]);

  // Changing the budget or the order starts the list again, or "show
  // more" would be asking for page 3 of a list that now has one page.
  function chooseBand(id: string) {
    setBand(id);
    setPage(1);
  }

  function chooseSort(next: ProductSort) {
    setSort(next);
    setPage(1);
  }

  const browseCategory = categoryId ?? (categoryIds ?? [])[0] ?? null;
  const controls =
    !curated && (products.length > 0 || band !== "any") ? (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="scroll-row gap-1.5">
          {BUDGET_BANDS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === band}
              onClick={() => chooseBand(option.id)}
              className={cn(
                "press min-h-8 rounded-full border px-3 text-xs font-medium whitespace-nowrap",
                option.id === band
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(event) => chooseSort(event.target.value as ProductSort)}
            className="min-h-8 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground"
          >
            {SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    ) : null;

  // Skeletons only while there is nothing to show. Once a page is on
  // screen, "Show more" must not blank it and replace it with grey
  // boxes -- the button says "Loading…" instead.
  if (!loaded && products.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    const narrowed = band !== "any";
    return (
      <div className="flex flex-col gap-4">
        {controls}
        <EmptyState
          icon="Boxes"
          title={narrowed ? "Nothing in that price range" : "No matching materials"}
          description={
            narrowed
              ? "We stock this, but not at that price. Try a wider range."
              : emptyMessage
          }
          action={
            narrowed ? (
              <Button variant="outline" onClick={() => chooseBand("any")}>
                Show any price
              </Button>
            ) : browseCategory ? (
              <Button
                variant="outline"
                render={
                  <Link
                    href={`/products?category=${encodeURIComponent(browseCategory)}`}
                  >
                    Browse the whole aisle
                  </Link>
                }
              />
            ) : undefined
          }
        />
      </div>
    );
  }

  // The ranked path can only reach as far as the window it ranked.
  const ranked = sort === "popular" && (tagKey !== "" || keywordKey !== "");
  const reachable = ranked ? Math.min(total, RANK_WINDOW) : total;
  const hasMore = products.length < reachable;

  return (
    <div className="flex flex-col gap-4">
      {controls}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground tabular-nums">
          {total > products.length
            ? `Showing ${products.length} of ${total}`
            : `${total} ${total === 1 ? "product" : "products"}`}
          {band !== "any" ? ` · ${budget.label.toLowerCase()}` : ""}
        </p>
        {browseCategory ? (
          <Link
            href={`/products?category=${encodeURIComponent(browseCategory)}`}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Browse the whole aisle →
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showContractorPrice={showContractorPrice}
          action={
            <AddToCartControl
              product={product}
              showProjectPicker={showContractorPrice}
            />
          }
        />
      ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setPage((n) => n + 1)}
          >
            {isPending
              ? "Loading…"
              : `Show more (${reachable - products.length} left)`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
