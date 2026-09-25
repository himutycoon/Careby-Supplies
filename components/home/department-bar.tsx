"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { useAsyncData } from "@/lib/store/hooks";
import { getProductCategories } from "@/services/products";
import { categoryIcon } from "@/data/category-images";

/**
 * The department bar, directly under the header.
 *
 * A supply shop's home page should open with aisles, not an essay. The
 * full department grid further down is for browsing with pictures; this
 * is the shortcut for someone who already knows they want plumbing, and
 * it is the first thing under the navigation so the page reads as a
 * storefront within the first hundred pixels.
 *
 * Scrolls horizontally rather than wrapping: seventeen departments would
 * be three stacked rows on a phone and push the hero off the screen.
 */
export function DepartmentBar() {
  const { data } = useAsyncData(getProductCategories);
  const categories = data ?? [];

  // Nothing to show until the catalog answers — an empty bar would just
  // be a grey stripe above the hero.
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Shop by department"
      className="border-b border-border/70 bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="scroll-row gap-1 py-2">
          <li>
            <Link
              href="/products"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap text-primary transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Boxes className="size-4" aria-hidden="true" />
              All products
            </Link>
          </li>

          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/products?category=${category.id}#catalog`}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Icon
                  name={categoryIcon(category.id, category.icon)}
                  className="size-4 shrink-0"
                />
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
