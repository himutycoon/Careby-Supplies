"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getDrawings, getDrawingSignedUrl } from "@/services/drawings";
import { formatDate } from "@/lib/format";

/**
 * Drawings previously uploaded by the signed-in user.
 *
 * Files live in a private bucket, so opening one mints a short-lived
 * signed URL on demand rather than storing a public link anywhere.
 */
export function DrawingsList() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getDrawings);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const drawings = data ?? [];

  async function openFile(id: string, filePath?: string) {
    if (!filePath) {
      toast("That file is no longer available.", "error");
      return;
    }

    setPendingId(id);
    const url = await getDrawingSignedUrl(filePath);
    setPendingId(null);

    if (!url) {
      toast("We couldn't open that drawing. Please try again.", "error");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load your drawings"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  if (drawings.length === 0) {
    return (
      <EmptyState
        icon="FileUp"
        title="No drawings yet"
        description="Drawings you upload appear here, with their material lists."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {drawings.map((drawing) => (
        <li
          key={drawing.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              <span className="truncate">{drawing.projectName}</span>
              <Badge
                variant={drawing.status === "ready" ? "default" : "secondary"}
              >
                {drawing.status === "ready" ? "Ready" : "In review"}
              </Badge>
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {drawing.id} · {drawing.drawingType || "Drawing"} ·{" "}
              {formatDate(drawing.createdAt)}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {drawing.fileNames.join(", ")}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="press w-full sm:w-auto"
            disabled={pendingId === drawing.id}
            onClick={() => openFile(drawing.id, drawing.filePath)}
          >
            {pendingId === drawing.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <Download className="size-3.5" /> Open file
              </>
            )}
          </Button>
        </li>
      ))}
    </ul>
  );
}
