import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "in-review": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  delivered: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "in-review": "In Review",
  delivered: "Delivered",
};

export function StatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
