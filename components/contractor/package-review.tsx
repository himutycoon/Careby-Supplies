"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  History,
  Lock,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import {
  approvePackage,
  getPackageVersions,
  getProcurementList,
  getScopedPackage,
  procurementCsv,
  requestReplacement,
  type PackageVersion,
  type ProcurementLine,
  type ScopedPackage,
} from "@/services/package-flow";
import { checkCompleteness } from "@/lib/rules/package-scope";
import { TIER_LABELS } from "@/data/packages/selection-items";
import { packageTemplate } from "@/data/packages/templates";
import { formatCad, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Contractor review — Customer Flow steps 10 to 13.
 *
 * Approve or send single lines back, lock a version, then work the
 * procurement list. "Only exceptions require communication": rejecting
 * one line leaves the rest of the package alone.
 */
export function PackageReview({ reference }: { reference: string }) {
  const { toast } = useToast();
  const [pkg, setPkg] = React.useState<ScopedPackage | null>(null);
  const [versions, setVersions] = React.useState<PackageVersion[]>([]);
  const [procurement, setProcurement] = React.useState<ProcurementLine[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [comments, setComments] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reload = React.useCallback(async () => {
    const data = await getScopedPackage(reference);
    setPkg(data);
    if (data) {
      const [v, p] = await Promise.all([
        getPackageVersions(data.dbId),
        getProcurementList(data.dbId),
      ]);
      setVersions(v);
      setProcurement(p);
    }
    setLoaded(true);
  }, [reference]);

  // Same reason as the customer portal: setState lands in the callback,
  // not in the effect body.
  React.useEffect(() => {
    let cancelled = false;
    getScopedPackage(reference)
      .then(async (data) => {
        if (cancelled || !data) return { data: null, v: [], p: [] };
        const [v, p] = await Promise.all([
          getPackageVersions(data.dbId),
          getProcurementList(data.dbId),
        ]);
        return { data, v, p };
      })
      .then((result) => {
        if (cancelled) return;
        setPkg(result.data);
        setVersions(result.v);
        setProcurement(result.p);
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
        description="This package doesn't exist, or it belongs to another account."
        action={
          <Button render={<Link href="/contractor/packages">All packages</Link>} />
        }
      />
    );
  }

  const template = pkg.templateId ? packageTemplate(pkg.templateId) : undefined;
  const chosenIds = pkg.selections.filter((s) => s.productId).map((s) => s.itemId);
  const completeness = checkCompleteness(pkg.selections, chosenIds);
  const approved = pkg.status === "approved" || pkg.status === "ordered";

  const allowanceTotal = pkg.selections.reduce(
    (sum, s) => sum + s.totalAllowanceCad,
    0,
  );
  const selectedTotal = pkg.selections.reduce(
    (sum, s) => sum + (s.selectedPriceCad ?? 0) * s.quantity,
    0,
  );
  const difference = Math.round((selectedTotal - allowanceTotal) * 100) / 100;

  const portalUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/customer/package/${pkg.reference}`;

  async function handleApprove() {
    if (!pkg) return;
    setBusy(true);
    const result = await approvePackage(pkg.dbId, comments);
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(`Approved as version ${result.data.version}`);
    setComments("");
    reload();
  }

  async function handleReject(selectionId: string, label: string) {
    setBusy(true);
    const result = await requestReplacement(
      selectionId,
      "Your contractor asked for a different choice.",
    );
    setBusy(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(`Sent ${label} back to the customer`);
    reload();
  }

  function downloadCsv() {
    const csv = procurementCsv(procurement);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pkg?.reference ?? "package"}-procurement.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{pkg.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {pkg.reference}
            {template ? ` · ${template.name}` : ""} · {TIER_LABELS[pkg.tier]}
          </p>
          <p className="text-sm text-muted-foreground">
            {pkg.customer.name} · {pkg.customer.email}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {pkg.status}
        </Badge>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <code className="min-w-0 flex-1 truncate text-sm">{portalUrl}</code>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(portalUrl).then(
              () => toast("Link copied"),
              () => toast("Couldn't copy the link", "error"),
            );
          }}
        >
          <Copy className="size-3.5" /> Copy link
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Customer progress</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {completeness.chosen}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {completeness.requiredCount}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Allowance</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCad(allowanceTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            {difference >= 0 ? "Upgrade" : "Credit"}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              difference > 0
                ? "text-warning-foreground dark:text-warning"
                : "text-success",
            )}
          >
            {difference >= 0 ? "+" : "−"}
            {formatCad(Math.abs(difference))}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg">Selections</h2>
        {pkg.selections.map((selection) => (
          <div
            key={selection.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
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
                {selection.status === "rejected" ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Sent back
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {selection.room} · allowance{" "}
                {formatCad(selection.totalAllowanceCad)}
                {selection.selectedPriceCad
                  ? ` · chosen ${formatCad(selection.selectedPriceCad)}`
                  : " · not chosen yet"}
              </p>
            </div>
            {selection.productId && !approved ? (
              <Button
                size="sm"
                variant="ghost"
                className="press shrink-0"
                disabled={busy}
                onClick={() => handleReject(selection.id, selection.label)}
              >
                <Undo2 className="size-3.5" /> Ask again
              </Button>
            ) : null}
          </div>
        ))}
      </section>

      {!approved ? (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg">Approve and lock</h2>
          {!completeness.complete ? (
            <p className="flex items-start gap-2 text-sm">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">
                {completeness.missing.length} required selection
                {completeness.missing.length === 1 ? "" : "s"} still open, so
                this cannot be approved yet.
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Approving saves a version snapshot. Changing anything afterwards
              creates a new version rather than overwriting this one.
            </p>
          )}
          <Input
            placeholder="Approval note (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <Button
            className="press w-fit"
            disabled={!completeness.complete || busy}
            onClick={handleApprove}
          >
            <Lock className="size-4" /> Approve version{" "}
            {(versions[0]?.version ?? 0) + 1}
          </Button>
        </section>
      ) : null}

      {procurement.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg">Procurement list</h2>
            <Button size="sm" variant="outline" onClick={downloadCsv}>
              <Download className="size-3.5" /> Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Lead time</th>
                </tr>
              </thead>
              <tbody>
                {procurement.map((line) => (
                  <tr key={line.selectionId} className="border-t border-border">
                    <td className="px-3 py-2">
                      {line.label}
                      <span className="block text-xs text-muted-foreground">
                        {line.room}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {line.productName}
                      <span className="block text-xs text-muted-foreground">
                        {line.brand}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{line.sku || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {line.quantity}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCad(line.totalPriceCad)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {line.leadTime || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {versions.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-lg">
            <History className="size-4 text-primary" aria-hidden="true" />
            Approval history
          </h2>
          <ul className="flex flex-col gap-2">
            {versions.map((version) => (
              <li
                key={version.version}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
              >
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                <span className="font-medium">Version {version.version}</span>
                <span className="text-muted-foreground">
                  {formatDate(version.createdAt)} · {version.lineCount} lines
                </span>
                {version.comments ? (
                  <span className="text-muted-foreground">
                    “{version.comments}”
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
