"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shop/product-image";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useCart } from "@/components/shop/cart-provider";
import { useToast } from "@/components/shared/toast";
import { OrderSummary } from "@/components/shop/order-summary";
import { useAsyncData } from "@/lib/store/hooks";
import { getProductsByIds } from "@/services/products";
import { getProjects } from "@/services/projects";
import { getMyRole } from "@/services/profile";
import { priceForRole } from "@/lib/pricing";
import { formatCad } from "@/lib/format";

export function CartView() {
  const { lines, setQuantity, setProject, remove, clear } = useCart();
  const { toast } = useToast();

  const productIds = React.useMemo(
    () => lines.map((l) => l.productId).sort().join(","),
    [lines],
  );

  const { data: products, loading } = useAsyncData(
    () => getProductsByIds(productIds ? productIds.split(",") : []),
    [productIds],
  );
  const { data: projects } = useAsyncData(getProjects);
  const { data: role } = useAsyncData(getMyRole);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon="ShoppingCart"
        title="Your cart is empty"
        description="Browse materials and add what your project needs."
        action={<Button render={<Link href="/products">Shop Products</Link>} />}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {lines.map((line) => (
          <ListRowSkeleton key={line.productId} />
        ))}
      </div>
    );
  }

  const items = lines
    .map((line) => {
      const product = (products ?? []).find((p) => p.id === line.productId);
      return product ? { product, line } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const orderLines = items.map(({ product, line }) => ({
    productId: product.id,
    name: product.name,
    brand: product.brand,
    unit: product.unit,
    unitPriceCad: priceForRole(product, role),
    quantity: line.quantity,
    projectId: line.projectId,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {items.map(({ product, line }) => (
            <li key={product.id} className="flex gap-4 p-4">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                sizeHint="thumb"
                className="size-20 shrink-0 rounded-lg border border-border sm:size-24"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-sm font-semibold hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {product.brand}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      remove(product.id);
                      toast(`${product.name} removed`, "info");
                    }}
                    aria-label={`Remove ${product.name} from cart`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {formatCad(priceForRole(product, role))} / {product.unit}
                  {role === "contractor" ? (
                    <span className="ml-1.5 text-xs">
                      Retail {formatCad(product.priceCad)} · Trade price
                    </span>
                  ) : null}
                </p>

                {projects && projects.length > 0 ? (
                  <label className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Project</span>
                    <select
                      value={line.projectId ?? ""}
                      onChange={(e) =>
                        setProject(product.id, e.target.value || undefined)
                      }
                      className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      aria-label={`Assign ${product.name} to a project`}
                    >
                      <option value="">No project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center rounded-lg border border-input">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-r-none"
                      onClick={() => setQuantity(product.id, line.quantity - 1)}
                      aria-label={`Decrease quantity of ${product.name}`}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="min-w-9 text-center text-sm font-medium tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-l-none"
                      onClick={() => setQuantity(product.id, line.quantity + 1)}
                      aria-label={`Increase quantity of ${product.name}`}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>

                  <span className="font-semibold tabular-nums">
                    {formatCad(priceForRole(product, role) * line.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clear();
              toast("Cart cleared", "info");
            }}
          >
            <Trash2 className="size-4" /> Clear cart
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <OrderSummary
          lines={orderLines}
          action={
            <Button
              size="lg"
              className="w-full"
              render={
                <Link href="/checkout">
                  Checkout <ArrowRight className="size-4" />
                </Link>
              }
            />
          }
        />
      </div>
    </div>
  );
}
