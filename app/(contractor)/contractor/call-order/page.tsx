import type { Metadata } from "next";
import { CallOrderFlow } from "@/components/contractor/call-order-flow";
import { CallNowPanel } from "@/components/contractor/call-now-panel";

export const metadata: Metadata = { title: "Call Order — CareBy Contractor" };

export default function CallOrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Order by phone</h1>
        <p className="mt-1 text-muted-foreground">
          Talk to our ordering team — useful for large or complex orders.
        </p>
      </div>

      <CallNowPanel />

      <div className="mb-6 border-t border-border pt-6">
        <h2 className="text-xl">Or book a time and we&apos;ll call you</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a category and a slot. Useful when the order needs working
          out rather than reading off a list.
        </p>
      </div>

      <CallOrderFlow />
    </div>
  );
}
