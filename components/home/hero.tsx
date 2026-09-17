import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlueprintGrid } from "@/components/shared/blueprint-texture";
import { Icon } from "@/components/shared/icon";
import { HERO_CARDS } from "@/data/platform";
import { HeroPanel } from "@/components/shared/hero-panel";

const TRUST_BULLETS = [
  "Trade-priced materials",
  "Expert project support",
  "Serving Mississauga, ON",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      {/* Drawing-paper grid rather than a generic glow — this is a
          construction supplier, and the surface should say so. */}
      <BlueprintGrid className="text-white" opacity={0.07} />
      <div
        className="pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-hi-vis/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-5 sm:gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium tracking-wide text-ink-foreground/80">
            <span className="size-1.5 rounded-full bg-hi-vis" />
            Materials, planning and expert support
          </span>

          <h1 className="text-balance text-ink-foreground">
            Build. Renovate. Repair.{" "}
            {/* Safety yellow, not navy: --primary is the navy that this
                section is painted in, so the highlight has to come from
                the other half of the palette to be a highlight at all.
                The same applies to every accent below. */}
            <span className="text-hi-vis">Everything in One Place.</span>
          </h1>

          <p className="max-w-xl text-pretty text-lg leading-relaxed text-ink-foreground/75">
            Quality products, expert guidance, project planning and
            construction support — all from one platform.
          </p>

          {/* Full-width CTAs on phones — a thumb reaches an edge-to-edge
              button far more reliably than a centred pill. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="hi-vis"
              size="lg"
              className="press w-full sm:w-auto"
              render={
                <Link href="/get-started">
                  Get Started <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              className="press w-full border-white/20 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground sm:w-auto"
              render={<Link href="/products">Shop Products</Link>}
            />
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
            {TRUST_BULLETS.map((bullet) => (
              <li
                key={bullet}
                className="flex items-center gap-2 text-sm text-ink-foreground/70"
              >
                <Check className="size-4 text-hi-vis" aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        {/* Hero visual with layered product-UI cards. */}
        <div className="relative">
          {/* Add entries to SITE_SLIDESHOWS.homeHero for a crossfade;
              falls back to the single homeHero image, then to the
              designed panel. */}
          <HeroPanel
            slideshowSlot="homeHero"
            imageSlot="homeHero"
            tone="slate"
            className="aspect-4/3 w-full shadow-2xl ring-1 ring-white/10"
          />

          <div className="mt-4 grid gap-3 sm:absolute sm:-bottom-8 sm:-left-8 sm:mt-0 sm:w-64 sm:gap-3">
            {HERO_CARDS.slice(0, 2).map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/95 p-3.5 shadow-lg backdrop-blur-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={card.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="truncate text-base font-semibold text-foreground">
                    {card.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {card.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 hidden rounded-xl border border-border/60 bg-background/95 p-3.5 shadow-lg backdrop-blur-sm lg:absolute lg:-top-6 lg:-right-6 lg:mt-0 lg:flex lg:w-60 lg:items-center lg:gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon name={HERO_CARDS[2].icon} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {HERO_CARDS[2].label}
              </p>
              <p className="truncate text-base font-semibold text-foreground">
                {HERO_CARDS[2].value}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
