"use client";

import * as React from "react";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartControl } from "@/components/shop/add-to-cart-control";
import { ProductCardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getProducts } from "@/services/products";
import type { Product } from "@/lib/types";

/**
 * Materials step used by every project flow. Pulls suggestions through
 * the service layer so the list can become a real API call later.
 */
export function ProductSelector({
  categoryId,
  categoryIds,
  showContractorPrice = false,
  emptyMessage = "We don't stock materials for this option online yet.",
}: {
  categoryId?: string | null;
  /** Several aisles at once — a kitchen job spans more than one. */
  categoryIds?: string[] | null;
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
  }, [categoryId, categoryKey, showContractorPrice]);

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
