"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getPackages, updatePackageStatus } from "@/services/packages";
import { formatCad, formatDate } from "@/lib/format";
import type { PackageStatus } from "@/lib/types";

const STATUSES: PackageStatus[] = ["draft", "sent", "approved", "ordered"];

export function PackagesList({ limit }: { limit?: number }) {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getPackages);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function changeStatus(dbId: string, status: PackageStatus) {
    setPendingId(dbId);
    const result = await updatePackageStatus(dbId, status);
    setPendingId(null);

    if (result.ok) {
      toast("Package updated");
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: limit ?? 3 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load packages"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const packages = data ?? [];
  const visible = limit ? packages.slice(0, limit) : packages;

  if (visible.length === 0) {
    return (
      <EmptyState
        icon="Package"
        title="No saved packages"
        description="Create a package to bundle materials for a customer and share a portal link with them."
        action={
          <Button
            render={
              <Link href="/contractor/packages/new">Create a package</Link>
            }
          />
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {visible.map((pkg) => (
        <li
          key={pkg.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
        >
          {/* The status control can't live inside the Link — nesting an
              interactive control in an anchor breaks keyboard use. */}
          <Link
            href={`/customer/package/${pkg.id}`}
            className="press-sm flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{pkg.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3" aria-hidden="true" />
                {formatDate(pkg.createdAt)} · {pkg.customer.name} ·{" "}
                {pkg.lines.length} {pkg.lines.length === 1 ? "item" : "items"}
              </p>
            </div>
            <span className="font-semibold tabular-nums">
              {formatCad(pkg.totalPrice ?? 0)}
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>

          {pkg.dbId ? (
            <select
              value={pkg.status}
              disabled={pendingId === pkg.dbId}
              onChange={(e) =>
                changeStatus(pkg.dbId!, e.target.value as PackageStatus)
              }
              aria-label={`Change status for ${pkg.name}`}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm capitalize focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-8 sm:w-auto"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
