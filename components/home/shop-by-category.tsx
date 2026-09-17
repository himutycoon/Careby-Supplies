"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { useAsyncData } from "@/lib/store/hooks";
import { getProductCategories } from "@/services/products";
import { cn } from "@/lib/utils";

/** Department tile — photo when the category has one, icon otherwise. */
function CategoryTile({
  href,
  name,
  icon,
  imageUrl,
  emphasis = false,
}: {
  href: string;
  name: string;
  icon: string;
  imageUrl?: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-center justify-start gap-2 rounded-xl border border-border bg-card px-2 py-3.5 text-center transition-all duration-200 sm:gap-2.5 sm:px-3 sm:py-5",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_4px_16px_rgb(0_0_0/0.07)]",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      {/*
        A fixed 64px plate, not a full-width square: with icons rather
        than photography a large tile is mostly empty space, and the
        directory reads faster when a whole department fits on screen.
      */}
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-16",
          emphasis
            ? "bg-primary/10 text-primary"
            : "bg-surface-muted text-foreground/70",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : emphasis ? (
          <LayoutGrid className="size-5 sm:size-7" aria-hidden="true" />
        ) : (
          <Icon
            name={icon}
            className="size-5 transition-transform duration-300 group-hover:scale-110 sm:size-7"
          />
        )}
      </span>
      <span className="text-[11px] leading-snug font-medium text-balance sm:text-sm">
        {name}
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
        <div className="max-w-xl">
          <span className="font-sans text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Shop the catalog
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl">Shop by department</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lumber to lighting — everything priced for the job, delivered
            across the GTA.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:mt-8 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
          {loading && categories.length === 0
            ? Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse flex-col items-center gap-2 rounded-xl border border-border bg-card px-2 py-3.5 sm:gap-2.5 sm:px-3 sm:py-5"
                  aria-hidden="true"
                >
                  <div className="size-12 rounded-xl bg-muted sm:size-16" />
                  <div className="h-3 w-3/5 rounded bg-muted" />
                </div>
              ))
            : categories.map((category) => (
                <CategoryTile
                  key={category.id}
                  href={`/products?category=${category.id}#catalog`}
                  name={category.name}
                  icon={category.icon}
                  imageUrl={category.imageUrl}
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
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Browse the full catalog
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
