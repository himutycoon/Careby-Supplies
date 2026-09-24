"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Check, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WizardFrame } from "@/components/wizard-kit/wizard-frame";
import { useToast } from "@/components/shared/toast";
import { createScopedPackage } from "@/services/package-scope";
import {
  generateScope,
  groupByRoom,
  defaultAnswersForTemplate,
  adjustersForTemplate,
} from "@/lib/rules/package-scope";
import {
  EXTENT_OPTIONS,
  LOCATION_OPTIONS,
  groupsForPath,
  packageTemplate,
  templatesForPath,
  type WorkExtent,
  type WorkLocation,
} from "@/data/packages/templates";
import { TIER_LABELS, type BudgetTier } from "@/data/packages/selection-items";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = ["Project", "Scope", "Checklist", "Customer", "Send"];

/** One selectable card. Three questions in step 1 all look the same. */
function ChoiceCard({
  selected,
  label,
  description,
  onSelect,
}: {
  selected: boolean;
  label: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "press-sm rounded-xl border p-3.5 text-left transition-colors",
        selected
          ? "border-primary bg-accent"
          : "border-border hover:border-primary/40",
      )}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

/**
 * Contractor package builder, following the Customer Flow sheet.
 *
 * Steps 1–5 of that sheet: choose a template, choose a tier, answer the
 * adjusters, let the system generate the selection list, then set the
 * customer and send one link. The contractor can drop generated lines
 * before sending — "Contractor controls scope" — but cannot invent new
 * ones here, because every line carries an allowance derived from the
 * taxonomy.
 */
