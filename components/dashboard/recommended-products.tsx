"use client";

import { ProductCard } from "@/components/shop/product-card";
import { ProductCardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useAsyncData } from "@/lib/store/hooks";
import { getProducts } from "@/services/products";

export function RecommendedProducts({ count = 3 }: { count?: number }) {
  const { data, loading } = useAsyncData(() =>
    getProducts({ pageSize: count }),
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const products = data?.items ?? [];

  if (products.length === 0) {
    return (
      <EmptyState
        icon="Boxes"
        title="Catalog is empty"
        description="Products will appear here once the catalog is populated."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
