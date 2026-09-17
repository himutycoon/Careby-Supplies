import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/shared/severity-badge";
import type { DetectedIssue } from "@/lib/types";

export function IssueList({ issues }: { issues: DetectedIssue[] }) {
  return (
    <div className="flex flex-col gap-3">
      {issues.map((issue) => (
        <Card key={issue.id} className="flex-row items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium">{issue.label}</h4>
              <SeverityBadge severity={issue.severity} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {issue.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Affected area: {issue.affectedArea}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
