"use client";

import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { useAsyncData } from "@/lib/store/hooks";
import { getProductCategories } from "@/services/products";
import { categoryIcon, categoryImage } from "@/data/category-images";

/**
 * The department strip, directly under the hero.
 *
 * Photo-led rather than a row of text links: a supply shop is known by
 * what is in the aisles, and a 56px picture of lumber says "we stock
 * this" faster than the word does. Falls back to the department icon
 * where no photo exists, so a half-photographed catalogue still reads as
 * deliberate.
 *
 * Scrolls horizontally rather than wrapping — seventeen departments
 * would be three stacked rows on a phone and push everything else off
 * the screen. The photo grid further down is the browsable version; this
 * is the shortcut for someone who already knows the aisle they want.
 */
function Department({
  href,
  name,
  icon,
  imageUrl,
}: {
  href: string;
  name: string;
  icon: string;
  imageUrl?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex w-[7.5rem] flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-[8.5rem]"
    >
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-muted">
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
          <Icon name={icon} className="size-6 text-foreground/40" />
        )}
      </span>
      {/* min-w-0 so a two-word department wraps inside the tile instead
          of pushing its own label out past the edges. */}
      <span className="flex min-w-0 items-center gap-1 text-xs leading-tight font-medium sm:text-sm">
        <span className="line-clamp-2 min-w-0">{name}</span>
        <ArrowRight
          className="size-3 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

export function DepartmentBar() {
  const { data } = useAsyncData(getProductCategories);
  const categories = data ?? [];

  // Nothing until the catalog answers — an empty strip would just be a
  // grey band under the hero.
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Shop by department"
      className="border-b border-border/70 bg-background"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
        <ul className="scroll-row py-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Department
                href={`/products?category=${category.id}#catalog`}
                name={category.name}
                icon={categoryIcon(category.id, category.icon)}
                imageUrl={categoryImage(category.id, category.imageUrl)}
              />
            </li>
          ))}
          <li>
            <Link
              href="/products"
              className="group flex w-[7.5rem] flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-[8.5rem]"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Boxes className="size-6" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-1 text-xs leading-tight font-medium text-primary sm:text-sm">
                All products
                <ArrowRight
                  className="size-3 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
