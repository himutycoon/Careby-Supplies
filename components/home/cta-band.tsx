import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="max-w-2xl text-balance">
          Ready to price your materials?
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Tell us what you&apos;re building and we&apos;ll work out what it
          takes to supply — priced, in stock, and delivered to site.
        </p>
        {/* "Talk to an Expert" used to sit beside this button. It now
            floats on every page of the site (ExpertFab), so on this
            band the two were on screen together, a few pixels apart. */}
        <Button
          variant="hi-vis"
          size="lg"
          render={
            <Link href="/get-started">
              Get Started <ArrowRight className="size-4" />
            </Link>
          }
        />
      </div>
    </section>
  );
}
