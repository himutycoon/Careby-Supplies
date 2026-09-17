"use client";

import * as React from "react";
import Link from "next/link";
import { Headset, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionCard } from "@/components/wizard-kit/option-card";
import { WizardFrame, WizardStep } from "@/components/wizard-kit/wizard-frame";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartControl } from "@/components/shop/add-to-cart-control";
import { ProductCardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getProductsForRepair } from "@/services/products";
import { createServiceRequest } from "@/services/service-requests";
import { useToast } from "@/components/shared/toast";
import { REPAIR_AREAS } from "@/data/repair-flows";
import type { Product } from "@/lib/types";

const STEPS = ["Area", "Problem", "Help", "Products"];

export function RepairFlow() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [areaId, setAreaId] = React.useState<string | null>(null);
  const [problemId, setProblemId] = React.useState<string | null>(null);
  const [wantsExpert, setWantsExpert] = React.useState<boolean | null>(null);

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const area = REPAIR_AREAS.find((a) => a.id === areaId) ?? null;
  const problem = area?.problems.find((p) => p.id === problemId) ?? null;

  // Load recommendations once we know the area + problem.
  React.useEffect(() => {
    if (step !== 3 || !area) return;
    let cancelled = false;

    startTransition(async () => {
      try {
        const results = await getProductsForRepair(
          area.categoryIds,
          problem?.keywords ?? [],
        );
        if (!cancelled) setProducts(results);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [step, area, problem]);

  const canContinue =
    (step === 0 && Boolean(areaId)) ||
    (step === 1 && Boolean(problemId)) ||
    (step === 2 && wantsExpert !== null) ||
    step === 3;

  return (
    <WizardFrame
      steps={STEPS}
      current={step}
      canContinue={canContinue}
      nextLabel={step === 2 ? "Submit request" : "Continue"}
      submitting={submitting}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={async () => {
        // Leaving the "expert advice?" step records the request so the
        // team (and admin panel) can see it.
        if (step === 2 && area) {
          setSubmitting(true);
          const result = await createServiceRequest({
            serviceType: "repair",
            category: area.label,
            subcategory: problem?.label ?? "",
            details: {
              area: area.id,
              problem: problemId,
              wantsExpertAdvice: wantsExpert,
            },
          });
          setSubmitting(false);

          if (!result.ok) {
            toast(result.error, "error");
            return;
          }
          toast(`Request ${result.data.reference} submitted`);
        }

        if (step < STEPS.length - 1) setStep((s) => s + 1);
      }}
    >
      {step === 0 ? (
        <WizardStep title="What do you need help with?">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {REPAIR_AREAS.map((option) => (
              <OptionCard
                key={option.id}
                label={option.label}
                icon={option.icon}
                selected={areaId === option.id}
                onSelect={() => {
                  setAreaId(option.id);
                  setProblemId(null);
                  setLoaded(false);
                }}
              />
            ))}
          </div>
        </WizardStep>
      ) : null}

      {step === 1 && area ? (
        <WizardStep title="What problem are you experiencing?">
          <div className="grid gap-3 sm:grid-cols-2">
            {area.problems.map((option) => (
              <OptionCard
                key={option.id}
                label={option.label}
                selected={problemId === option.id}
                onSelect={() => {
                  setProblemId(option.id);
                  setLoaded(false);
                }}
              />
            ))}
          </div>
        </WizardStep>
      ) : null}

      {step === 2 ? (
        <WizardStep
          title="Would you like expert advice?"
          helper="A quick call can save you buying the wrong part."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setWantsExpert(true)}
              aria-pressed={wantsExpert === true}
              className={`flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-all ${
                wantsExpert === true
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Headset className="size-5" aria-hidden="true" />
              </span>
              <span className="font-semibold">Yes, talk to an expert</span>
              <span className="text-sm text-muted-foreground">
                We&apos;ll help diagnose it before you buy anything.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWantsExpert(false)}
              aria-pressed={wantsExpert === false}
              className={`flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-all ${
                wantsExpert === false
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ShoppingCart className="size-5" aria-hidden="true" />
              </span>
              <span className="font-semibold">No, show me products</span>
              <span className="text-sm text-muted-foreground">
                I know what I need — take me to the parts.
              </span>
            </button>
          </div>
        </WizardStep>
      ) : null}

      {step === 3 && area ? (
        <div className="flex flex-col gap-5">
          {wantsExpert ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Headset className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg">We&apos;ll get you to an expert</h2>
              <p className="text-sm text-muted-foreground">
                Tell us when suits and an advisor will call about your{" "}
                {area.label.toLowerCase()} issue
                {problem ? ` (${problem.label.toLowerCase()})` : ""}.
              </p>
              <Button render={<Link href="/contact?about=repair">Talk to an Expert</Link>} />
            </div>
          ) : null}

          <div>
            <h2 className="text-lg">
              Recommended for {problem?.label.toLowerCase() ?? area.label}
            </h2>
            <p className="text-sm text-muted-foreground">
              Parts commonly used for this repair.
            </p>
          </div>

          {!loaded || isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="Boxes"
              title="No parts listed online yet"
              description="We don't stock parts for this repair online — ask an expert and we'll source them."
              action={
                <Button
                  variant="outline"
                  render={<Link href="/contact?about=repair">Ask an expert</Link>}
                />
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  action={<AddToCartControl product={product} />}
                />
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-fit"
            render={<Link href="/cart">View cart</Link>}
          />
        </div>
      ) : null}
    </WizardFrame>
  );
}
