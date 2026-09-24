import type { Metadata } from "next";
import Link from "next/link";
import { GuidedFlowRouter } from "@/components/shared/guided-flow-router";

export const metadata: Metadata = { title: "Get Started — CareBy Supplies" };

export default function GetStartedPage() {
  return (
    <div className="relative overflow-hidden bg-muted/40">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-8 sm:px-6 sm:py-20 lg:py-28">
        {/* The eyebrow is decoration; on a phone it costs a line of the
            fold for no information, so it starts at sm. */}
        <span className="hidden rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase sm:inline">
          Welcome
        </span>

        <h1 className="text-center text-balance sm:mt-6">
          How can we help you?
        </h1>
        <p className="mt-2 max-w-xl text-center text-pretty text-sm text-muted-foreground sm:mt-4 sm:text-base">
          Pick the path that fits. Every one of them ends with a material
          list you can order from — the work itself stays with your own
          trades.
        </p>

        <div className="mt-5 w-full sm:mt-12">
          <GuidedFlowRouter />
        </div>

        <p className="mt-6 text-sm text-muted-foreground sm:mt-10">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
