import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import type { PermitCheck } from "@/lib/types";

export function PermitChecklist({ permits }: { permits: PermitCheck[] }) {
  return (
    <div className="flex flex-col gap-3">
      {permits.map((permit) => (
        <Card key={permit.id} className="flex-row items-start gap-3 p-4">
          {permit.required ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium">{permit.label}</h4>
              <Badge variant={permit.required ? "default" : "secondary"}>
                {permit.required ? "Likely required" : "Not required"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {permit.authority}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {permit.note}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
