"use client";

import * as React from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart-provider";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getProjects } from "@/services/projects";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function AddToCartControl({
  product,
  size = "default",
  showProjectPicker = false,
}: {
  product: Product;
  size?: "default" | "lg";
  /** Contractor surfaces can assign a line to a project at add time. */
  showProjectPicker?: boolean;
}) {
  const { add } = useCart();
  const { toast } = useToast();
  // Only contractor surfaces show the picker, so only they need the fetch.
  const { data: projectData } = useAsyncData(
    () => (showProjectPicker ? getProjects() : Promise.resolve([])),
    [showProjectPicker],
  );
  const projects = projectData ?? [];
  const [quantity, setQuantity] = React.useState(1);
  const [projectId, setProjectId] = React.useState<string>("");
  const [justAdded, setJustAdded] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const disabled = product.stock === "out-of-stock";

  function handleAdd() {
    add(product.id, quantity, projectId || undefined);
    toast(`${quantity} × ${product.name} added to cart`);
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className="flex flex-col gap-2">
      {showProjectPicker && projects.length > 0 ? (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Assign to project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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

      {/*
        Wraps rather than overflowing: on a phone a catalog tile is
        ~165px wide, and the stepper plus the button do not fit on one
        line — the button used to be clipped by the card's rounded
        corner. Below that width it drops to its own full-width row.
      */}
      <div className="flex flex-wrap items-center gap-2">
        {/*
          No stepper on a phone card: at two columns the row cannot hold
          both controls, so it wrapped to a second line and cost ~40px on
          every card. Quantity is still adjustable on the product page
          and in the cart, which is where people change it anyway.
        */}
        <div
          className={cn(
            "shrink-0 items-center rounded-lg border border-input",
            size === "lg" ? "flex" : "hidden sm:flex",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-r-none"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={disabled || quantity <= 1}
            aria-label={`Decrease quantity of ${product.name}`}
          >
            <Minus className="size-3.5" />
          </Button>
          <span
            className="min-w-9 text-center text-sm font-medium tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-l-none"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={disabled}
            aria-label={`Increase quantity of ${product.name}`}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <Button
          type="button"
          variant="hi-vis"
          size={size === "lg" ? "lg" : "sm"}
          // basis-24 is the wrap threshold; min-w-0 lets it shrink
          // inside the row instead of forcing an overflow.
          className="min-w-0 flex-1 shrink basis-24"
          onClick={handleAdd}
          disabled={disabled}
        >
          {justAdded ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" />
              {disabled ? "Unavailable" : "Add to Cart"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
