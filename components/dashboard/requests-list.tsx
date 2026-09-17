"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useAsyncData } from "@/lib/store/hooks";
import { getAllMyRequests } from "@/services/service-requests";
import { formatDate } from "@/lib/format";

/**
 * Everything the signed-in user has asked us for — repair, renovation,
 * construction AND premium package requests. Until this existed those
 * forms were write-only; premium requests stayed invisible even after
 * this list appeared, because they live in their own table.
 */
export function RequestsList({ limit }: { limit?: number }) {
  const { data, loading, error, reload } = useAsyncData(getAllMyRequests);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: limit ?? 2 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load your requests"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const requests = data ?? [];
  const visible = limit ? requests.slice(0, limit) : requests;

  if (visible.length === 0) {
    return (
      <EmptyState
        icon="ClipboardList"
        title="No requests yet"
        description="Repair and project requests you send us appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {visible.map((request) => (
        <li
          key={request.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium capitalize">
              {request.serviceType.replace(/_/g, " ")}
              {request.category ? ` · ${request.category}` : ""}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {request.reference} · {formatDate(request.createdAt)}
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {request.status.replace(/_/g, " ")}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
