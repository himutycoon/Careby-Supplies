import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";
import { PREMIUM_TIMELINE } from "@/data/platform";
import { PREMIUM_TIERS } from "@/data/guided-flows";
import {
  CONSULTATION_FEE_CAD,
  isPaidConsultationTier,
} from "@/lib/rules/consultation";
import { cn } from "@/lib/utils";

/**
 * Premium, which is where the homeowner money is.
 *
 * It used to be a headline, a paragraph and six two-word pills — you had
 * to click through to /premium to find out what you were actually
 * buying. The three tiers now sit on the home page with what each one
 * includes, because the question a visitor has is "what do I get and
 * what does it cost", and answering it on the page they are already on
 * costs one screen of height.
 *
 * The photo panel was cut to make room. The tiers say more about the
 * product than a stock image of drawings did.
 */
export function PremiumSection() {
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col items-start gap-4 sm:items-center sm:gap-5 sm:text-center">
          <span className="w-fit rounded-full border border-hi-vis/30 bg-hi-vis/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-hi-vis uppercase">
            Premium Supply
          </span>

          <h2 className="max-w-3xl text-balance text-ink-foreground">
            Hand Us The Drawings. Take Delivery Of The Materials.
          </h2>

          <p className="max-w-2xl text-pretty leading-relaxed text-ink-foreground/70">
            Three ways to get the material side off your plate — from a
            single session with an advisor to a named contact who keeps
            every delivery ahead of your trades.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 sm:mt-12 lg:grid-cols-3">
          {PREMIUM_TIERS.map((tier) => {
            const paid = isPaidConsultationTier(tier.id);
            return (
              <li
                key={tier.id}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border p-5 sm:p-6",
                  paid
                    ? "border-hi-vis/50 bg-hi-vis/8"
                    : "border-white/12 bg-white/5",
                )}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="text-xl text-ink-foreground">{tier.name}</h3>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        paid ? "text-hi-vis" : "text-ink-foreground/60",
                      )}
                    >
                      {paid ? `$${CONSULTATION_FEE_CAD} CAD` : "Priced per job"}
                    </span>
                  </div>
                  <p className="text-sm text-ink-foreground/70">
                    {tier.tagline}
                  </p>
                  <p className="text-xs font-medium tracking-wide text-ink-foreground/45 uppercase">
                    {tier.bestFor}
                  </p>
                </div>

                <ul className="flex flex-1 flex-col gap-2.5">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-hi-vis text-hi-vis-foreground">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      <span className="text-ink-foreground/85">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  variant={paid ? "hi-vis" : "outline"}
                  className={cn(
                    "press w-full",
                    !paid &&
                      "border-white/20 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground",
                  )}
                  render={
                    <Link href={`/premium-request?tier=${tier.id}`}>
                      {paid ? "Book a session" : "Request this"}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  }
                />
              </li>
            );
          })}
        </ul>

        {/* Order-to-delivery timeline */}
        <ol className="mt-10 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-white/10 pt-8 sm:mt-14 sm:gap-6 sm:pt-10 lg:grid-cols-6 lg:gap-4">
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
