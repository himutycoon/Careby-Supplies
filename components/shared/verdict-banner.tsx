import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { EstimateVerdict } from "@/lib/types";
import { cn } from "@/lib/utils";

const VERDICT_CONFIG: Record<
  EstimateVerdict,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  "within-budget": {
    label: "Within budget",
    className: "bg-success text-success-foreground",
    icon: CheckCircle2,
  },
  tight: {
    label: "Tight",
    className: "bg-warning text-warning-foreground",
    icon: AlertTriangle,
  },
  "over-budget": {
    label: "Over budget",
    className: "bg-destructive text-white",
    icon: XCircle,
  },
};

export function VerdictBanner({
  verdict,
  subtext,
  className,
}: {
  verdict: EstimateVerdict;
  subtext?: string;
  className?: string;
}) {
  const config = VERDICT_CONFIG[verdict];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3",
        config.className,
        className,
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold leading-tight">{config.label}</p>
        {subtext ? (
          <p className="text-sm opacity-90 leading-tight">{subtext}</p>
        ) : null}
      </div>
    </div>
  );
}
