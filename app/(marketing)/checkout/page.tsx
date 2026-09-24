import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/shop/checkout-flow";

export const metadata: Metadata = { title: "Checkout — CareBy Supplies" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <h1 className="mb-8 text-4xl">Checkout</h1>
      <CheckoutFlow />
    </div>
  );
}
