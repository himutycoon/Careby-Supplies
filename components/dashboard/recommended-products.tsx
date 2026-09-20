"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useAsyncData } from "@/lib/store/hooks";
import { getRecommendedProducts } from "@/services/recommendations";

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
 */
export function RecommendedProducts({ count = 3 }: { count?: number }) {
  const { data, loading } = useAsyncData(() => getRecommendedProducts(count));

  const heading = data?.personalised
    ? "Recommended for your project"
    : "Popular in the shop";

  const subtitle = data?.personalised
    ? "Based on the rooms, wishes and issues in your submissions."
    : "Start a project and these become suggestions for your job.";

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg">
            {data?.personalised ? (
              <Sparkles
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
            ) : null}
            {loading ? "Products for you" : heading}
          </h2>
          {!loading ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <Link
          href="/products"
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Shop all
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
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
          {data?.items.map(({ product, reasons }) => (
            <div key={product.id} className="flex flex-col gap-2">
              <ProductCard product={product} />
              {/*
                The reason is the whole point of the feature: a suggestion
                nobody can explain is indistinguishable from an advert.
                Only the strongest reason is shown — the rules layer puts
                the user's own words first when it found any.
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
