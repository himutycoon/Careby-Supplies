"use client";

import * as React from "react";
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
          if (!cancelled) setProducts(ordered);
          return;
        }

        // Tagged products, if any carry this tag.
        if (tag) {
          const tagged = await getProducts({
            tag,
            pageSize: 9,
            useContractorPrice: showContractorPrice,
          });
          if (tagged.items.length > 0) {
            if (!cancelled) setProducts(tagged.items);
            return;
          }
        }

        const page = await getProducts({
          categoryId: categoryId ?? null,
          categoryIds: categoryKey ? categoryKey.split(",") : null,
          pageSize: 9,
          useContractorPrice: showContractorPrice,
        });
        if (!cancelled) setProducts(page.items);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId, categoryKey, slot, tag, showContractorPrice]);

  if (!loaded || isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="Boxes"
        title="No matching materials"
        description={emptyMessage}
      />
    );
  }

  return (
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
  );
}
