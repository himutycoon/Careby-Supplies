import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPanel } from "@/components/shared/hero-panel";
import { Icon } from "@/components/shared/icon";
import { PREMIUM_INCLUSIONS, PREMIUM_TIMELINE } from "@/data/platform";

export function PremiumSection() {
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-4 sm:gap-6">
            <span className="w-fit rounded-full border border-hi-vis/30 bg-hi-vis/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-hi-vis uppercase">
              Premium Supply
            </span>

            <h2 className="text-balance text-ink-foreground">
              Every Material For The Job, On Site When You Need It
            </h2>

            <p className="max-w-lg text-pretty leading-relaxed text-ink-foreground/70">
              Send us the drawings or the room. We work out what it takes,
              price it at trade rates and deliver it to the day — so nobody
              is standing around waiting on a pallet.
            </p>

            <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {PREMIUM_INCLUSIONS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs sm:gap-2.5 sm:text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-hi-vis text-hi-vis-foreground">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  <span className="text-ink-foreground/85">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/contact?about=consultation">Talk to an Expert</Link>}
              />
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
                render={<Link href="/services">Learn More</Link>}
              />
            </div>
          </div>

          <HeroPanel
            slideshowSlot="premium"
            imageSlot="premium"
            tone="forest"
            className="aspect-4/3 w-full rounded-xl ring-1 ring-white/10"
          />
        </div>

        {/* Order-to-delivery timeline */}
        <ol className="mt-10 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-white/10 pt-8 sm:mt-16 sm:gap-6 sm:pt-10 lg:grid-cols-6 lg:gap-4">
          {PREMIUM_TIMELINE.map((stage) => (
            <li key={stage.step} className="flex flex-col gap-1.5 sm:gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/8 text-hi-vis sm:size-10">
                <Icon name={stage.icon} className="size-4 sm:size-5" />
              </span>
              <span className="font-sans text-xs font-semibold tracking-[0.14em] text-ink-foreground/50">
                {stage.step}
              </span>
              <span className="text-sm font-medium text-ink-foreground">
                {stage.title}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
