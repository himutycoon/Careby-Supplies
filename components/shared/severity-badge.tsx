import { Badge } from "@/components/ui/badge";
import type { DetectedIssue } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<DetectedIssue["severity"], string> = {
  minor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  moderate: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  major: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

const SEVERITY_LABELS: Record<DetectedIssue["severity"], string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: DetectedIssue["severity"];
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(SEVERITY_STYLES[severity], className)}
    >
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}
