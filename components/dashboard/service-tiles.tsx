import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Crown,
  PaintRoller,
  ShoppingCart,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tile {
  title: string;
  description: string;
  href: string;
  image: string;
  icon: LucideIcon;
  /** Tints the icon chip so the five paths are told apart at a glance. */
  tone: string;
  badge?: string;
}

/*
 * The five things a homeowner comes here to start.
 *
 * Premium carries "Full service" rather than the "Most Popular" in the
 * reference design: nothing counts which package is chosen most, and the
 * catalogue deliberately avoids badges no data backs (see ProductCard).
 */
const PRIMARY: Tile[] = [
  {
    title: "Repair",
    description: "The parts and materials to put it right.",
    href: "/repair",
    image: "/images/category-repair-plumbing.webp",
    icon: Wrench,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "New Construction",
    description: "Material budgets and supply for a build from scratch.",
    href: "/new-construction",
    image: "/images/category-new-construction-framing.webp",
    icon: Building2,
    tone: "bg-success/12 text-success",
  },
  {
    title: "Renovation",
    description: "Work out what a room needs, priced and delivered.",
    href: "/new",
    image: "/images/category-renovation-kitchen.webp",
    icon: PaintRoller,
    tone: "bg-chart-3/15 text-chart-3",
  },
];

const SECONDARY: Tile[] = [
  {
    title: "Shop Products",
    description: "Quality materials and tools for your projects.",
    href: "/products",
    image: "/images/products-hero-warehouse.webp",
    icon: ShoppingCart,
    tone: "bg-warning/15 text-warning-foreground dark:text-warning",
  },
  {
    title: "Premium Supply",
    description: "A takeoff from your drawings, priced and scheduled.",
    href: "/premium-request",
    image: "/images/premium-1-plans.webp",
    icon: Crown,
    tone: "bg-primary/10 text-primary",
    badge: "Full service",
  },
];

function ServiceTile({ tile, tall }: { tile: Tile; tall?: boolean }) {
  const Icon = tile.icon;
  return (
    <Link
      href={tile.href}
      className={cn(
        "group press-sm relative flex overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow] duration-200",
        "hover:border-primary/40 hover:shadow-[0_6px_20px_color-mix(in_oklch,var(--primary),transparent_88%)]",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        tall ? "min-h-40 sm:min-h-44" : "min-h-36",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tile.image}
        alt=""
        loading="lazy"
        decoding="async"
        /* Faded with a mask, not an overlay: a card-coloured gradient laid
           on top left a visible seam where the image began, and had to be
           kept in step with the card colour in both themes. A mask fades
           the photo itself to transparent, so the card shows through. */
        className="absolute inset-y-0 right-0 h-full w-[55%] object-cover transition-transform duration-500 [mask-image:linear-gradient(to_right,transparent,black_55%)] group-hover:scale-105"
      />

      {tile.badge ? (
        <span className="absolute top-3 right-3 z-10 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
          {tile.badge}
        </span>
      ) : null}

      <div className="relative z-10 flex w-[62%] flex-col gap-2 p-4 sm:p-5">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            tile.tone,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-sans text-base font-semibold tracking-normal">
            {tile.title}
          </h3>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">
            {tile.description}
          </p>
        </div>
        <ArrowRight
          className="mt-auto size-4 text-foreground/70 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

export function ServiceTiles() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {PRIMARY.map((tile) => (
          <ServiceTile key={tile.href} tile={tile} tall />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr] sm:gap-4">
        {SECONDARY.map((tile) => (
          <ServiceTile key={tile.href} tile={tile} />
        ))}
      </div>
    </div>
  );
}
