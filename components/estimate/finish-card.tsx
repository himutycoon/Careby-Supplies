import { Card } from "@/components/ui/card";
import { ConditionBadge } from "@/components/shared/condition-badge";
import type { Finish } from "@/lib/types";

const SURFACE_LABELS: Record<Finish["surface"], string> = {
  floor: "Floor",
  wall: "Wall",
  ceiling: "Ceiling",
  counter: "Counter",
};

export function FinishCard({ finish }: { finish: Finish }) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium">{SURFACE_LABELS[finish.surface]}</h4>
        <ConditionBadge condition={finish.condition} />
      </div>
      <p className="text-xs text-muted-foreground">{finish.material}</p>
    </Card>
  );
}
