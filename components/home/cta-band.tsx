import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="max-w-2xl text-balance">
          Ready to start your project?
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Tell us what you&apos;re building and we&apos;ll take it from
          there — with materials, estimates and people who know the work.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="hi-vis"
            size="lg"
            render={
              <Link href="/get-started">
                Get Started <ArrowRight className="size-4" />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/contact?about=consultation">Talk to an Expert</Link>}
          />
        </div>
      </div>
    </section>
  );
}
