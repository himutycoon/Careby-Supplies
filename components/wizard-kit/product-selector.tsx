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
import type { Product } from "@/lib/types";

/**
 * Materials step used by every project flow. Pulls suggestions through
 * the service layer so the list can become a real API call later.
 */
const PAGE_SIZE = 9;

export function ProductSelector({
  categoryId,
  categoryIds,
  slot,
  tag,
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
          }
          return;
        }

        // Tagged products, if any carry this tag.
        if (tag) {
          const tagged = await getProducts({
            tag,
            pageSize: PAGE_SIZE,
            page,
            useContractorPrice: showContractorPrice,
          });
          if (tagged.items.length > 0) {
            if (!cancelled) {
              setProducts(tagged.items);
              setTotal(tagged.total);
            }
            return;
          }
        }

        const result = await getProducts({
          categoryId: categoryId ?? null,
          categoryIds: categoryKey ? categoryKey.split(",") : null,
          pageSize: PAGE_SIZE,
          page,
          useContractorPrice: showContractorPrice,
        });
        if (!cancelled) {
          setProducts(result.items);
          setTotal(result.total);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId, categoryKey, slot, tag, page, showContractorPrice]);

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
    const browse = categoryId ?? (categoryIds ?? [])[0] ?? null;
    return (
      <EmptyState
        icon="Boxes"
        title="No matching materials"
        description={emptyMessage}
        action={
          browse ? (
            <Button
              variant="outline"
              render={
                <Link href={`/products?category=${encodeURIComponent(browse)}`}>
                  Browse the whole aisle
                </Link>
              }
            />
          ) : undefined
        }
      />
    );
  }

  // The aisle these came from, for the "see everything" way out. With
  // several, the first is the one the stage leads with.
  const browseCategory = categoryId ?? (categoryIds ?? [])[0] ?? null;
  const hasMore = products.length < total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground tabular-nums">
          {total > products.length
            ? `Showing ${products.length} of ${total}`
            : `${total} ${total === 1 ? "product" : "products"}`}
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
            {isPending ? "Loading…" : `Show more (${total - products.length} left)`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
