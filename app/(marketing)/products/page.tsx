import type { Metadata } from "next";
import { Reveal } from "@/components/shared/reveal";
import { ProductsHero } from "@/components/shop/products-hero";
import { CatalogBrowser } from "@/components/shop/catalog-browser";
import { QuoteCta } from "@/components/shop/quote-cta";

export const metadata: Metadata = {
  title: "Building Materials & Supplies — CareBy Canada",
  description:
    "Building materials, tools and supplies — sourced for your project and delivered when you need them.",
};

/**
 * `?category=` and `?q=` are read here rather than with useSearchParams
 * in the browser, so a link from the home page arrives already filtered
 * on the first paint — and needs no Suspense boundary.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const category = first(params.category) ?? null;
  const query = first(params.q) ?? "";

  return (
    <>
      <ProductsHero />
      {/*
        Keyed on the params: /products?q=x to /products?category=y is a
        soft navigation on the same route, so without this the browser
        would keep the mounted component — and its now-stale filter
        state — and the new search would silently do nothing.
      */}
      <CatalogBrowser
        key={`${category ?? ""}|${query}`}
        initialCategoryId={category}
        initialSearch={query}
      />
      <Reveal>
        <QuoteCta />
      </Reveal>
    </>
  );
}
