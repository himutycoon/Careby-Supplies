import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Greeting banner.
 *
 * The photo sits on the right and fades into the panel colour, so the
 * headline always reads against a flat ground whatever the image does.
 * On phones the image is dropped entirely — at 390px it would either
 * crush the headline or push the tiles below the fold.
 */
export function DashboardHero({ name }: { name: string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-accent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-stage-3-finished.webp"
        alt=""
        className="absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)] sm:block"
      />

      <div className="relative flex flex-col gap-3 p-6 sm:max-w-[60%] sm:p-8">
        <h1 className="text-3xl text-foreground sm:text-4xl">
          Hi, <span className="capitalize">{name}</span>{" "}
          <span aria-hidden="true">👋</span>
        </h1>
        <div>
          <p className="font-medium text-foreground">
            Let&apos;s work out what your project needs.
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            From a single part to a whole renovation&apos;s worth of material
            — priced, in stock and delivered.
          </p>
        </div>
        <Button
          size="lg"
          className="press mt-2 w-full rounded-full sm:w-fit"
          render={
            <Link href="/new">
              Get an estimate <ArrowRight className="size-4" />
            </Link>
          }
        />
      </div>
    </section>
  );
}
