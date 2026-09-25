import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlueprintGrid } from "@/components/shared/blueprint-texture";
import { Icon } from "@/components/shared/icon";
import { HERO_CARDS, USER_TYPES } from "@/data/platform";
import { HeroPanel } from "@/components/shared/hero-panel";

const TRUST_BULLETS = [
  "Trade-priced materials",
  "Advice on what the job needs",
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

      {/* py trimmed from 20/28: at full height the hero filled a 1080px
          screen on its own and nothing below it was ever seen without
          scrolling, which is what made the page read as an article. */}
      <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-18">
        <div className="flex flex-col gap-5 sm:gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium tracking-wide text-ink-foreground/80">
            <span className="size-1.5 rounded-full bg-hi-vis" />
            Building materials, delivered across the GTA
          </span>

          <h1 className="text-balance text-ink-foreground">
            Every Material. One Supplier.{" "}
            {/* Safety yellow, not navy: --primary is the navy that this
                section is painted in, so the highlight has to come from
                the other half of the palette to be a highlight at all.
                The same applies to every accent below. */}
            <span className="text-hi-vis">Delivered to Your Site.</span>
          </h1>

          <p className="max-w-xl text-pretty leading-relaxed text-ink-foreground/75 sm:text-lg">
            Lumber, tile, fixtures and the rest — priced for trade and
            homeowner alike, with people who know what the job needs.
          </p>

          {/* Full-width CTAs on phones — a thumb reaches an edge-to-edge
              button far more reliably than a centred pill. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Two lines each: the label is the action, the line under
                it says what the action gets you. On a phone that is the
                difference between two buttons and two guesses. */}
            <Button
              variant="hi-vis"
              size="lg"
              className="press h-auto w-full rounded-full py-2.5 sm:w-auto"
              render={
                <Link href="/get-started">
                  <span className="flex flex-col items-center leading-tight">
                    <span className="flex items-center gap-1.5 font-semibold">
                      Price My Materials <ArrowRight className="size-4" />
                    </span>
                    <span className="text-[11px] font-normal opacity-75">
                      Get a material list
                    </span>
                  </span>
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              className="press h-auto w-full rounded-full border-white/20 bg-transparent py-2.5 text-ink-foreground hover:bg-white/10 hover:text-ink-foreground sm:w-auto"
              render={
                <Link href="/products">
                  <span className="flex flex-col items-center leading-tight">
                    <span className="font-semibold">Shop Products</span>
                    <span className="text-[11px] font-normal opacity-75">
                      Browse materials
                    </span>
                  </span>
                </Link>
              }
            />
          </div>

          {/*
            Role chooser, above the fold.

            Rounded-full and translucent so it reads as a choice rather
            than a third and fourth call to action — the hi-vis button
            above stays the single loudest thing on the screen. Both
            roles get identical weight: this is a fork, not a
            recommendation, so styling one as primary would be a lie.

            The "I'm a" is said once, by the group. Repeating it inside
            each pill needed ~148px of content, which wrapped to two
            rows at 375px and to two lines at 320px; the role on its own
            fits a 140px pill at every width we support.

            Labels and destinations come from USER_TYPES, the same
            source the section further down the page uses, so the two
            can never drift apart.
          */}
          {/* Phones get RoleChooserCard directly below the hero, so
              these pills would be the same choice twice. */}
          <div className="hidden pt-1 lg:block">
            <span
              id="hero-role-label"
              className="text-xs font-semibold tracking-[0.14em] text-ink-foreground/55 uppercase"
            >
              I&apos;m a
            </span>
            {/* Grid, not flex-wrap: two flex-1 pills came to 167.5px
                each inside 343px at 375px, and the rounding tipped the
                second onto its own row. A 2-column grid cannot. */}
            <div
              role="group"
              aria-labelledby="hero-role-label"
              className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5"
            >
              {USER_TYPES.map((type) => (
                <Link
                  key={type.id}
                  href={type.href}
                  className="press inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium whitespace-nowrap text-ink-foreground transition-colors hover:border-hi-vis/40 hover:bg-white/10 sm:py-2.5"
                >
                  <Icon name={type.icon} className="size-4 text-hi-vis" />
                  {type.shortLabel}
                </Link>
              ))}
            </div>
          </div>

          <ul className="hidden flex-wrap gap-x-6 gap-y-2 pt-2 sm:flex">
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
            className="aspect-[16/10] w-full shadow-2xl ring-1 ring-white/10 sm:aspect-4/3"
          />

          <div className="mt-4 hidden gap-3 sm:absolute sm:-bottom-8 sm:-left-8 sm:mt-0 sm:grid sm:w-64 sm:gap-3">
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
