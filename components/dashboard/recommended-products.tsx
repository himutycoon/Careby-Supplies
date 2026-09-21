"use client";

import Link from "next/link";
import { ArrowRight, Check, ShoppingBag, Sparkles, Star } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { ProductImage } from "@/components/shop/product-image";
import { ProductCardSkeleton, ListRowSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelHeader } from "@/components/dashboard/dashboard-panel";
import { useCart } from "@/components/shop/cart-provider";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getRecommendedProducts } from "@/services/recommendations";
import { formatCad } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * Suggested products for the signed-in homeowner.
 *
 * Owns its own heading, which is the point: the heading has to be able to
 * stop saying "for you". This used to render "Recommended for you" over a
 * query with no arguments, so every homeowner saw the same three
 * best-reviewed products regardless of what they had told us. Now the
 * copy follows the data — personalised picks carry the reason they were
 * chosen, and an account with nothing to go on gets an honest
 * "Popular in the shop" instead of a false claim.
 *
 * Two layouts over the same data: a card grid, and a compact list sized
 * for the dashboard's narrow right-hand column.
 */
export function RecommendedProducts({
  count = 3,
  variant = "grid",
}: {
  count?: number;
  variant?: "grid" | "list";
}) {
  const { data, loading } = useAsyncData(() => getRecommendedProducts(count));

  const heading = loading
    ? "Products for you"
    : data?.personalised
      ? "Recommended for your project"
      : "Popular in the shop";

  const subtitle = loading
    ? undefined
    : data?.personalised
      ? "Based on the rooms, wishes and issues in your submissions."
      : "Start a project and these become suggestions for your job.";

  const items = data?.items ?? [];

  if (variant === "list") {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <PanelHeader
          icon={data?.personalised ? Sparkles : ShoppingBag}
          title={heading}
          subtitle={subtitle}
          href="/products"
        />
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: count }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="Boxes"
            title="Catalog is empty"
            description="Products will appear here once the catalog is populated."
            className="gap-2 px-4 py-6"
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map(({ product, reasons }) => (
              <CompactProductRow
                key={product.id}
                product={product}
                reason={reasons[0]}
              />
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <>
      <PanelHeader
        icon={data?.personalised ? Sparkles : ShoppingBag}
        title={heading}
        subtitle={subtitle}
        href="/products"
        hrefLabel="Shop all"
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="Boxes"
          title="Catalog is empty"
          description="Products will appear here once the catalog is populated."
          action={
            <Link
              href="/products"
              className="text-sm font-medium text-primary hover:underline"
            >
              Browse the catalog <ArrowRight className="inline size-3.5" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ product, reasons }) => (
            <div key={product.id} className="flex flex-col gap-2">
              <ProductCard product={product} />
              {/*
                The reason is the whole point of the feature: a suggestion
                nobody can explain is indistinguishable from an advert.
              */}
              {reasons.length > 0 ? (
                <p className="px-0.5 text-xs leading-snug text-muted-foreground">
                  <span className="font-medium text-foreground">Why: </span>
                  {reasons[0]}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * One product on a line, with a one-tap add.
 *
 * Uses the cart directly rather than AddToCartControl: that control
 * carries a quantity stepper, which does not fit a 300px column, and a
 * suggestion is a nudge — quantity belongs on the product page.
 */
function CompactProductRow({
  product,
  reason,
}: {
  product: Product;
  reason?: string;
}) {
  const { add } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const outOfStock = product.stock === "out-of-stock";

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function handleAdd() {
    add(product.id, 1);
    toast(`${product.name} added to cart`);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Link
        href={`/products/${product.id}`}
        tabIndex={-1}
        aria-hidden="true"
        className="shrink-0"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizeHint="thumb"
          className="size-16 rounded-lg border border-border"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 text-sm leading-snug font-medium hover:text-primary"
        >
          {product.name}
        </Link>
        {product.reviewCount > 0 ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Star
              className="size-3 fill-warning text-warning"
              aria-hidden="true"
            />
            {product.rating.toFixed(1)} ({product.reviewCount})
          </p>
        ) : null}
        <p className="mt-0.5 text-sm font-semibold tabular-nums">
          {formatCad(product.priceCad)}
        </p>
        {reason ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            {reason}
          </p>
        ) : null}
      </div>

      <Button
        size="sm"
        className="press shrink-0"
        onClick={handleAdd}
        disabled={outOfStock}
        aria-label={`Add ${product.name} to cart`}
      >
        {outOfStock ? (
          "Sold out"
        ) : added ? (
          <>
            <Check className="size-3.5" /> Added
          </>
        ) : (
          "Add to cart"
        )}
      </Button>
    </li>
  );
}
