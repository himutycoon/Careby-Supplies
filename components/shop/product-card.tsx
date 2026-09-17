import Link from "next/link";
import { Star } from "lucide-react";
import { ProductImage } from "@/components/shop/product-image";
import { StockBadge } from "@/components/shop/stock-badge";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Corner badge, derived only from fields the catalog actually stores.
 *
 * Deliberately narrow:
 * - No SALE or BEST SELLER — the data model has no sale price and no
 *   sales figures, so either would be a commercial claim nothing backs.
 * - No NEW — every seeded product shares a created_at from the same
 *   migration, so it would appear on the entire catalog and mean
 *   nothing. Worth revisiting once products are added over time; the
 *   "Newest" sort already uses that field honestly.
 *
 * What is left genuinely distinguishes a minority of products.
 */
function cornerBadge(product: Product): { label: string; tone: string } | null {
  if (product.stock === "out-of-stock") {
    return { label: "Out of stock", tone: "bg-foreground/75 text-background" };
  }
  if (product.stock === "low-stock") {
    return { label: "Low stock", tone: "bg-warning text-warning-foreground" };
  }
  if (product.rating >= 4.8 && product.reviewCount >= 50) {
    // Primary, not ink: in dark mode the ink surface sits within a
    // hair of --card, and the chip all but disappeared against it.
    return { label: "Top rated", tone: "bg-primary text-primary-foreground" };
  }
  return null;
}

export function ProductCard({
  product,
  showContractorPrice = false,
  action,
}: {
  product: Product;
  showContractorPrice?: boolean;
  action?: React.ReactNode;
}) {
  const price = showContractorPrice
    ? product.contractorPriceCad
    : product.priceCad;
  const badge = cornerBadge(product);
  const href = `/products/${product.id}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        "transition-[border-color,box-shadow] duration-200 hover:border-foreground/20 hover:shadow-[0_2px_12px_rgb(0_0_0/0.06)]",
        "focus-within:border-primary/40",
      )}
    >
      {badge ? (
        <span
          className={cn(
            "absolute top-2 left-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
            badge.tone,
          )}
        >
          {badge.label}
        </span>
      ) : null}

      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="block focus-visible:outline-none"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="aspect-[3/2] w-full sm:aspect-[4/3]"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1 border-t border-border p-2.5 sm:gap-1.5 sm:p-3">
        <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {product.brand || "CareBy"}
        </p>

        <h3 className="text-[13px] leading-snug font-medium sm:text-sm">
          {/* Stretched link: the whole card is clickable, but only one
              focusable element ends up in the tab order. */}
          <Link
            href={href}
            className="line-clamp-2 after:absolute after:inset-0 hover:text-primary focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>

        {product.reviewCount > 0 ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star
              className="size-3.5 shrink-0 fill-warning text-warning"
              aria-hidden="true"
            />
            <span className="font-medium text-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span>({product.reviewCount.toLocaleString("en-CA")})</span>
          </p>
        ) : null}

        <p className="mt-0.5 flex items-baseline gap-1">
          <span className="text-base font-semibold tracking-tight">
            {formatCad(price)}
          </span>
          <span className="text-xs text-muted-foreground">/ {product.unit}</span>
        </p>

        {showContractorPrice ? (
          <p className="text-xs text-muted-foreground">
            Retail {formatCad(product.priceCad)} ·{" "}
            <span className="font-medium text-primary">Trade price</span>
          </p>
        ) : null}

        <StockBadge status={product.stock} />

        {/* Above the stretched link so the button stays clickable. */}
        {action ? (
          <div className="relative z-10 mt-auto pt-1.5 sm:pt-2">{action}</div>
        ) : null}
      </div>
    </article>
  );
}
