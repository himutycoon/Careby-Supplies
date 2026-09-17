"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { useAsyncData, useRealtimeRefresh } from "@/lib/store/hooks";
import {
  getAllCallOrders,
  getAllContactMessages,
  getAllDrawings,
  getAllOrders,
  getAllPremiumRequests,
  getAllProjects,
  getAllServiceRequests,
  updateRecordStatus,
  type AdminRow,
} from "@/services/admin";
import { formatDate } from "@/lib/format";

/**
 * Loaders are looked up by key rather than passed in as props — a
 * function can't cross the server → client boundary, and these pages
 * are Server Components.
 */
const LOADERS: Record<string, () => Promise<AdminRow[]>> = {
  orders: getAllOrders,
  projects: getAllProjects,
  requests: getAllServiceRequests,
  calls: getAllCallOrders,
  drawings: getAllDrawings,
  premium: getAllPremiumRequests,
  messages: getAllContactMessages,
};

export type AdminSource = keyof typeof LOADERS;

/**
 * Shared admin list screen: search, table, status update.
 * Used by orders, projects, requests, calls and drawings so those
 * screens stay consistent instead of five near-identical tables.
 */
export function AdminRecordTable({
  source,
  table,
  statuses,
  statusColumn = "status",
  columnLabels = { reference: "Reference", label: "Name", sublabel: "Detail" },
  emptyTitle,
  emptyDescription,
}: {
  source: AdminSource;
  table: string;
  statuses: string[];
  statusColumn?: string;
  columnLabels?: { reference: string; label: string; sublabel: string };
  emptyTitle: string;
  emptyDescription: string;
}) {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(
    () => LOADERS[source](),
    [source],
  );
  const [search, setSearch] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // New orders/requests land in the list without a manual refresh.
  useRealtimeRefresh(table, reload);

  const rows = React.useMemo(() => {
    const all = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (row) =>
        row.reference.toLowerCase().includes(term) ||
        row.label.toLowerCase().includes(term) ||
        row.sublabel.toLowerCase().includes(term),
    );
  }, [data, search]);

  async function changeStatus(id: string, status: string) {
    setPendingId(id);
    const result = await updateRecordStatus(table, id, status, statusColumn);
    setPendingId(null);

    if (result.ok) {
      toast("Status updated");
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load records"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          aria-label="Search records"
          className="pl-9 md:pl-9"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="Boxes"
          title={search ? "Nothing matches that search" : emptyTitle}
          description={search ? "Try a different term." : emptyDescription}
        />
      ) : (
        <>
          {/* Stacked cards below lg — six columns can't be read on a
              phone, and horizontal scrolling hides the status control. */}
          {/* Dense rows on phones: reference + status on line one, the
              supporting detail on line two, status control inline. A
              roomy card per record meant scrolling to see three. */}
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background lg:hidden">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-1.5 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {row.reference}
                  </p>
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-1.5 py-0 text-[10px] capitalize"
                  >
                    {row.status.replace("_", " ")}
                  </Badge>
                </div>

                <p className="truncate text-xs text-muted-foreground">
                  <span className="capitalize">{row.label}</span>
                  {row.sublabel ? ` · ${row.sublabel}` : ""} ·{" "}
                  {formatDate(row.createdAt)}
                </p>

                <select
                  value={row.status}
                  disabled={pendingId === row.id}
                  onChange={(e) => changeStatus(row.id, e.target.value)}
                  aria-label={`Update status for ${row.reference}`}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs capitalize focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-border bg-background lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{columnLabels.reference}</TableHead>
                <TableHead>{columnLabels.label}</TableHead>
                <TableHead>{columnLabels.sublabel}</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {row.reference}
                  </TableCell>
                  <TableCell className="capitalize">{row.label}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.sublabel || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {row.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <select
                      value={row.status}
                      disabled={pendingId === row.id}
                      onChange={(e) => changeStatus(row.id, e.target.value)}
                      aria-label={`Update status for ${row.reference}`}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs capitalize focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </>
      )}
    </div>
  );
}
