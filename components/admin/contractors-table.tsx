"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getContractors, setContractorVerification } from "@/services/admin";
import { formatDate } from "@/lib/format";

const ACTIONS = [
  { status: "verified" as const, label: "Approve", variant: "default" as const },
  { status: "rejected" as const, label: "Reject", variant: "outline" as const },
  { status: "suspended" as const, label: "Suspend", variant: "outline" as const },
];

export function ContractorsTable() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getContractors);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function setStatus(
    userId: string,
    status: "verified" | "rejected" | "suspended",
  ) {
    setPendingId(userId);
    const result = await setContractorVerification(userId, status);
    setPendingId(null);

    if (result.ok) {
      toast(`Contractor ${status}`);
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load contractors"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  if ((data ?? []).length === 0) {
    return (
      <EmptyState
        icon="HardHat"
        title="No contractor profiles yet"
        description="Contractor business details appear here once they complete their profile."
      />
    );
  }

  return (
    <>
      {/* Cards below lg — three action buttons plus five data columns
          can't share a phone-width row. */}
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background lg:hidden">
        {(data ?? []).map((contractor) => (
          <li
            key={contractor.userId}
            className="flex flex-col gap-1.5 px-3 py-2.5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold">
                {contractor.companyName || "Unnamed business"}
              </p>
              <Badge
                variant="secondary"
                className="shrink-0 px-1.5 py-0 text-[10px] capitalize"
              >
                {contractor.verificationStatus}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {contractor.city || "No city"} ·{" "}
              {contractor.licenseNumber || "No licence"} ·{" "}
              {formatDate(contractor.createdAt)}
            </p>
            <div className="flex gap-1.5">
              {ACTIONS.map((action) => (
                <Button
                  key={action.status}
                  size="sm"
                  variant={action.variant}
                  className="press h-8 flex-1 text-xs"
                  disabled={
                    pendingId === contractor.userId ||
                    contractor.verificationStatus === action.status
                  }
                  onClick={() => setStatus(contractor.userId, action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-background lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>License</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((contractor) => (
            <TableRow key={contractor.userId}>
              <TableCell className="font-medium">
                {contractor.companyName || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contractor.licenseNumber || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contractor.city || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(contractor.createdAt)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {contractor.verificationStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {ACTIONS.map((action) => (
                    <Button
                      key={action.status}
                      size="sm"
                      variant={action.variant}
                      disabled={
                        pendingId === contractor.userId ||
                        contractor.verificationStatus === action.status
                      }
                      onClick={() => setStatus(contractor.userId, action.status)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
