"use client";

import * as React from "react";
import { cartStore } from "@/lib/store/app-store";
import { useCartLines } from "@/lib/store/hooks";
import type { CartLine } from "@/lib/types";

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  add: (productId: string, quantity: number, projectId?: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setProject: (productId: string, projectId: string | undefined) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

/**
 * Cart reads from the shared external store (lib/store) via
 * useSyncExternalStore — no state library, and persistence survives
 * navigation, reloads and other tabs.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useCartLines();

  const value = React.useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),

      add(productId, quantity, projectId) {
        cartStore.set((current) => {
          const existing = current.find((l) => l.productId === productId);
          if (existing) {
            return current.map((l) =>
              l.productId === productId
                ? {
                    ...l,
                    quantity: l.quantity + quantity,
                    projectId: projectId ?? l.projectId,
                  }
                : l,
            );
          }
          return [...current, { productId, quantity, projectId }];
        });
      },

      setQuantity(productId, quantity) {
        cartStore.set((current) =>
          quantity <= 0
            ? current.filter((l) => l.productId !== productId)
            : current.map((l) =>
                l.productId === productId ? { ...l, quantity } : l,
              ),
        );
      },

      setProject(productId, projectId) {
        cartStore.set((current) =>
          current.map((l) =>
            l.productId === productId ? { ...l, projectId } : l,
          ),
        );
      },

      remove(productId) {
        cartStore.set((current) =>
          current.filter((l) => l.productId !== productId),
        );
      },

      clear() {
        cartStore.set([]);
      },
    }),
    [lines],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = React.use(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}
