import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCad } from "@/lib/format";
import { PRICING_TIERS } from "@/data/mock";
import { cn } from "@/lib/utils";

export function PricingPreview({
  showFooterLink = true,
}: {
  showFooterLink?: boolean;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2>Simple, upfront pricing</h2>
        <p className="mt-2 text-muted-foreground">
          The instant estimate is always free. Pay only when you want the
          full hand-designed plan.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PRICING_TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={cn(
              "gap-4 p-6",
              tier.highlighted && "border-primary shadow-md ring-1 ring-primary",
            )}
          >
            <div>
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="text-sm text-muted-foreground">
                {tier.description}
              </p>
            </div>
            <div>
              <span className="text-3xl font-bold">
                {tier.priceCad === 0 ? "Free" : formatCad(tier.priceCad ?? 0)}
              </span>
              {tier.priceCad !== 0 ? (
                <span className="ml-1 text-sm text-muted-foreground">
                  {tier.priceNote}
                </span>
              ) : null}
            </div>
            <ul className="flex flex-col gap-2">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={tier.highlighted ? "default" : "outline"}
              className="mt-2"
              render={<Link href={tier.ctaHref}>{tier.ctaLabel}</Link>}
            />
          </Card>
        ))}
      </div>

      {showFooterLink ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prices shown in CAD.{" "}
          <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">
            See full pricing details
          </Link>
        </p>
      ) : (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prices shown in CAD. One-time fee per submission — no subscriptions.
        </p>
      )}
    </section>
  );
}
