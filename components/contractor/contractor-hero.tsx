import Link from "next/link";
import { ArrowRight, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Contractor greeting banner.
 *
 * Same construction as the homeowner hero — photo masked into the panel,
 * dropped entirely on phones — but the headline sells the one thing a
 * trade account is for: trade pricing on everything in the catalogue.
 */
export function ContractorHero({ name }: { name: string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-accent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/products-hero-warehouse.webp"
        alt=""
        className="absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)] sm:block"
      />

      <div className="relative flex flex-col gap-3 p-6 sm:max-w-[60%] sm:p-8">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-xs font-medium text-primary">
          <Percent className="size-3.5" aria-hidden="true" />
          Trade pricing on every order
        </span>
        <h1 className="text-3xl text-foreground sm:text-4xl">
          Hi, <span className="capitalize">{name}</span>{" "}
          <span aria-hidden="true">👋</span>
        </h1>
        <div>
          <p className="font-medium text-foreground">
            Quote it, order it, track it.
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Materials, customer packages and takeoffs in one place.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            className="press rounded-full"
            render={
              <Link href="/contractor/shop">
                Shop at trade prices <ArrowRight className="size-4" />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            className="press rounded-full bg-background/70"
            render={
              <Link href="/contractor/packages/new">Build a package</Link>
            }
          />
        </div>
      </div>
    </section>
  );
}
