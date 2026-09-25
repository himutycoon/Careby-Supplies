"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, LayoutGrid } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { useAsyncData } from "@/lib/store/hooks";
import { getProductCategories } from "@/services/products";
import { categoryImage, categoryIcon } from "@/data/category-images";
import { cn } from "@/lib/utils";

/**
 * Department tile.
 *
 * Photo-led when the category has one, icon otherwise — a half
 * photographed catalogue still reads as deliberate rather than broken.
 * The photo comes from the database first (admin upload) then from
 * data/category-images.ts, so adding one needs no code change.
 */
function CategoryTile({
  href,
  name,
  icon,
  imageUrl,
  emphasis = false,
  className,
}: {
  href: string;
  name: string;
  icon: string;
  imageUrl?: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_4px_16px_rgb(0_0_0/0.07)]",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span
            className={cn(
              "flex size-full items-center justify-center",
              emphasis ? "text-primary" : "text-foreground/40",
            )}
          >
            {emphasis ? (
              <LayoutGrid className="size-6 sm:size-8" aria-hidden="true" />
            ) : (
              <Icon name={icon} className="size-6 sm:size-8" />
            )}
          </span>
        )}
      </span>

      <span className="flex items-center gap-1 px-2 py-2 sm:gap-1.5 sm:px-3 sm:py-2.5">
        <span className="min-w-0 flex-1 text-[11px] leading-tight font-medium text-balance sm:truncate sm:text-sm">
          {name}
        </span>
        <ChevronRight
          className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

/**
 * "Shop by department" — the aisle directory.
 *
 * Sits directly under the hero because the first question a supply
 * shopper has is "do you carry what I need", and the old home page made
 * them find the shop page before it could answer.
 *
 * Categories come from the live catalog, not a hardcoded list, so a
 * department added in the admin panel appears here without a deploy.
 *
 * No search field of its own: the header carries one at every width
 * now, and two search boxes within a phone screen of each other read as
 * a bug rather than a convenience.
 */
export function ShopByCategory() {
  const { data, loading } = useAsyncData(getProductCategories);
  const categories = data ?? [];

  return (
    <section className="border-b border-border/70 bg-surface-muted">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="font-sans text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Shop the catalog
            </span>
            {/* The strip under the hero is the quick list of all
                seventeen; this is the browsable one, so it gets a
                different name rather than repeating the heading. */}
            <h2 className="mt-2 text-xl sm:text-2xl">Popular departments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lumber to lighting — everything priced for the job, delivered
              across the GTA.
            </p>
          </div>
          <Link
            href="/products"
            className="flex shrink-0 items-center gap-1 pb-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-8 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
          {loading && categories.length === 0
            ? Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-xl border border-border bg-card"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/3] w-full bg-muted" />
                  <div className="px-3 py-3">
                    <div className="h-3 w-3/5 rounded bg-muted" />
                  </div>
                </div>
              ))
            : categories.map((category) => (
                <CategoryTile
                  key={category.id}
                  href={`/products?category=${category.id}#catalog`}
                  name={category.name}
                  icon={categoryIcon(category.id, category.icon)}
                  imageUrl={categoryImage(category.id, category.imageUrl)}
                />
              ))}

          {categories.length > 0 ? (
            <CategoryTile
              href="/products"
              name="All products"
              icon="Boxes"
              emphasis
            />
          ) : null}
        </div>

        <Link
          href="/products"
          className="mt-6 hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          Browse the full catalog
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
