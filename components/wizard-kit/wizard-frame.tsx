"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/shared/step-indicator";

/**
 * Shared wizard chrome: progress indicator, step body, and Back/Continue
 * controls with validation gating. Every multi-step flow uses this so
 * navigation affordances never drift between flows (spec §25).
 */
export function WizardFrame({
  steps,
  current,
  children,
  onBack,
  onNext,
  canContinue = true,
  nextLabel = "Continue",
  submitting = false,
  header,
  aside,
}: {
  steps: string[];
  current: number;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  canContinue?: boolean;
  nextLabel?: string;
  submitting?: boolean;
  header?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      {header}

      <StepIndicator steps={steps} current={current} />

      <div
        className={
          aside
            ? "grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start"
            : undefined
        }
      >
        <div className="rounded-xl border border-border bg-card p-6">
          {children}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={current === 0 || submitting}
              onClick={onBack}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button
              type="button"
              disabled={!canContinue || submitting}
              onClick={onNext}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Working…
                </>
              ) : (
                <>
                  {nextLabel} <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {aside ? <aside className="lg:sticky lg:top-24">{aside}</aside> : null}
      </div>
    </div>
  );
}

/** Titled step body with optional helper copy. */
export function WizardStep({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="text-lg font-medium">{title}</legend>
      {helper ? (
        <p className="text-sm text-muted-foreground">{helper}</p>
      ) : null}
      {children}
    </fieldset>
  );
}
