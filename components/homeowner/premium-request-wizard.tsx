"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepIndicator } from "@/components/shared/step-indicator";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { createPremiumRequest, getServices } from "@/services/service-requests";
import {
  PREMIUM_CONTACT_PREFERENCES,
  PREMIUM_DAYS,
  PREMIUM_PROJECT_TYPES,
  PREMIUM_PROPERTY_TYPES,
  PREMIUM_TIERS,
  PREMIUM_TIMELINES,
  PREMIUM_TIMES,
} from "@/data/guided-flows";
import { PREMIUM_INCLUSIONS } from "@/data/platform";
import { cn } from "@/lib/utils";

const BUDGET_RANGES = [
  "Under $50k",
  "$50k – $150k",
  "$150k – $400k",
  "$400k – $1M",
  "Over $1M",
];

const STEPS = ["Tier", "Project", "Contact", "Review"];

/** Shared select styling — matches the rest of the form controls. */
const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-9";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/** Selectable card used for tiers, services and contact preference. */
function PickCard({
  selected,
  title,
  description,
  meta,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "press flex flex-col gap-1.5 rounded-xl border p-4 text-left",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-semibold">{title}</span>
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border",
          )}
        >
          {selected ? <Check className="size-3" aria-hidden="true" /> : null}
        </span>
      </span>
      {description ? (
        <span className="text-sm text-muted-foreground">{description}</span>
      ) : null}
      {meta ? <span className="text-xs text-primary">{meta}</span> : null}
    </button>
  );
}

/**
 * Guided premium package request, following the client's flow prototype:
 * engagement tier, project profile, contact preference, review.
 *
 * Everything it collects is persisted to premium_requests — the tier,
 * timeline, property and contact answers go into the `details` jsonb
 * column added by schema-07.
 */
export function PremiumRequestWizard() {
  const { toast } = useToast();

  const { data: services } = useAsyncData(getServices);
  const serviceOptions = React.useMemo(
    () =>
      services && services.length > 0
        ? services.map((service) => service.name)
        : PREMIUM_INCLUSIONS,
    [services],
  );

  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);

  const [tier, setTier] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [projectType, setProjectType] = React.useState("");
  const [timeline, setTimeline] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [propertyType, setPropertyType] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [contactPreference, setContactPreference] = React.useState("");
  const [day, setDay] = React.useState("");
  const [time, setTime] = React.useState("");

  const tierName =
    PREMIUM_TIERS.find((option) => option.id === tier)?.name ?? "";
  const contactLabel =
    PREMIUM_CONTACT_PREFERENCES.find((c) => c.id === contactPreference)
      ?.label ?? "";
  const needsSlot = contactPreference === "scheduled";

  function toggleService(service: string) {
    setSelected((current) =>
      current.includes(service)
        ? current.filter((s) => s !== service)
        : [...current, service],
    );
  }

  /** Returns an error message, or null when the step is complete. */
  function validate(index: number): string | null {
    if (index === 0 && !tier) return "Choose an engagement level.";
    if (index === 1) {
      if (selected.length === 0) return "Select at least one service.";
      if (!projectType) return "Choose a project type.";
      if (!timeline) return "Choose a timeline.";
    }
    if (index === 2) {
      if (!contactPreference) return "Choose how you'd like us to reach you.";
      if (needsSlot && (!day || !time)) {
        return "Pick a preferred day and time.";
      }
    }
    return null;
  }

  function next() {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    // Re-check every step, not just the last — someone could reach
    // review and then go back and clear a field.
    for (let i = 0; i < STEPS.length - 1; i++) {
      const problem = validate(i);
      if (problem) {
        setStep(i);
        setError(problem);
        return;
      }
    }

    setSubmitting(true);
    const result = await createPremiumRequest({
      selectedServices: selected,
      budgetRange: budget,
      notes,
      details: {
        tier,
        tierName,
        projectType,
        timeline,
        propertyType,
        contactPreference,
        preferredDay: needsSlot ? day : "",
        preferredTime: needsSlot ? time : "",
      },
    });
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    setReference(result.data.reference);
    toast("Premium request submitted");
  }

  if (reference) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-2xl">Request received</h2>
        <p className="max-w-md text-muted-foreground">
          Reference <strong className="text-foreground">{reference}</strong>. A
          project advisor will be in touch to scope the work with you.
        </p>
        <Button
          className="press mt-2"
          render={<Link href="/dashboard">Back to dashboard</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-lg font-medium">
            How much support do you want?
          </legend>
          <div className="grid gap-3 lg:grid-cols-3">
            {PREMIUM_TIERS.map((option) => (
              <PickCard
                key={option.id}
                selected={tier === option.id}
                title={option.name}
                description={option.tagline}
                meta={option.bestFor}
                onClick={() => setTier(option.id)}
              />
            ))}
          </div>
          {tier ? (
            <ul className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              {PREMIUM_TIERS.find((o) => o.id === tier)?.includes.map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ),
              )}
            </ul>
          ) : null}
        </fieldset>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-lg font-medium">
              Which services do you need?
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {serviceOptions.map((service) => (
                <PickCard
                  key={service}
                  selected={selected.includes(service)}
                  title={service}
                  onClick={() => toggleService(service)}
                />
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project type" htmlFor="premium-project-type">
              <select
                id="premium-project-type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Select…</option>
                {PREMIUM_PROJECT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Target timeline" htmlFor="premium-timeline">
              <select
                id="premium-timeline"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Select…</option>
                {PREMIUM_TIMELINES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Budget range" htmlFor="premium-budget">
              <select
                id="premium-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Prefer not to say</option>
                {BUDGET_RANGES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Property" htmlFor="premium-property">
              <select
                id="premium-property"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Select…</option>
                {PREMIUM_PROPERTY_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Anything else we should know?" htmlFor="premium-notes">
            <Textarea
              id="premium-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Style, constraints, condo board rules, deadlines…"
            />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-lg font-medium">
              How should we reach you?
            </legend>
            <div className="grid gap-3 lg:grid-cols-3">
              {PREMIUM_CONTACT_PREFERENCES.map((option) => (
                <PickCard
                  key={option.id}
                  selected={contactPreference === option.id}
                  title={option.label}
                  description={option.description}
                  onClick={() => setContactPreference(option.id)}
                />
              ))}
            </div>
          </fieldset>

          {needsSlot ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferred day" htmlFor="premium-day">
                <select
                  id="premium-day"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">Select…</option>
                  {PREMIUM_DAYS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Preferred time" htmlFor="premium-time">
                <select
                  id="premium-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">Select…</option>
                  {PREMIUM_TIMES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Review your request</h2>
          <dl className="grid gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            {[
              ["Engagement", tierName],
              ["Services", selected.join(", ")],
              ["Project type", projectType],
              ["Timeline", timeline],
              ["Budget", budget || "Not specified"],
              ["Property", propertyType || "Not specified"],
              ["Contact", contactLabel],
              ...(needsSlot ? [["Preferred slot", `${day}, ${time}`]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="font-medium">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {notes ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="text-xs text-muted-foreground uppercase">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{notes}</p>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Submitting this doesn&apos;t commit you to anything — an advisor
            reviews it and comes back with scope and pricing.
          </p>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="ghost"
          className="press"
          onClick={back}
          disabled={step === 0 || submitting}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button size="lg" className="press" onClick={next}>
            Continue <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="press"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Submit request"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
