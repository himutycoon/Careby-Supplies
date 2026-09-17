import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConditionBadge } from "@/components/shared/condition-badge";
import type { Fixture } from "@/lib/types";

export function FixtureCard({ fixture }: { fixture: Fixture }) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium">{fixture.name}</h4>
        <ConditionBadge condition={fixture.condition} />
      </div>
      <p className="text-xs text-muted-foreground">
        Estimated age: {fixture.estimatedAge}
      </p>
      {fixture.replaceRecommended ? (
        <Badge variant="secondary" className="w-fit">
          Replacement recommended
        </Badge>
      ) : null}
    </Card>
  );
}
