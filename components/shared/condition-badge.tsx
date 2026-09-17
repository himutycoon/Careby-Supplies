import { Badge } from "@/components/ui/badge";
import type { Condition } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONDITION_STYLES: Record<Condition, string> = {
  good: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  fair: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  poor: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

const CONDITION_LABELS: Record<Condition, string> = {
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export function ConditionBadge({
  condition,
  className,
}: {
  condition: Condition;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(CONDITION_STYLES[condition], className)}
    >
      {CONDITION_LABELS[condition]}
    </Badge>
  );
}
