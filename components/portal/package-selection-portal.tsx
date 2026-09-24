"use client";

import * as React from "react";
import { SuppliesOnlyNotice } from "@/components/shared/supplies-only-notice";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  MessageCircle,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelSkeleton } from "@/components/shared/skeleton";
import { ProductImage } from "@/components/shop/product-image";
import { useToast } from "@/components/shared/toast";
import { productsForRequirement } from "@/services/package-scope";
import {
  chooseProduct,
  clearChoice,
  getScopedPackage,
  setFinishPalette,
  submitSelections,
  type ScopedPackage,
} from "@/services/package-flow";
import { allowanceDelta, checkCompleteness } from "@/lib/rules/package-scope";
import {
  FINISH_OPTIONS,
  TIER_LABELS,
  finishApplies,
} from "@/data/packages/selection-items";
import { packageTemplate } from "@/data/packages/templates";
import { CONTACT_INFO, WHATSAPP_URL } from "@/data/mock";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * The one-link customer portal — Customer Flow steps 6 to 9.
 *
 * Every decision for the job is behind this link, grouped by room, with
 * the allowance and the upgrade or credit visible before submission.
 * The submit button stays disabled while a required selection is open:
 * the sheet is explicit that the system "should not allow 'done' while
 * required selections remain unresolved."
 *
 * The customer never sees rough-ins, coordination flags or the reason a
 * line is in scope — those are contractor-facing and stay behind.
 */
