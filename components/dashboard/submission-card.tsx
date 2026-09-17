import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCad, formatDate } from "@/lib/format";
import { ROOM_TYPE_OPTIONS } from "@/data/mock";
import type { Submission } from "@/lib/types";

export function SubmissionCard({ submission }: { submission: Submission }) {
  const roomLabel =
    ROOM_TYPE_OPTIONS.find((o) => o.value === submission.input.roomType)
      ?.label ?? submission.input.roomType;
  const isDelivered = submission.status === "delivered";

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {roomLabel} · {submission.input.scopeLevel.replace("-", " ")}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            Submitted {formatDate(submission.createdAt)}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="text-sm text-muted-foreground">
          Budget{" "}
          <span className="font-medium text-foreground">
            {formatCad(submission.input.budgetCad)}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={
            <Link href={isDelivered ? `/report/${submission.id}` : `/estimate/${submission.id}`}>
              {isDelivered ? "View report" : "View estimate"}
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />
      </div>
    </Card>
  );
}
