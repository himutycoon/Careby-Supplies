"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartControl } from "@/components/shop/add-to-cart-control";
import { ProductCardSkeleton } from "@/components/shared/skeleton";
import { useAsyncData } from "@/lib/store/hooks";
import { getProducts, type ProductQuery } from "@/services/products";
import { cn } from "@/lib/utils";

/**
 * Horizontally-scrolling merchandising rail for the home page.
 *
 * A rail rather than a grid on purpose: the home page is a storefront
 * window, not the catalog. Four cards wide on a desktop, thumb-scrolled
 * on a phone, with `/products` one click away for the full aisle.
 *
 * If the query returns nothing the whole band renders nothing — an
 * empty "Popular right now" heading is worse than no heading at all.
 */
export function ProductRail({
  title,
  subtitle,
  query,
  viewAllHref = "/products",
  viewAllLabel = "Shop all",
  count = 8,
  className,
}: {
  title: string;
  subtitle?: string;
  query?: ProductQuery;
  viewAllHref?: string;
  viewAllLabel?: string;
  count?: number;
  className?: string;
}) {
  // Serialised so an inline object literal at the call site doesn't
  // refetch on every render.
  const queryKey = JSON.stringify(query ?? {});
  const { data, loading, error } = useAsyncData(
    () => getProducts({ ...query, pageSize: count, page: 1 }),
    [queryKey, count],
  );

  const scroller = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const syncArrows = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    syncArrows();
  }, [syncArrows, data]);

  function scrollBy(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    // Just under a full viewport keeps a card visible as an anchor.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const products = data?.items ?? [];

  // Nothing to merchandise — stay silent rather than show a dead band.
  if (error || (!loading && products.length === 0)) return null;

  return (
    <section className={cn("border-b border-border/70 bg-background", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={viewAllHref}
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              {viewAllLabel}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>

            {/* Arrows are a desktop affordance; a phone just swipes. */}
            <div className="hidden items-center gap-1.5 lg:flex">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                onClick={() => scrollBy(-1)}
                disabled={atStart}
                aria-label={`Scroll ${title} left`}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                onClick={() => scrollBy(1)}
                disabled={atEnd}
                aria-label={`Scroll ${title} right`}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Negative gutters let cards bleed to the screen edge on a
            phone, so the row reads as scrollable without a scrollbar. */}
        <div
          ref={scroller}
          onScroll={syncArrows}
          className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mt-6 sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading && products.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[10.5rem] shrink-0 sm:w-[15rem]"
                >
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div
                  key={product.id}
                  // A one-cell grid stretches the card on both axes, so
                  // cards fill the track and every Add to Cart button in
                  // the row lines up regardless of title length.
                  className="grid w-[10.5rem] shrink-0 snap-start sm:w-[15rem]"
                >
                  <ProductCard
                    product={product}
                    action={<AddToCartControl product={product} />}
                  />
                </div>
              ))}
        </div>

        <Link
          href={viewAllHref}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
        >
          {viewAllLabel}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
