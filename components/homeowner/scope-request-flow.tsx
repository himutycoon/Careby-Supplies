"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OptionCard } from "@/components/wizard-kit/option-card";
import { WizardFrame } from "@/components/wizard-kit/wizard-frame";
import { ProductSelector } from "@/components/wizard-kit/product-selector";
import { useCart } from "@/components/shop/cart-provider";
import { useToast } from "@/components/shared/toast";
import { createServiceRequest } from "@/services/service-requests";
import {
  PROJECT_SCOPES,
  projectScope,
  stagesFor,
  type ScopeStage,
} from "@/data/project-scopes";
import { cn } from "@/lib/utils";

const STEPS = ["Project", "What you need", "Materials", "Send"];

/**
 * Pick a project, tick the parts of it you need materials for, send it.
 *
 * Deliberately not the package builder: no tiers, no allowances, no
 * prices. The client's brief for this screen is one line — "this is
 * where customer will select what they need and then send the request" —
 * and putting a number on it before anyone has chosen a product would be
 * a guess dressed as a quote.
 *
 * Everything ticked goes into the request's details as stage ids and
 * labels both: ids so a later version can turn a stage into products,
 * labels so the request is still readable if a stage is ever renamed.
 */
export function ScopeRequestFlow() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = React.useState(0);
  const [projectId, setProjectId] = React.useState("");
  const [variantId, setVariantId] = React.useState("");
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [openStage, setOpenStage] = React.useState("");
  const { itemCount } = useCart();

  const project = projectId ? projectScope(projectId) : undefined;
  const stages: ScopeStage[] = project ? stagesFor(project, variantId) : [];

  // A variant's stages are the ones that change when the variant does,
  // so a tick against "Laminate boards" must not survive a switch to
  // carpet.
  function chooseVariant(id: string) {
    setVariantId(id);
    const variantStages = new Set(
      (project?.variants ?? []).flatMap((v) => v.stages.map((s) => s.id)),
    );
    setPicked((prev) => new Set([...prev].filter((s) => !variantStages.has(s))));
  }

  function chooseProject(id: string) {
    setProjectId(id);
    setVariantId("");
    setPicked(new Set());
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const needsVariant = Boolean(project?.variants?.length) && !variantId;
  // Not memoised: `stages` is rebuilt every render anyway, so a memo
  // keyed on it would never hit, and filtering 29 items is free.
  const chosen = stages.filter((s) => picked.has(s.id));
  const canContinue =
    step === 0 ? Boolean(project) && !needsVariant : step === 1 ? picked.size > 0 : true;

  // Open the first ticked stage on arrival rather than an empty grid.
  const stageView = `${projectId}|${variantId}|${[...picked].sort().join(",")}`;
  const [lastStageView, setLastStageView] = React.useState(stageView);
  if (stageView !== lastStageView) {
    setLastStageView(stageView);
    setOpenStage(chosen[0]?.id ?? "");
  }
  const activeStage = chosen.find((s) => s.id === openStage) ?? chosen[0];

  async function submit() {
    if (!project) return;
    setSubmitting(true);
    const result = await createServiceRequest({
      serviceType: "material-list",
      category: project.id,
      subcategory: variantId,
      details: {
        project: project.name,
        variant: project.variants?.find((v) => v.id === variantId)?.label ?? "",
        stages: chosen.map((s) => ({ id: s.id, label: s.label, categories: s.categories })),
      },
      notes,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(`Request ${result.data.reference} sent. We'll come back with a list.`, "success");
    router.push("/dashboard");
  }

  return (
    <WizardFrame
      steps={STEPS}
      current={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => (step === STEPS.length - 1 ? submit() : setStep((s) => s + 1))}
      canContinue={canContinue}
      submitting={submitting}
      nextLabel={step === STEPS.length - 1 ? "Send request" : "Continue"}
    >
      {step === 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PROJECT_SCOPES.map((p) => (
              <OptionCard
                key={p.id}
                label={p.name}
                description={p.blurb}
                selected={projectId === p.id}
                onSelect={() => chooseProject(p.id)}
              />
            ))}
          </div>

          {project?.variants?.length ? (
            <div className="flex flex-col gap-2.5">
              <Label>{project.variantLabel}</Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {project.variants.map((v) => (
                  <OptionCard
                    key={v.id}
                    label={v.label}
                    selected={variantId === v.id}
                    onSelect={() => chooseVariant(v.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 1 && project ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Tick every part you need materials for. {picked.size} of {stages.length} selected.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPicked(new Set(stages.map((s) => s.id)))}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPicked(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stages.map((s) => {
              const on = picked.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex min-w-0 items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    on
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {on ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm leading-tight font-medium">{s.label}</span>
                    {s.note ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{s.note}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 2 && project ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            What we stock for each part you ticked. Add what you need and
            check out — nothing here has to wait on a phone call.
          </p>

          {/* One stage open at a time: a bathroom can carry 29 of them,
              and fetching a grid for every one would be 29 requests to
              fill a screen nobody has scrolled to yet. */}
          <div className="scroll-row gap-2 pb-1">
            {chosen.map((stage) => {
              const on = stage.id === activeStage?.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setOpenStage(stage.id)}
                  aria-pressed={on}
                  className={cn(
                    "press flex min-h-9 items-center rounded-full border px-3 text-sm font-medium whitespace-nowrap",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>

          {activeStage ? (
            <ProductSelector
              key={activeStage.id}
              categoryIds={activeStage.categories}
              emptyMessage={`We don't stock ${activeStage.label.toLowerCase()} online yet — leave it ticked and we'll price it with your request.`}
            />
          ) : null}
        </div>
      ) : null}

      {step === 3 && project ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium">
              {project.name}
              {variantId
                ? ` — ${project.variants?.find((v) => v.id === variantId)?.label}`
                : ""}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {stages
                .filter((s) => picked.has(s.id))
                .map((s) => s.label)
                .join(" · ")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="scope-notes">Anything else we should know?</Label>
            <Textarea
              id="scope-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sizes, finishes, your install date — whatever you already know."
              rows={4}
            />
          </div>

          {itemCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm">
                <ShoppingCart className="mr-1.5 inline size-4" aria-hidden="true" />
                {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
              </p>
              <Button
                variant="secondary"
                size="sm"
                render={<Link href="/cart">Go to checkout</Link>}
              />
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Sending the request covers the parts we could not price for you
            here. Anything already in your cart can be checked out now —
            the two do not wait on each other. Installation is handled by
            your own contractor.
          </p>
        </div>
      ) : null}
    </WizardFrame>
  );
}
