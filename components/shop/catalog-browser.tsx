"use client";

import * as React from "react";
import {
  ArrowUpDown,
  LayoutGrid,
  Loader2,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartControl } from "@/components/shop/add-to-cart-control";
import { Icon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCardSkeleton } from "@/components/shared/skeleton";
import {
  getProductBrands,
  getProductCategories,
  getProducts,
  type ProductPage,
  type ProductSort,
} from "@/services/products";
import { useAsyncData } from "@/lib/store/hooks";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/lib/types";

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Highest rated" },
];

const RATINGS = [4, 3] as const;

const STOCK_FILTERS: { value: StockStatus; label: string }[] = [
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

const PAGE_SIZE = 12;

export function CatalogBrowser({
  showContractorPrice = false,
  initialCategoryId = null,
  initialSearch = "",
}: {
  showContractorPrice?: boolean;
  /**
   * Opening filters, read from the URL by the page above. Home-page
   * department tiles and the header search link straight into a
   * filtered catalog rather than dropping the shopper at "All products"
   * and making them find the filter again.
   */
  initialCategoryId?: string | null;
  initialSearch?: string;
}) {
  const [categoryId, setCategoryId] = React.useState<string | null>(
    initialCategoryId,
  );
  const [search, setSearch] = React.useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = React.useState(initialSearch);
  const [sort, setSort] = React.useState<ProductSort>("popular");
  const [stock, setStock] = React.useState<StockStatus[]>([]);
  const [brands, setBrands] = React.useState<string[]>([]);
  const [minRating, setMinRating] = React.useState<number | null>(null);
  const [maxPrice, setMaxPrice] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(1);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const { data: categoryData } = useAsyncData(getProductCategories);
  const categories = categoryData ?? [];
  const { data: brandData } = useAsyncData(getProductBrands);
  const allBrands = brandData ?? [];

  const [result, setResult] = React.useState<ProductPage | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  // isPending covers refetches; `loaded` gates the first-paint skeleton.
  const [isPending, startTransition] = React.useTransition();
  const loading = isPending || !loaded;

  // Debounce search so we don't hit the service on every keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      try {
        const data = await getProducts({
          search: debouncedSearch,
          categoryId,
          sort,
          stock,
          brands,
          minRating: minRating ?? undefined,
          maxPrice: maxPrice ?? undefined,
          page,
          pageSize: PAGE_SIZE,
          useContractorPrice: showContractorPrice,
        });
        if (cancelled) return;
        setResult(data);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("We couldn't load products. Please retry.");
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    categoryId,
    sort,
    stock,
    brands,
    minRating,
    maxPrice,
    page,
    showContractorPrice,
    reloadKey,
  ]);

  function resetFilters() {
    setSearch("");
    setCategoryId(null);
    setStock([]);
    setBrands([]);
    setMinRating(null);
    setMaxPrice(null);
    setPage(1);
  }

  const bounds = result?.priceBounds ?? { min: 0, max: 1000 };
  const activeFilterCount =
    (categoryId ? 1 : 0) +
    (stock.length > 0 ? 1 : 0) +
    (brands.length > 0 ? 1 : 0) +
    (minRating ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const filterPanel = (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold">Shop by category</h2>
        <nav className="flex flex-col gap-0.5" aria-label="Product categories">
          <button
            type="button"
            onClick={() => {
              setCategoryId(null);
              setPage(1);
            }}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
              categoryId === null
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={categoryId === null ? "true" : undefined}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            All Products
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setCategoryId(category.id);
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                categoryId === category.id
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={categoryId === category.id ? "true" : undefined}
            >
              <Icon name={category.icon} className="size-4" />
              {category.name}
            </button>
          ))}
        </nav>
      </div>

      {allBrands.length > 1 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Brand</h2>
          <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
            {allBrands.map((brand) => (
              <label
                key={brand}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={brands.includes(brand)}
                  onChange={(e) => {
                    setBrands((current) =>
                      e.target.checked
                        ? [...current, brand]
                        : current.filter((b) => b !== brand),
                    );
                    setPage(1);
                  }}
                  className="size-4 accent-primary"
                />
                <span className="truncate text-muted-foreground">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold">Customer rating</h2>
        <div className="flex flex-col gap-2">
          {RATINGS.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="radio"
                name="min-rating"
                checked={minRating === value}
                onChange={() => {
                  setMinRating(value);
                  setPage(1);
                }}
                className="size-4 accent-primary"
              />
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star
                  className="size-3.5 fill-warning text-warning"
                  aria-hidden="true"
                />
                {value} & up
              </span>
            </label>
          ))}
          {minRating ? (
            <button
              type="button"
              onClick={() => {
                setMinRating(null);
                setPage(1);
              }}
              className="w-fit text-xs text-primary hover:underline"
            >
              Clear rating
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Availability</h2>
        <div className="flex flex-col gap-2">
          {STOCK_FILTERS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={stock.includes(option.value)}
                onChange={(e) => {
                  setStock((current) =>
                    e.target.checked
                      ? [...current, option.value]
                      : current.filter((s) => s !== option.value),
                  );
                  setPage(1);
                }}
                className="size-4 accent-primary"
              />
              <span className="text-muted-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Max price</h2>
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={1}
          value={maxPrice ?? bounds.max}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value));
            setPage(1);
          }}
          className="w-full accent-primary"
          aria-label="Maximum price"
        />
        <p className="mt-1.5 text-sm text-muted-foreground">
          Up to {formatCad(maxPrice ?? bounds.max)}
        </p>
      </div>

      {activeFilterCount > 0 ? (
        <Button variant="outline" size="sm" onClick={resetFilters}>
          Clear filters ({activeFilterCount})
        </Button>
      ) : null}
    </div>
  );

  return (
    <div
      id="catalog"
      className="mx-auto flex max-w-7xl scroll-mt-24 gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
    >
      <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
        <div className="sticky top-24">{filterPanel}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, SKU or category..."
              aria-label="Search products"
              className="h-12 rounded-lg border-border pl-11 text-base shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:h-12 md:pl-11 md:text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p
              className="text-sm text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              {loading && !result
                ? "Loading products…"
                : `${result?.total ?? 0} ${
                    result?.total === 1 ? "product" : "products"
                  }`}
            </p>

            <div className="flex items-center gap-2">
              {/* Filters live in a bottom sheet on mobile — an inline
                  panel pushed the grid far down the page. */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="press h-9 lg:hidden"
                    >
                      <SlidersHorizontal className="size-4" /> Filter
                      {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                    </Button>
                  }
                />
                <SheetContent
                  side="bottom"
                  className="max-h-[85dvh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:hidden"
                >
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="px-4">{filterPanel}</div>
                  <div className="mt-6 px-4">
                    <Button
                      size="lg"
                      className="press w-full"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Show {result?.total ?? 0} results
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="relative">
                <ArrowUpDown
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground sm:hidden"
                  aria-hidden="true"
                />
                <label htmlFor="product-sort" className="sr-only">
                  Sort products
                </label>
                <select
                  id="product-sort"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as ProductSort);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-background pr-2 pl-8 text-sm transition-colors hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:pl-2.5"
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <EmptyState
            icon="AlertTriangle"
            title="Something went wrong"
            description={error}
            action={
              <Button onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </Button>
            }
            className="mt-8"
          />
        ) : loading && !result ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : result && result.items.length === 0 ? (
          <EmptyState
            icon="Boxes"
            title="No products match those filters"
            description="Try a different search term, or widen your filters."
            action={
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            }
            className="mt-8"
          />
        ) : (
          <>
            <div
              className={cn(
                "mt-5 grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 sm:gap-4 xl:grid-cols-4",
                loading && "opacity-60",
              )}
            >
              {result?.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showContractorPrice={showContractorPrice}
                  action={<AddToCartControl product={product} />}
                />
              ))}
            </div>

            {result?.hasMore ? (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Loading…
                    </>
                  ) : (
                    `Load more (${result.total - result.items.length} left)`
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
