"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  FolderKanban,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { EditorialImage } from "@/components/shared/editorial-image";
import { DisclaimerBox } from "@/components/shared/disclaimer-box";
import { OptionCard } from "@/components/wizard-kit/option-card";
import { useToast } from "@/components/shared/toast";
import { calculateEstimate } from "@/services/estimates";
import { createProject } from "@/services/projects";
import { createPremiumRequest } from "@/services/service-requests";
import {
  CONSTRUCTION_QUESTIONS,
  CONSTRUCTION_TIERS,
  PACKAGE_CREDIT_NOTE,
  PACKAGE_REFUND_NOTE,
  type ConstructionTier,
} from "@/data/new-construction";
import type { ConstructionEstimate } from "@/lib/rules/calculate-construction-estimate";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NewConstructionWizard() {
  const { toast } = useToast();
  const [tier, setTier] = React.useState<ConstructionTier | null>(null);
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [estimate, setEstimate] = React.useState<ConstructionEstimate | null>(
    null,
  );
  const [submitted, setSubmitted] = React.useState(false);
  const [calculating, setCalculating] = React.useState(false);

  /*
   * Whether Stripe is wired up. Read from the publishable key: with no
   * key the redirect cannot work, so the wizard must not promise a card
   * payment it can't take. Same check the premium wizard makes.
   */
  const paymentsLive = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  const total = CONSTRUCTION_QUESTIONS.length;
  const question = CONSTRUCTION_QUESTIONS[index];
  const value = answers[question?.id ?? ""] ?? "";
  const progress = Math.round((index / total) * 100);

  function reset() {
    setTier(null);
    setIndex(0);
    setAnswers({});
    setEstimate(null);
    setSubmitted(false);
  }

  // Tier selection first — the tier decides what the end of the flow does.
  if (!tier) {
    return (
      <div className="flex flex-col gap-8">
        {/* No heading of its own: the page above says what this is, and
            two titles on one screen is one too many. */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONSTRUCTION_TIERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTier(option)}
              className={cn(
                "group flex flex-col gap-4 rounded-xl border bg-card p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                option.id === "plan-check"
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-semibold">{option.name}</span>
                <span className="font-heading text-xl text-primary">
                  {option.price}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{option.tagline}</p>
              <ul className="flex flex-col gap-2">
                {option.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-medium text-primary">
                Choose {option.name}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
          <p className="text-foreground">{PACKAGE_CREDIT_NOTE}</p>
          <p className="mt-2">{PACKAGE_REFUND_NOTE}</p>
        </div>
      </div>
    );
  }

  // Basic runs the calculator. The three paid tiers take payment first.
  if (estimate) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-card p-8">
          <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Estimated material budget
          </span>
          <p className="mt-3 font-heading text-4xl font-medium">
            {formatCad(estimate.totalLow)} – {formatCad(estimate.totalHigh)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on {formatCad(estimate.ratePerSqFtLow)}–
            {formatCad(estimate.ratePerSqFtHigh)} per sq ft of material for
            your selections. Labour, equipment and permits are your
            builder&apos;s to price — a builder&apos;s all-in rate typically
            runs two to three times this.
          </p>

          <h2 className="mt-6 text-sm font-semibold">Assumptions</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {estimate.assumptions.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <FolderKanban className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Saved to your projects, where you can reopen it any time.
              Excludes land, site servicing, development charges and HST.
              These are prototype figures for planning, not quoted
              construction prices.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button render={<Link href="/contact?about=estimate">Talk to an Expert</Link>} />
            <Button variant="outline" onClick={reset}>
              Start over
            </Button>
          </div>
        </div>

        <DisclaimerBox />
      </div>
    );
  }

  if (submitted) {
    const immediate = tier.id === "full-team";
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {immediate ? (
              <PhoneCall className="size-7" aria-hidden="true" />
            ) : (
              <Sparkles className="size-7" aria-hidden="true" />
            )}
          </span>
          <h2 className="text-2xl">Request received</h2>
          <p className="max-w-md text-muted-foreground">
            {immediate
              ? "Your build is saved and the team has it. We'll be in touch to arrange the package fee, then get the architect, designer and advisor onto it."
              : "Your build is saved and the team has it. We'll be in touch to arrange the package fee and book your review."}
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            {PACKAGE_CREDIT_NOTE}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button render={<Link href="/dashboard">Go to dashboard</Link>} />
            <Button variant="outline" onClick={reset}>
              Start over
            </Button>
          </div>
        </div>
        <DisclaimerBox />
      </div>
    );
  }

  const canContinue = value.trim() !== "";

  async function handleNext() {
    if (index < total - 1) {
      setIndex((i) => i + 1);
      return;
    }

    const activeTier = tier!;
    setCalculating(true);

    // Everything runs through the estimate rules first so the saved
    // project carries the same numbers the user is shown.
    const result = await calculateEstimate({
      area: answers.area,
      quality: answers.quality,
      basement: answers.basement,
      parking: answers.parking,
      bathrooms: answers.bathrooms,
      roof: answers.roof,
    });

    if (!result.ok) {
      setCalculating(false);
      toast(result.error, "error");
      return;
    }

    const project = await createProject({
      name: `New build — ${answers.location ?? "Mississauga, ON"}`,
      type: "new_construction",
      subtype: activeTier.name,
      location: answers.location,
      newConstructionDetails: {
        tier: activeTier.id,
        answers,
        estimateLow: result.data.totalLow,
        estimateHigh: result.data.totalHigh,
        assumptions: result.data.assumptions,
      },
    });

    if (!project.ok) {
      setCalculating(false);
      toast(project.error, "error");
      return;
    }

    if (activeTier.outcome === "estimate") {
      setCalculating(false);
      setEstimate(result.data);
      toast("Estimate ready and saved to your projects");
      return;
    }

    /*
     * Paid tiers raise a premium_request rather than a service_request.
     * That is the table the payment columns live on (schema-09) and the
     * one /admin/premium reads, so the advisor sees the job and whether
     * it has been paid for in the same row. The project id rides along in
     * details so they can find the build it belongs to.
     */
    const request = await createPremiumRequest({
      selectedServices: activeTier.features,
      budgetRange: answers.budget ?? "",
      notes: answers.notes ?? "",
      details: {
        tier: activeTier.id,
        tierName: activeTier.name,
        flow: "new-construction",
        projectId: project.data.id,
        ...answers,
      },
    });

    if (!request.ok) {
      setCalculating(false);
      toast(request.error, "error");
      return;
    }

    /*
     * Request first, payment second — the same order the materials
     * checkout uses. The row exists before Stripe is involved, so an
     * abandoned payment leaves a recoverable request rather than a lost
     * enquiry.
     */
    // No tier stored means the checkout route cannot price the request,
    // so don't send them to a page that will only fail.
    if (!paymentsLive || !request.data.detailsSaved) {
      setCalculating(false);
      setSubmitted(true);
      toast("Request submitted — we'll arrange payment with you");
      return;
    }

    try {
      const response = await fetch("/api/checkout/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The reference only. Which tier it is, and what it costs, are
        // read from the stored row by the server.
        body: JSON.stringify({ reference: request.data.reference }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        setCalculating(false);
        setSubmitted(true);
        toast(
          payload.error ?? "We couldn't open checkout — we'll be in touch.",
          "error",
        );
        return;
      }

      window.location.href = payload.url;
    } catch {
      setCalculating(false);
      setSubmitted(true);
      toast("We couldn't open checkout — we'll be in touch.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{tier.name} plan</p>
          <p className="text-sm text-muted-foreground">
            Step {index + 1} of {total}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          Change plan
        </Button>
      </div>

      <Progress value={progress} aria-label="Wizard progress" />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div className="rounded-xl border border-border bg-card p-6">
          <fieldset className="flex flex-col gap-5">
            <legend className="text-xl font-medium">{question.label}</legend>
            {question.helper ? (
              <p className="text-sm text-muted-foreground">{question.helper}</p>
            ) : null}

            {question.kind === "choice" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {question.options?.map((option) => (
                  <OptionCard
                    key={option}
                    label={option}
                    selected={value === option}
                    onSelect={() =>
                      setAnswers({ ...answers, [question.id]: option })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`q-${question.id}`} className="sr-only">
                  {question.label}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`q-${question.id}`}
                    type={question.kind === "number" ? "number" : "text"}
                    inputMode={question.kind === "number" ? "numeric" : undefined}
                    value={value}
                    placeholder={question.placeholder}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value })
                    }
                    autoFocus
                  />
                  {question.suffix ? (
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {question.suffix}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </fieldset>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button
              variant="outline"
              disabled={index === 0 || calculating}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button disabled={!canContinue || calculating} onClick={handleNext}>
              {calculating ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Calculating…
                </>
              ) : index === total - 1 ? (
                <>
                  {tier.outcome === "estimate"
                    ? "See my estimate"
                    : "Request consultation"}
                  <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <aside className="hidden lg:block">
          <EditorialImage
            tone="navy"
            alt="New home construction"
            className="aspect-3/4 w-full"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            We use your answers to size the estimate — nothing is shared
            outside CareBy.
          </p>
        </aside>
      </div>
    </div>
  );
}