export function PackageScopeBuilder() {
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);

  // Step 1 narrows before it lists: location, then extent, then the
  // handful of templates that survive both.
  const [location, setLocation] = React.useState<WorkLocation | null>(null);
  const [extent, setExtent] = React.useState<WorkExtent | null>(null);
  const [templateId, setTemplateId] = React.useState<string>("");
  const [tier, setTier] = React.useState<BudgetTier>("medium");
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [excluded, setExcluded] = React.useState<Set<string>>(new Set());
  const [details, setDetails] = React.useState({
    name: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [created, setCreated] = React.useState<{
    reference: string;
    requirementCount: number;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const template = templateId ? packageTemplate(templateId) : undefined;

  const scope = React.useMemo(
    () =>
      template
        ? generateScope({ templateId: template.id, tier, adjusters: answers })
        : null,
    [template, tier, answers],
  );

  const kept = React.useMemo(
    () => scope?.requirements.filter((r) => !excluded.has(r.itemId)) ?? [],
    [scope, excluded],
  );

  const keptRequired = kept.filter((r) => r.required);
  const keptAllowance = kept.reduce((sum, r) => sum + r.totalAllowanceCad, 0);

  function chooseLocation(next: WorkLocation) {
    setLocation(next);
    setExtent(null);
    setTemplateId("");
  }

  function chooseExtent(next: WorkExtent) {
    setExtent(next);
    setTemplateId("");
  }

  function chooseTemplate(id: string) {
    const next = packageTemplate(id);
    if (!next) return;
    setTemplateId(id);
    setTier(next.defaultTier);
    // Each template starts from its own answers, so switching template
    // cannot carry a previous job's shower answer into a deck.
    setAnswers(defaultAnswersForTemplate(next));
    setExcluded(new Set());
    setDetails((d) => ({ ...d, name: d.name || next.name }));
  }

  function toggleExcluded(itemId: string) {
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  const detailsValid =
    details.name.trim().length > 0 &&
    details.customerName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.customerEmail.trim());

  const canContinue =
    (step === 0 && Boolean(template)) ||
    step === 1 ||
    (step === 2 && kept.length > 0) ||
    (step === 3 && detailsValid);

  async function handleNext() {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (!template) return;

    setSubmitting(true);
    const result = await createScopedPackage({
      name: details.name,
      templateId: template.id,
      tier,
      adjusters: answers,
      customer: {
        name: details.customerName,
        email: details.customerEmail,
        phone: details.customerPhone,
      },
      excludedItemIds: [...excluded],
    });
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    setCreated(result.data);
    setStep(4);
    toast(`Package ${result.data.reference} created`);
  }

  const portalUrl = created
    ? `${typeof window === "undefined" ? "" : window.location.origin}/customer/package/${created.reference}`
    : "";

  if (created) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-xl">Package {created.reference} is ready</h2>
        <p className="text-muted-foreground">
          {created.requirementCount} selections generated. Send this one
          link — every decision your customer needs is behind it.
        </p>
        <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-sm">{portalUrl}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(portalUrl).then(
                () => {
                  setCopied(true);
                  toast("Link copied");
                  setTimeout(() => setCopied(false), 1600);
                },
                () => toast("Couldn't copy the link", "error"),
              );
            }}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/contractor/packages">All packages</Link>} />
          <Button
            variant="outline"
            render={<Link href="/contractor/packages/new">Create another</Link>}
          />
        </div>
      </div>
    );
  }

  return (
    <WizardFrame
      steps={STEPS}
      current={step}
      canContinue={canContinue}
      submitting={submitting}
      nextLabel={step === 3 ? "Create package and link" : "Continue"}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={handleNext}
      aside={
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Scope</h2>
          {template ? (
            <>
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {template.baseScope}
              </p>
              <dl className="mt-1 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Tier</dt>
                  <dd className="font-medium">{TIER_LABELS[tier]}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Selections</dt>
                  <dd className="font-medium tabular-nums">
                    {kept.length}{" "}
                    <span className="text-muted-foreground">
                      ({keptRequired.length} required)
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Allowance</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCad(keptAllowance)}
                  </dd>
                </div>
              </dl>
              {/*
                Exclusions are the sheet's own wording. They are a promise
                about what the customer is NOT buying, so they travel with
                the package rather than living in a contractor's head.
              */}
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Not included:{" "}
                </span>
                {template.exclusions}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a template to see the scope.
            </p>
          )}
        </div>
      }
    >
      {step === 0 ? (
        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-lg font-medium">
              Where is the work?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {LOCATION_OPTIONS.map((option) => (
                <ChoiceCard
                  key={option.value}
                  selected={location === option.value}
                  label={option.label}
                  description={option.description}
                  onSelect={() => chooseLocation(option.value)}
                />
              ))}
            </div>
          </fieldset>

          {location ? (
            <fieldset className="flex flex-col gap-3 border-t border-border pt-6">
              <legend className="text-lg font-medium">How much of it?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {EXTENT_OPTIONS[location].map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={extent === option.value}
                    label={option.label}
                    description={option.description}
                    onSelect={() => chooseExtent(option.value)}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}

          {location && extent ? (
            <fieldset className="flex flex-col gap-5 border-t border-border pt-6">
              <legend className="text-lg font-medium">
                Pick the closest package
              </legend>
              {groupsForPath(location, extent).map((group) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {group}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {templatesForPath(location, extent)
                      .filter((t) => t.group === group)
                      .map((t) => (
                        <ChoiceCard
                          key={t.id}
                          selected={templateId === t.id}
                          label={t.name}
                          description={t.baseScope}
                          onSelect={() => chooseTemplate(t.id)}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </fieldset>
          ) : null}
        </div>
      ) : null}

      {step === 1 && template ? (
        <fieldset className="flex flex-col gap-6">
          <legend className="text-lg font-medium">Set the scope</legend>

          <div>
            <Label className="mb-2 block">Budget tier</Label>
            <div className="flex flex-wrap gap-2">
              {template.tiers.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTier(option)}
                  aria-pressed={tier === option}
                  className={cn(
                    "press-sm rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    tier === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {TIER_LABELS[option]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Tier moves the allowance and product tier. It does not change
              which decisions the customer makes.
            </p>
          </div>

          {adjustersForTemplate(template)
            .filter((a) => a.id !== "budgetTier")
            .map((a) => (
              <div key={a.id}>
                <Label className="mb-2 block">{a.label}</Label>
                <div className="flex flex-wrap gap-2">
                  {a.choices.map((choice) => {
                    const active =
                      (answers[a.id] ?? a.defaultValue) === choice.value;
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [a.id]: choice.value,
                          }))
                        }
                        aria-pressed={active}
                        className={cn(
                          "press-sm rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "border-primary bg-accent font-medium"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {a.effect}
                </p>
              </div>
            ))}
        </fieldset>
      ) : null}

      {step === 2 && scope ? (
        <fieldset className="flex flex-col gap-5">
          <legend className="text-lg font-medium">
            Generated selection list
          </legend>
          <p className="text-sm text-muted-foreground">
            {kept.length} decisions from {scope.requirements.length} generated.
            Uncheck anything this job does not include — the customer only
            ever sees what is left.
          </p>

          {scope.flags.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3.5">
              <p className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                Coordination needed
              </p>
              <ul className="list-disc pl-5 text-sm text-foreground/80">
                {scope.flags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Shown to you only — the customer&apos;s list stays decisions,
                not rough-ins.
              </p>
            </div>
          ) : null}

          {groupByRoom(scope.requirements).map(({ room, items }) => (
            <div key={room}>
              <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {room}
              </p>
              <ul className="flex flex-col gap-1.5">
                {items.map((requirement) => {
                  const on = !excluded.has(requirement.itemId);
                  return (
                    <li key={requirement.itemId}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          on ? "border-border" : "border-dashed border-border opacity-55",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleExcluded(requirement.itemId)}
                          className="size-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {requirement.label}
                            </span>
                            {requirement.quantity > 1 ? (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                × {requirement.quantity}
                              </span>
                            ) : null}
                            <Badge
                              variant={requirement.required ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {requirement.required ? "Required" : "Optional"}
                            </Badge>
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {requirement.reason}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-medium tabular-nums">
                          {formatCad(requirement.totalAllowanceCad)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset className="flex flex-col gap-5">
          <legend className="text-lg font-medium">Customer</legend>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-name">Package name</Label>
            <Input
              id="pkg-name"
              value={details.name}
              onChange={(e) =>
                setDetails((d) => ({ ...d, name: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pkg-customer">Customer name</Label>
              <Input
                id="pkg-customer"
                value={details.customerName}
                onChange={(e) =>
                  setDetails((d) => ({ ...d, customerName: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pkg-email">Customer email</Label>
              <Input
                id="pkg-email"
                type="email"
                value={details.customerEmail}
                onChange={(e) =>
                  setDetails((d) => ({ ...d, customerEmail: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor="pkg-phone">Customer phone</Label>
            <Input
              id="pkg-phone"
              value={details.customerPhone}
              onChange={(e) =>
                setDetails((d) => ({ ...d, customerPhone: e.target.value }))
              }
            />
          </div>
          <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Creating the package generates {kept.length} selections and one
              customer link. Nothing is sent automatically — you copy the
              link and send it yourself.
            </span>
          </p>
        </fieldset>
      ) : null}
    </WizardFrame>
  );
}
