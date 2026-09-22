import Link from "next/link";
import {
  ArrowRight,
  FileUp,
  ListOrdered,
  Package,
  Phone,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tile {
  title: string;
  description: string;
  href: string;
  image: string;
  icon: LucideIcon;
  tone: string;
  badge?: string;
}

/*
 * The five things a contractor starts here, in the order the work
 * usually happens: buy materials, get help choosing, put a package in
 * front of a customer, order a whole category, or send us a drawing.
 */
const PRIMARY: Tile[] = [
  {
    title: "Shop Products",
    description: "Trade pricing across the catalogue.",
    href: "/contractor/shop",
    image: "/images/products-hero-warehouse.webp",
    icon: ShoppingCart,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Call Order",
    description: "Book a slot and order with a person.",
    href: "/contractor/call-order",
    image: "/images/services-hero-framing.webp",
    icon: Phone,
    tone: "bg-success/12 text-success",
  },
  {
    title: "Create Package",
    description: "Generate a customer's selection list.",
    href: "/contractor/packages/new",
    image: "/images/premium-1-plans.webp",
    icon: Package,
    tone: "bg-chart-3/15 text-chart-3",
  },
];

const SECONDARY: Tile[] = [
  {
    title: "Category Order",
    description: "Order a whole trade category at once.",
    href: "/contractor/category-order",
    image: "/images/category-new-construction-framing.webp",
    icon: ListOrdered,
    tone: "bg-warning/15 text-warning-foreground dark:text-warning",
  },
  {
    title: "Upload a Drawing",
    description:
      "Send a plan and get back a material list, priced and ready to order.",
    href: "/contractor/drawings",
    image: "/images/hero-stage-2-framing.webp",
    icon: FileUp,
    tone: "bg-primary/10 text-primary",
    badge: "Reviewed by us",
  },
];

function ContractorTile({ tile, tall }: { tile: Tile; tall?: boolean }) {
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

export function ContractorTiles() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {PRIMARY.map((tile) => (
          <ContractorTile key={tile.href} tile={tile} tall />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr] sm:gap-4">
        {SECONDARY.map((tile) => (
          <ContractorTile key={tile.href} tile={tile} />
        ))}
      </div>
    </div>
  );
}