export function PackageSelectionPortal({ reference }: { reference: string }) {
  const { toast } = useToast();
  const [pkg, setPkg] = React.useState<ScopedPackage | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const reload = React.useCallback(async () => {
    const data = await getScopedPackage(reference);
    setPkg(data);
    setLoaded(true);
  }, [reference]);

  /*
   * State is set in the promise callback rather than by calling reload()
   * in the effect body: React's lint rule treats a synchronous setState
   * inside an effect as a cascading render, and the cancelled flag stops
   * a slow response from a previous reference landing on this one.
   */
  React.useEffect(() => {
    let cancelled = false;
    getScopedPackage(reference).then((data) => {
      if (cancelled) return;
      setPkg(data);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        <PanelSkeleton rows={2} />
        <PanelSkeleton rows={5} />
      </div>
    );
  }

  if (!pkg) {
    return (
      <EmptyState
        icon="Package"
        title="Package not found"
        description="Check the reference on your email or quote — it should look like PKG-XXXXXX. If it still doesn't open, ask your contractor to resend the link."
      />
    );
  }

  const template = pkg.templateId ? packageTemplate(pkg.templateId) : undefined;
  const chosenIds = pkg.selections.filter((s) => s.productId).map((s) => s.itemId);
  const completeness = checkCompleteness(pkg.selections, chosenIds);

  const allowanceTotal = pkg.selections.reduce(
    (sum, s) => sum + s.totalAllowanceCad,
    0,
  );
  const selectedTotal = pkg.selections.reduce(
    (sum, s) => sum + (s.selectedPriceCad ?? 0) * s.quantity,
    0,
  );
  const difference = Math.round((selectedTotal - allowanceTotal) * 100) / 100;

  const locked = pkg.status === "approved" || pkg.status === "ordered";
  const submitted = Boolean(pkg.submittedAt);

  const rooms = [...new Set(pkg.selections.map((s) => s.room))];

  async function handleSubmit() {
    if (!pkg) return;
    setSubmitting(true);
    const result = await submitSelections(pkg.dbId);
    setSubmitting(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Selections submitted — your contractor has been notified.");
    reload();
  }

  async function handleFinish(finish: string) {
    if (!pkg) return;
    const next = pkg.finishPalette === finish ? "" : finish;
    const result = await setFinishPalette(pkg.dbId, next);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    setPkg({ ...pkg, finishPalette: next });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl">{pkg.name}</h1>
          <Badge variant="secondary" className="capitalize">
            {pkg.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {pkg.reference}
          {template ? ` · ${template.name}` : ""} ·{" "}
          {TIER_LABELS[pkg.tier]} allowance
        </p>
        {template ? (
          <p className="text-sm text-muted-foreground">{template.baseScope}</p>
        ) : null}
      </header>

      {/* The customer arrives here from their contractor and may never
          have seen the rest of the site. Say once what this list is. */}
      <SuppliesOnlyNotice>
        <span className="font-medium text-foreground">
          These are the materials for your job.
        </span>{" "}
        CareBy Supplies delivers what you choose here. The work itself is
        done by your contractor, who priced their labour separately.
      </SuppliesOnlyNotice>

      {/* Progress and money, the two things a customer checks repeatedly. */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Decisions made</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {completeness.chosen}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {completeness.requiredCount}
            </span>
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={completeness.requiredCount}
            aria-valuenow={completeness.chosen}
            aria-label="Required selections completed"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{
                width: `${completeness.requiredCount === 0 ? 100 : (completeness.chosen / completeness.requiredCount) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Your allowance</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCad(allowanceTotal)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Selected so far {formatCad(selectedTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            {difference >= 0 ? "Upgrade" : "Credit"}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              difference > 0 ? "text-warning-foreground dark:text-warning" : "text-success",
            )}
          >
            {difference >= 0 ? "+" : "−"}
            {formatCad(Math.abs(difference))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {difference > 0
              ? "Above allowance — payable on top."
              : "Under allowance — credited back."}
          </p>
        </div>
      </section>

      {/* Finish palette: chosen once, applied to compatible products. */}
      {!locked ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="size-4 text-primary" aria-hidden="true" />
            Finish palette
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick once and we&apos;ll show matching taps, handles and fixtures
            first. You can still choose anything you like.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FINISH_OPTIONS.map((finish) => (
              <button
                key={finish}
                type="button"
                onClick={() => handleFinish(finish)}
                aria-pressed={pkg.finishPalette === finish}
                className={cn(
                  "press-sm rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  pkg.finishPalette === finish
                    ? "border-primary bg-accent font-medium"
                    : "border-border hover:border-primary/40",
                )}
              >
                {finish}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {submitted ? (
        <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-success"
            aria-hidden="true"
          />
          <p className="text-sm">
            <span className="font-medium">Selections submitted.</span> Your
            contractor is reviewing them. They&apos;ll be in touch about
            anything that needs a second look.
          </p>
        </div>
      ) : null}

      {rooms.map((room) => (
        <section key={room} className="flex flex-col gap-3">
          <h2 className="text-lg">{room}</h2>
          {pkg.selections
            .filter((s) => s.room === room)
            .map((selection) => (
              <SelectionRow
                key={selection.id}
                selection={selection}
                finish={pkg.finishPalette}
                locked={locked || submitted}
                onChanged={reload}
              />
            ))}
        </section>
      ))}

      {/* Exclusions travel with the package: what the customer is not buying. */}
      {pkg.exclusions ? (
        <p className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Not included: </span>
          {pkg.exclusions}
        </p>
      ) : null}

      {!submitted && !locked ? (
        <section className="sticky bottom-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
          {!completeness.complete ? (
            <p className="flex items-start gap-2 text-sm">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning"
                aria-hidden="true"
              />
              <span>
                <span className="font-medium">
                  {completeness.missing.length} still to choose:
                </span>{" "}
                <span className="text-muted-foreground">
                  {completeness.missing.map((m) => m.label).join(", ")}
                </span>
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-success">
              <Check className="size-4 shrink-0" aria-hidden="true" />
              Everything required is chosen.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              className="press"
              disabled={!completeness.complete || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting…" : "Submit my selections"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="press"
              render={
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> Ask a question
                </a>
              }
            />
          </div>
        </section>
      ) : null}

      {locked ? (
        <p className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          These selections are approved and locked. Contact{" "}
          {CONTACT_INFO.email} to change anything.
        </p>
      ) : null}
    </div>
  );
}

/**
 * One decision: what it is, what it costs against the allowance, and the
 * products that can satisfy it.
 *
 * Options load when the row is opened rather than on mount — a new build
 * generates 55 requirements, and fetching a category for each one on page
 * load would be 55 round trips for a page the customer scrolls past.
 */
function SelectionRow({
  selection,
  finish,
  locked,
  onChanged,
}: {
  selection: ScopedPackage["selections"][number];
  finish: string;
  locked: boolean;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Product[] | null>(null);
  const [busy, setBusy] = React.useState(false);

  const chosen = options?.find((p) => p.id === selection.productId) ?? null;
  const delta = selection.selectedPriceCad
    ? allowanceDelta(selection, selection.selectedPriceCad)
    : null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && options === null) {
      const items = await productsForRequirement(
        { categoryId: selection.categoryId, keywords: selection.keywords },
        12,
        finish,
      );
      setOptions(items);
    }
  }

  async function pick(product: Product) {
    setBusy(true);
    const result = await chooseProduct(selection.id, product.id);
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(`${product.name} selected`);
    setOpen(false);
    onChanged();
  }

  async function clear() {
    setBusy(true);
    const result = await clearChoice(selection.id);
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    onChanged();
  }

  const done = Boolean(selection.productId);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-colors",
        done ? "border-success/40" : "border-border",
        selection.status === "rejected" && "border-destructive/50",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {done ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <span className="text-xs font-semibold">
              {selection.required ? "!" : "?"}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {selection.label}
            {selection.quantity > 1 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                × {selection.quantity}
              </span>
            ) : null}
            {!selection.required ? (
              <Badge variant="secondary" className="text-[10px]">
                Optional
              </Badge>
            ) : null}
            {finish && finishApplies(selection.categoryId) ? (
              <Badge variant="outline" className="text-[10px]">
                {finish}
              </Badge>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            Allowance {formatCad(selection.totalAllowanceCad)}
            {delta ? (
              <>
                {" · "}
                <span
                  className={cn(
                    "font-medium",
                    delta.differenceCad > 0
                      ? "text-warning-foreground dark:text-warning"
                      : delta.differenceCad < 0
                        ? "text-success"
                        : "text-muted-foreground",
                  )}
                >
                  {delta.differenceCad === 0
                    ? "on allowance"
                    : delta.differenceCad > 0
                      ? `+${formatCad(delta.differenceCad)} upgrade`
                      : `${formatCad(Math.abs(delta.differenceCad))} credit`}
                </span>
              </>
            ) : null}
          </p>
          {selection.status === "rejected" ? (
            <p className="mt-1 text-xs text-destructive">
              Your contractor asked for a different choice here.
            </p>
          ) : null}
        </div>

        {!locked ? (
          <Button
            size="sm"
            variant={done ? "outline" : "default"}
            className="press shrink-0"
            onClick={toggle}
            aria-expanded={open}
          >
            {done ? "Change" : "Choose"}
            <ChevronDown
              className={cn("size-3.5 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
        ) : null}
      </div>

      {done && !open ? (
        <p className="border-t border-border px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Chosen: </span>
          <span className="font-medium">
            {chosen?.name ?? "Selected product"}
          </span>
          {selection.selectedPriceCad ? (
            <span className="text-muted-foreground">
              {" "}
              · {formatCad(selection.selectedPriceCad)} each
            </span>
          ) : null}
        </p>
      ) : null}

      {open ? (
        <div className="border-t border-border p-4">
          {options === null ? (
            <PanelSkeleton rows={2} />
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing in the catalogue matches this yet. Your contractor will
              source it and add it to your package.
            </p>
          ) : (
            <>
              <ul className="grid gap-2 sm:grid-cols-2">
                {options.map((product) => {
                  const optionDelta = allowanceDelta(
                    selection,
                    product.priceCad,
                  );
                  const isChosen = product.id === selection.productId;
                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => pick(product)}
                        className={cn(
                          "press-sm flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                          isChosen
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          sizeHint="thumb"
                          className="size-14 shrink-0 rounded-md border border-border"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-sm font-medium">
                            {product.name}
                          </span>
                          <span className="block text-xs text-muted-foreground tabular-nums">
                            {formatCad(product.priceCad)} each
                          </span>
                          <span
                            className={cn(
                              "block text-xs font-medium tabular-nums",
                              optionDelta.differenceCad > 0
                                ? "text-warning-foreground dark:text-warning"
                                : optionDelta.differenceCad < 0
                                  ? "text-success"
                                  : "text-muted-foreground",
                            )}
                          >
                            {optionDelta.differenceCad === 0
                              ? "On allowance"
                              : optionDelta.differenceCad > 0
                                ? `+${formatCad(optionDelta.differenceCad)}`
                                : `${formatCad(Math.abs(optionDelta.differenceCad))} back`}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {done ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="press mt-3"
                  disabled={busy}
                  onClick={clear}
                >
                  Clear this choice
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
