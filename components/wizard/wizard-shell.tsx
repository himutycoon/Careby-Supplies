"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { submitRenovation } from "@/lib/actions/submit-renovation";
import type { RenovationInput } from "@/lib/types";
import { StepProperty } from "@/components/wizard/step-property";
import { StepRoom } from "@/components/wizard/step-room";
import { StepPhotos } from "@/components/wizard/step-photos";
import { StepDimensions } from "@/components/wizard/step-dimensions";
import { StepWishlist } from "@/components/wizard/step-wishlist";
import { StepReview } from "@/components/wizard/step-review";
import { INITIAL_WIZARD_STATE, type WizardState } from "@/components/wizard/wizard-types";

const STEPS = [
  { title: "Property" },
  { title: "Room" },
  { title: "Photos" },
  { title: "Dimensions" },
  { title: "Wish-list" },
  { title: "Review" },
];

const MIN_PHOTOS = 3;


// Single-municipality launch — no picker needed yet (see project scope).
const MUNICIPALITY_ID = "mississauga-on";

export function WizardShell() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [state, setState] = React.useState<WizardState>(INITIAL_WIZARD_STATE);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = React.useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const isLastStep = stepIndex === STEPS.length - 1;
  const canGoNext = stepIndex !== 2 || state.photos.length >= MIN_PHOTOS;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired — please log in again.");
      setSubmitting(false);
      return;
    }

    try {
      const photoPaths: string[] = [];
      for (const photo of state.photos) {
        const path = `${user.id}/${crypto.randomUUID()}-${photo.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("renovation-photos")
          .upload(path, photo.file);
        if (uploadError) throw uploadError;
        photoPaths.push(path);
      }

      const input: RenovationInput = {
        propertyType: state.propertyType,
        isOwner: state.isOwner,
        roomType: state.roomType,
        lengthFt: state.lengthFt,
        widthFt: state.widthFt,
        ceilingHeightFt: state.ceilingHeightFt,
        scopeLevel: state.scopeLevel,
        wishlist: state.wishlist,
        budgetCad: state.budgetCad,
        municipalityId: MUNICIPALITY_ID,
        photoUrls: photoPaths,
        notes: state.notes,
      };

      const result = await submitRenovation(input, photoPaths);

      if ("error" in result) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      router.push(`/estimate/${result.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting your project. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {/* The stepper gets its own card so the six numbers read as
          progress rather than as the top of the form. */}
      <ol className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-4 sm:px-6">
        {STEPS.map((step, index) => {
          const isComplete = index < stepIndex;
          const isCurrent = index === stepIndex;
          return (
            <li key={step.title} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-sm font-semibold",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isComplete && "border-primary bg-primary/10 text-primary",
                    !isCurrent && !isComplete && "border-border text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 h-px flex-1",
                    isComplete ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <Card className="p-5 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isLastStep) {
              handleSubmit();
            }
          }}
        >
          {stepIndex === 0 ? (
            <StepProperty state={state} update={update} />
          ) : null}
          {stepIndex === 1 ? <StepRoom state={state} update={update} /> : null}
          {stepIndex === 2 ? <StepPhotos state={state} update={update} /> : null}
          {stepIndex === 3 ? (
            <StepDimensions state={state} update={update} />
          ) : null}
          {stepIndex === 4 ? (
            <StepWishlist state={state} update={update} />
          ) : null}
          {stepIndex === 5 ? <StepReview state={state} update={update} /> : null}

          {error ? (
            <p className="mt-6 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === 0 || submitting}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>

            {isLastStep ? (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Analyzing your
                    photos…
                  </>
                ) : (
                  <>
                    Submit &amp; get my estimate <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canGoNext}
                onClick={() =>
                  setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
                }
              >
                Next <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
