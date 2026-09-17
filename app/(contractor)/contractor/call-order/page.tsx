import type { Metadata } from "next";
import { CallOrderFlow } from "@/components/contractor/call-order-flow";

export const metadata: Metadata = { title: "Call Order — CareBy Contractor" };

export default function CallOrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Schedule a call order</h1>
        <p className="mt-1 text-muted-foreground">
          Talk to our ordering team — useful for large or complex orders.
        </p>
      </div>
      <CallOrderFlow />
    </div>
  );
}
