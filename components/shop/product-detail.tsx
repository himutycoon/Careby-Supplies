"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shop/product-image";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelSkeleton, ProductCardSkeleton } from "@/components/shared/skeleton";
import { StockBadge } from "@/components/shop/stock-badge";
import { AddToCartControl } from "@/components/shop/add-to-cart-control";
import { ProductCard } from "@/components/shop/product-card";
import { useAsyncData } from "@/lib/store/hooks";
import {
  getProductById,
  getProductCategories,
  getProducts,
} from "@/services/products";
import { formatCad } from "@/lib/format";

export function ProductDetail({ productId }: { productId: string }) {
  const { data: product, loading, error, reload } = useAsyncData(
    () => getProductById(productId),
    [productId],
  );
  const { data: categories } = useAsyncData(getProductCategories);
  const { data: related } = useAsyncData(
    () =>
      product
        ? getProducts({ categoryId: product.categoryId, pageSize: 4 })
        : Promise.resolve(null),
    [product?.categoryId],
  );

  if (loading) {
    return (
      <div className="grid gap-10 lg:grid-cols-2">
        <PanelSkeleton rows={6} />
        <PanelSkeleton rows={8} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        icon="Boxes"
        title="Product not found"
        description={
          error ?? "This product may have been removed from the catalog."
        }
        action={
          <div className="flex gap-2">
            <Button onClick={reload}>Try again</Button>
            <Button
              variant="outline"
              render={<Link href="/products">All products</Link>}
            />
          </div>
        }
      />
    );
  }

  const category = (categories ?? []).find((c) => c.id === product.categoryId);
  const relatedItems = (related?.items ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <>
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to products
      </Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/*
          One image per product is all the catalog stores, so there is no
          thumbnail strip — the previous four "views" were decorative
          placeholders that implied photography we don't have.
        */}
        <div className="group">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizeHint="detail"
            className="aspect-4/3 w-full rounded-xl border border-border"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {category ? (
              <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                {category.name}
              </span>
            ) : null}
            <h1 className="text-4xl">{product.name}</h1>
            <p className="text-muted-foreground">{product.brand}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={
                    star <= Math.round(product.rating)
                      ? "size-4 fill-warning text-warning"
                      : "size-4 text-muted-foreground/30"
                  }
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount} reviews)
            </span>
          </div>

          <div className="flex flex-col gap-1 border-y border-border py-5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">
                {formatCad(product.priceCad)}
              </span>
              <span className="text-muted-foreground">/ {product.unit}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Trade price{" "}
              <span className="font-medium text-primary">
                {formatCad(product.contractorPriceCad)}
              </span>{" "}
              — applied automatically on contractor accounts
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <StockBadge status={product.stock} />
            {product.deliveryEstimate ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="size-4" aria-hidden="true" />
                {product.deliveryEstimate}
              </p>
            ) : null}
          </div>

          <AddToCartControl product={product} size="lg" />

          <div className="flex flex-col gap-2 pt-2">
            <h2 className="text-lg">Description</h2>
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          {product.specifications.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg">Specifications</h2>
              <dl className="divide-y divide-border rounded-xl border border-border">
                {product.specifications.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex justify-between gap-4 px-4 py-2.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{spec.label}</dt>
                    <dd className="text-right font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      {relatedItems.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-5 text-2xl">Related products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : related === null ? (
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : null}
    </>
  );
}
