"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart-provider";

export function CartButton() {
  const { itemCount } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={
        itemCount > 0 ? `Cart, ${itemCount} items` : "Cart, empty"
      }
      render={
        <Link href="/cart">
          <ShoppingCart className="size-4.5" />
          {itemCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          ) : null}
        </Link>
      }
    />
  );
}
