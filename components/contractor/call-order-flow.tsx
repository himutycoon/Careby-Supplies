"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, CircleCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OptionCard } from "@/components/wizard-kit/option-card";
import { WizardFrame, WizardStep } from "@/components/wizard-kit/wizard-frame";
import { ReviewStep } from "@/components/wizard-kit/review-step";
import { useToast } from "@/components/shared/toast";
import {
  AVAILABLE_TIMES,
  availableDates,
  createAppointment,
} from "@/services/appointments";
import { formatDate } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Category", "Date", "Time", "Notes", "Review"];

const CATEGORIES = [
  { id: "Plumbing", label: "Plumbing", icon: "Wrench" },
  { id: "Electrical", label: "Electrical", icon: "AlertTriangle" },
  { id: "Flooring", label: "Flooring", icon: "Ruler" },
  { id: "Roofing", label: "Roofing", icon: "Building2" },
  { id: "Kitchen", label: "Kitchen", icon: "Home" },
  { id: "Bathroom", label: "Bathroom", icon: "Boxes" },
  { id: "Other", label: "Other", icon: "Package" },
];

export function CallOrderFlow() {
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [category, setCategory] = React.useState<string | null>(null);
  const [date, setDate] = React.useState<string | null>(null);
  const [time, setTime] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [booked, setBooked] = React.useState<Appointment | null>(null);

  const dates = React.useMemo(() => availableDates(5), []);
  const dateLabel = dates.find((d) => d.value === date)?.label ?? "";

  const canContinue =
    (step === 0 && Boolean(category)) ||
    (step === 1 && Boolean(date)) ||
    (step === 2 && Boolean(time)) ||
    step === 3 ||
    step === 4;

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    const result = await createAppointment({
      // `date` is the ISO value; `dateLabel` is the human-readable
      // rendering of it. Sending the label made Postgres reject every
      // booking with 22007 (invalid input syntax for type date).
      category: category!,
      date: date!,
      time: time!,
      notes,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    setBooked(result.data);
    toast("Call scheduled");
  }

  if (booked) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-2xl">Your call is scheduled</h2>

        <dl className="mt-2 grid w-full max-w-xs gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="font-semibold">{booked.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Category</dt>
            <dd className="font-medium">{booked.category}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="font-medium">{formatDate(booked.date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Time</dt>
            <dd className="font-medium">{booked.time}</dd>
          </div>
        </dl>

        <p className="text-sm text-muted-foreground">
          We&apos;ll call the number on your account. Nothing is ordered
          until you confirm on the call.
        </p>
        <Button
          className="mt-2"
          render={<Link href="/contractor">Back to dashboard</Link>}
        />
      </div>
    );
  }

  return (
    <WizardFrame
      steps={STEPS}
      current={step}
      canContinue={canContinue}
      submitting={submitting}
      nextLabel={step === STEPS.length - 1 ? "Confirm Call" : "Continue"}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={handleNext}
    >
      {step === 0 ? (
        <WizardStep title="What do you need help ordering?">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((option) => (
              <OptionCard
                key={option.id}
                label={option.label}
                icon={option.icon}
                selected={category === option.id}
                onSelect={() => setCategory(option.id)}
              />
            ))}
          </div>
        </WizardStep>
      ) : null}

      {step === 1 ? (
        <WizardStep title="Choose a date" helper="Weekdays only — the call desk is closed on weekends.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {dates.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDate(option.value)}
                aria-pressed={date === option.value}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-medium transition-all",
                  date === option.value
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        </WizardStep>
      ) : null}

      {step === 2 ? (
        <WizardStep title="Choose a time">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AVAILABLE_TIMES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTime(option)}
                aria-pressed={time === option}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3.5 text-sm font-medium transition-all",
                  time === option
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                {option}
              </button>
            ))}
          </div>
        </WizardStep>
      ) : null}

      {step === 3 ? (
        <WizardStep
          title="Anything we should know?"
          helper="Optional — quantities, site access, deadlines."
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="call-notes">Notes</Label>
            <Textarea
              id="call-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need 40 sheets of drywall delivered before Friday."
            />
          </div>
        </WizardStep>
      ) : null}

      {step === 4 ? (
        <WizardStep title="Confirm your call">
          <ReviewStep
            rows={[
              { label: "Category", value: category ?? "" },
              { label: "Date", value: dateLabel },
              { label: "Time", value: time ?? "" },
              { label: "Notes", value: notes || "None" },
            ]}
            note="An ordering specialist will call you to walk through quantities and delivery."
          />
        </WizardStep>
      ) : null}
    </WizardFrame>
  );
}
